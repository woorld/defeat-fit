import { Server } from 'node-osc';
import { settingApi } from './setting';
import { OSCQAccess, OSCQueryDiscovery, OSCQueryServer } from 'oscquery';
import { setTimeout } from 'node:timers/promises';

const basePort = 11337;
const minDiscoveryWaitMs = 3000;

const oscQueryDiscovery = new OSCQueryDiscovery;
let discoveryStartAt = 0;

let oscQueryServer: OSCQueryServer | null = null;
let oscServer: Server | null = null;
let lastListenedAt = 0;

export const oscApi = {
  async openServer(onListen: Function) {
    const targetMessage = await settingApi.getSetting('targetOscMessage');
    if (!targetMessage || oscQueryServer !== null || oscServer !== null) {
      // 対象のOSCメッセージが空文字列か、OSCサーバのどちらかが開始中か開始済の場合
      return;
    }

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
      oscQueryServer.addMethod(targetMessage, {
        access: OSCQAccess.WRITEONLY,
      });
      await oscQueryServer.start(); // 念のためOSCサーバ開始前に開始させる

      oscServer = new Server(usingPort, '0.0.0.0', () => {
        console.log('DefeatFit: Start listening');
      });
    }
    catch (e) {
      // TODO: 画面へのエラー表示
      console.error(e);
      return;
    }

    oscServer.on(targetMessage, value => {
      if (!value[1]) {
        return;
      }

      /* HACK:
       * ネットワーク環境によってはOSCサービスが2つ以上登録され、同じメッセージが同タイミングで複数受信されることがある
       * 1回のOSC送信で多重にカウントされるのを防止するため、前回の受信から10ms以下で同じメッセージが来た場合は無視する
       */
      const nowDate = Date.now();
      const elapsedSinceLastListen = nowDate - lastListenedAt;
      lastListenedAt = nowDate;

      if (elapsedSinceLastListen <= 10) {
        return;
      }

      onListen();
    });
  },

  async closeServer() {
    if (oscServer === null || oscQueryServer === null) {
      return;
    }

    await oscQueryServer.stop();
    oscQueryServer = null;

    oscServer.close(() => {
      console.log('DefeatFit: closed');
      oscServer = null;
    });
  },

  isListening() {
    return oscServer !== null && oscQueryServer !== null;
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
