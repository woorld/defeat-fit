import { Server } from 'node-osc';

let oscServer: Server | null = null;
const targetMessage = '/avatar/parameters/BJK/IsDead';

export const openServer = async (onListen: Function) => {
  try {
    oscServer = new Server(9001, '0.0.0.0', () => {
      console.log('DefeatFit: Start listening');
    });
  } catch (e) {
    // TODO: 画面へのエラー表示
    console.error(e);
    return;
  }

  oscServer.on(targetMessage, async (value) => {
    if (!value[1]) {
      return;
    }

    onListen();
  });
};

export const closeServer = async () => {
  if (oscServer == null) {
    return;
  }

  oscServer.close(() => {
    console.log('DefeatFit: closed');
    oscServer = null;
  });
};

export const isListening = () => oscServer != null;
