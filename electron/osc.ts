import { Server } from 'node-osc';

let oscServer: Server;
const targetMessage = '/avatar/parameters/BJK/IsDead';

export const openServer = (onListen: Function): void => {
  oscServer = new Server(9001, '0.0.0.0', () => {
    console.log('DefeatFit: Start listening');
  });

  oscServer.on(targetMessage, async (value) => {
    if (!value[1]) {
      return;
    }

    onListen();
  });
};

export const closeServer = (): void => {
  oscServer.close(() => {
    console.log('DefeatFit: closed');
  });
};
