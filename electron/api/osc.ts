import type OSC from 'osc-js';
import { settingApi } from '@electron/api/setting';
import { OSCQAccess, OSCQueryDiscovery, OSCQueryServer } from 'oscquery';
import { setTimeout } from 'node:timers/promises';
import type { OscStatus, SendMessage } from '@common/types';
import { ipcMain } from 'electron';
import { defeatCountApi } from '@electron/api/defeat-count';
import { noticeApi } from '@electron/api/notice';
import { useOscServer, type OscPayload } from '@electron/osc/osc-server';

type ListeningType = 'TARGET' | 'ALL' | 'UPRIGHT';

const basePort = 11337;
const minDiscoveryWaitMs = 3000;
const oscQueryPathWhenListenAllMessage = '/avatar/parameters/AngularY';
const oscQueryDiscovery = new OSCQueryDiscovery();

let discoveryStartAt = 0;
let oscQueryServer: OSCQueryServer | null = null;
let oscServer: OSC | null = null;
let oscStatus: OscStatus = 'CLOSE';
let isInitialized = false;
let sendMessage: SendMessage | null = null;

const sendMessageIfNotNull: SendMessage = (channel, ...args) => {
  if (sendMessage !== null) {
    sendMessage(channel, ...args);
  }
}

const changeOscStatus = (newOscStatus: OscStatus) => {
  oscStatus = newOscStatus;
  sendMessageIfNotNull('change-osc-status', newOscStatus);
}

const updateDefeatCount = () => {
  const newCount = defeatCountApi.incrementDefeatCount();
  sendMessageIfNotNull('update-defeat-count', newCount);
}

export const oscApi = {
  initialize(deps: { sendMessage: SendMessage }) {
    if (isInitialized) {
      return;
    }

    sendMessage = deps.sendMessage;

    ipcMain.handle('get-osc-status', () => this.getOscStatus());
    ipcMain.handle('start-listening', () => this.openServer('TARGET'));
    ipcMain.handle('start-listening-all', () => this.openServer('ALL'));
    ipcMain.handle('start-listening-upright', () => this.openServer('UPRIGHT'));
    ipcMain.handle('stop-listening', () => this.closeServer());

    isInitialized = true;
  },

  async openServer(listeningType: ListeningType) {
    const typeAddressMap = {
      TARGET: (await settingApi.getSetting('targetOscMessage'))
        .filter(m => m.enabled)
        .map(m => m.address),
      ALL: ['*'],
      UPRIGHT: ['/avatar/parameters/Upright'],
    } as const satisfies Record<ListeningType, string[]>

    const targetAddresses = typeAddressMap[listeningType];

    if (targetAddresses.length <= 0 || oscQueryServer !== null || oscServer !== null || oscStatus === 'PENDING') {
      // 対象のOSCメッセージが空配列か、OSCサーバのどちらかが開始中か開始済の場合
      return;
    }

    const prevOscStatus = oscStatus;
    changeOscStatus('PENDING');

    this.startDiscovery();

    // OSCサービスの検索開始から一定時間が経っていなければ、足りない分待つ
    const discoveryElapsed = Date.now() - discoveryStartAt;
    if (discoveryElapsed <= minDiscoveryWaitMs) {
      await setTimeout(minDiscoveryWaitMs - discoveryElapsed);
    }

    const services = oscQueryDiscovery.getServices();
    const notAvailablePorts = [
      ...services.map(service => service.port),
      ...services
        .filter(service => service.hostInfo.oscPort !== undefined)
        .map(service => service.hostInfo.oscPort as number) // 手前でundefinedを弾いているので型アサーションしてOK
    ];

    const onListen = (payload: OscPayload) => {
      // TODO: 対象メッセージだけでなく対象の値も設定できるようにする
      // NOTE: Uprightの受信を妨げないため0は通す
      if (!payload.args[0] && payload.args[0] !== 0) {
        return;
      }

      const handlers = {
        TARGET: () => updateDefeatCount(),
        ALL: () => sendMessageIfNotNull('listen-any-message', payload.address),
        UPRIGHT: () => sendMessageIfNotNull('listen-upright-value', payload.args[0]),
      } as const satisfies Record<ListeningType, () => void>;

      handlers[listeningType]();
    };

    const onOpen = () => {
      const typeStatusMap = {
        TARGET: 'OPEN',
        ALL: 'OPEN_ALL',
        UPRIGHT: 'OPEN_UPRIGHT',
      } as const satisfies Record<ListeningType, OscStatus>;

      changeOscStatus(typeStatusMap[listeningType]);

      noticeApi.createNotice({
        text: 'OSCメッセージの受信を開始しました',
        color: 'success',
      });
    };

    const onClose = () => {
      oscServer = null;
      changeOscStatus('CLOSE');

      noticeApi.createNotice({
        text: 'OSCメッセージの受信を停止しました',
        color: 'success',
      });
    };

    try {
      let usingPort = basePort;

      while (notAvailablePorts.includes(usingPort)) {
        if (usingPort >= 65536) {
          throw Error('Could not set OSC port');
        }
        usingPort++;
      }

      oscQueryServer = new OSCQueryServer({
        serviceName: 'DefeatFit',
        oscQueryHostName: 'DefeatFit',
        oscPort: usingPort,
        httpPort: usingPort,
      });

      if (listeningType === 'ALL') {
        // HACK: 全メッセージを表すパスがないため、VRChatから送信されるパスの1つを登録する
        oscQueryServer.addMethod(oscQueryPathWhenListenAllMessage, { access: OSCQAccess.WRITEONLY });
      }
      else {
        for (const address of targetAddresses) {
          oscQueryServer.addMethod(address, { access: OSCQAccess.WRITEONLY });
        }
      }

      await oscQueryServer.start(); // 念のためOSCサーバ開始前に開始させる

      oscServer = useOscServer(targetAddresses, {
        onOpen,
        onClose,
        onListen,
      });
      oscServer.open({ host: '0.0.0.0', port: usingPort });
    }
    catch (e) {
      changeOscStatus(prevOscStatus);

      noticeApi.createNotice({
        text: 'OSCメッセージの受信開始に失敗しました',
        color: 'error',
      });

      console.error(e);
      return;
    }
  },

  async closeServer() {
    const rejectStatus: OscStatus[] = ['PENDING', 'CLOSE'];
    if (
      oscServer === null ||
      oscQueryServer === null ||
      rejectStatus.includes(oscStatus)
    ) {
      return;
    }

    changeOscStatus('PENDING');

    await oscQueryServer.stop();
    oscQueryServer = null;
    oscServer.close();
  },

  getOscStatus() {
    return oscStatus;
  },

  // NOTE: Discoveryの操作メソッドは現状フロント側に公開する必要はなさそう

  startDiscovery() {
    oscQueryDiscovery.start();
    discoveryStartAt = Date.now();
  },

  stopDiscovery() {
    oscQueryDiscovery.stop();
    discoveryStartAt = 0;
  },
} as const;
