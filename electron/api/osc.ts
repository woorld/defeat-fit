import { Server } from 'node-osc';
import { settingApi } from './setting';

let oscServer: Server | null = null;

export const oscApi = {
  openServer: async (onListen: Function) => {
    try {
      oscServer = new Server(9001, '0.0.0.0', () => {
        console.log('DefeatFit: Start listening');
      });
    }
    catch (e) {
      // TODO: 画面へのエラー表示
      console.error(e);
      return;
    }

    const targetMessage = await settingApi.getSetting('targetOscMessage');
    oscServer.on(targetMessage, async (value) => {
      if (!value[1]) {
        return;
      }
      onListen();
    });
  },

  closeServer: async () => {
    if (oscServer == null) {
      return;
    }

    oscServer.close(() => {
      console.log('DefeatFit: closed');
      oscServer = null;
    });
  },

  isListening: () => oscServer != null,
} as const;
