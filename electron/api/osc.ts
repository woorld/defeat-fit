import { settingApi } from '@electron/api/setting';
import { OSCQAccess, OSCQueryServer } from 'oscquery';
import type { OscStatus, SendMessage } from '@common/types';
import { ipcMain } from 'electron';
import { defeatCountApi } from '@electron/api/defeat-count';
import { noticeApi } from '@electron/api/notice';
import { useOscServer, type OscServer } from '@electron/osc/osc-server';
import dgram from 'node:dgram';

type ListeningType = 'TARGET_AND_UPRIGHT' | 'ALL' | 'UPRIGHT';

const basePort = 11337;
const oscQueryPathWhenListenAllMessage = '/avatar/parameters/AngularY';
const oscQueryPathUpright = '/avatar/parameters/Upright';

let oscQueryServer: OSCQueryServer | null = null;
let oscServer: OscServer | null = null;
let oscStatus: OscStatus = 'CLOSE';
let isInitialized = false;
let sendMessage: SendMessage | null = null;

const sendMessageIfNotNull: SendMessage = (channel, ...args) => {
  if (sendMessage !== null) {
    sendMessage(channel, ...args);
  }
};

const changeOscStatus = (newOscStatus: OscStatus) => {
  oscStatus = newOscStatus;
  sendMessageIfNotNull('change-osc-status', newOscStatus);
};

const updateDefeatCount = () => {
  const newCount = defeatCountApi.incrementDefeatCount();
  sendMessageIfNotNull('update-defeat-count', newCount);
};

const findFreeUdpPort = (startPort = basePort): Promise<number | null> => {
  return new Promise(resolve => {
    if (basePort <= -1 || basePort >= 65536) {
      resolve(null);
    }

    const socket = dgram.createSocket('udp4');
    socket.on('error', () => {
      socket.close();
      resolve(findFreeUdpPort(startPort + 1));
    });

    socket.bind(startPort, () => {
      const port = socket.address().port;
      socket.close(() => resolve(port));
    });
  });
};

export const oscApi = {
  initialize(deps: { sendMessage: SendMessage }) {
    if (isInitialized) {
      return;
    }

    sendMessage = deps.sendMessage;

    ipcMain.handle('get-osc-status', () => this.getOscStatus());
    ipcMain.handle('start-listening', () => this.openServer('TARGET_AND_UPRIGHT'));
    ipcMain.handle('start-listening-all', () => this.openServer('ALL'));
    ipcMain.handle('start-listening-upright', () => this.openServer('UPRIGHT'));
    ipcMain.handle('stop-listening', () => this.closeServer());

    isInitialized = true;
  },

  async openServer(listeningType: ListeningType) {
    const settingAddresses = (await settingApi.getSetting('targetOscMessage'))
      .filter(m => m.enabled)
      .map(m => m.address);

    const isSettingAddressEmpty = listeningType === 'TARGET_AND_UPRIGHT' && settingAddresses.length <= 0;
    const hasOpened = oscQueryServer !== null || oscServer !== null || oscStatus === 'PENDING';

    if (isSettingAddressEmpty || hasOpened) {
      // 対象のOSCメッセージが空配列か、OSCサーバー、OSCQueryサーバーのどちらかが開始中・開始済の場合
      return;
    }

    const typeAddressMap = {
      TARGET_AND_UPRIGHT: [...settingAddresses, oscQueryPathUpright],
      ALL: ['message'], // NOTE: 全メッセージを受信する場合はアドレスではなくServer.onに渡すイベント名を指定
      UPRIGHT: [oscQueryPathUpright],
    } as const satisfies Record<ListeningType, string[]>;

    const targetAddresses = typeAddressMap[listeningType];

    const prevOscStatus = oscStatus;
    changeOscStatus('PENDING');

    const onListen: Parameters<typeof useOscServer>[1]['onListen'] = (address, value) => {
      // TODO: 対象メッセージだけでなく対象の値も設定できるようにする
      // HACK: Uprightの受信を妨げないため0は通す
      if (!value && value !== 0) {
        return;
      }

      // NOTE: この実装だとUprightをカウント用アドレスとして設定できない 必要になったら対応
      const isUpright = listeningType === 'TARGET_AND_UPRIGHT' && address === oscQueryPathUpright;
      const uprightHandler = () => sendMessageIfNotNull('listen-upright-value', Number(value));

      const handlers = {
        TARGET_AND_UPRIGHT: isUpright ? uprightHandler : updateDefeatCount,
        ALL: () => sendMessageIfNotNull('listen-any-message', address),
        UPRIGHT: uprightHandler,
      } as const satisfies Record<ListeningType, () => void>;

      handlers[listeningType]();
    };

    const onOpen = () => {
      const typeStatusMap = {
        TARGET_AND_UPRIGHT: 'OPEN',
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
      const usingPort = await findFreeUdpPort(basePort);
      if (usingPort === null) {
        throw Error('Could not set OSC port');
      }

      oscQueryServer = new OSCQueryServer({
        serviceName: 'DefeatFit',
        oscQueryHostName: 'DefeatFit',
        oscPort: usingPort,
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
} as const;
