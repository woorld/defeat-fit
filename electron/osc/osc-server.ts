import { Server } from 'node-osc';

export type OscServer = {
  server: null | Server,
  open: (args: { host: string, port: number }) => void,
  close: () => void,
};

export const useOscServer = (targetAddresses: string[], handlers: {
  onOpen: () => void,
  onClose: () => void,
  onListen: (address: string, value: unknown) => void,
}) => {
  const { onOpen, onClose, onListen } = handlers;
  let lastListenedAt = 0;
  let lastListenedAddress = '';

  const serverOpenCallback = () => {
    onOpen();
    console.log('DefeatFit: Start listening: ' + targetAddresses.join(', '));
  };

  const serverCloseCallback = () => {
    lastListenedAt = 0;
    lastListenedAddress = '';
    onClose();
    console.log('DefeatFit: closed');
  };

  const listenedCallback = (message: [string, unknown]) => {
    const [ address, value ] = message;
    /* HACK:
    * ネットワーク環境によってはOSCサービスが2つ以上登録され、同じメッセージが同タイミングで複数受信されることがある
    * 1回のOSC送信で多重にカウントされるのを防止するため、前回の受信から10ms以下で同じメッセージが来た場合は無視する
    */
    const nowDate = Date.now();
    const elapsedSinceLastListen = nowDate - lastListenedAt;

    if (address === lastListenedAddress && elapsedSinceLastListen <= 10) {
      return;
    }

    lastListenedAt = nowDate;
    lastListenedAddress = address;

    onListen(address, value);
    console.log('DefeatFit: listened: ' + `${address},${value}`);
  };

  const oscServer: OscServer = {
    server: null,

    open(args) {
      this.server = new Server(args.port, args.host, serverOpenCallback);
      for (const address of targetAddresses) {
        this.server.on(address, listenedCallback);
      }
    },

    close() {
      if (this.server == null) {
        return;
      }
      this.server.close(serverCloseCallback);
      this.server = null;
    },
  };

  return oscServer;
};
