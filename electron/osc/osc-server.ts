import OSC from "osc-js";

export type OscPayload = {
  offset: number,
  address: string,
  types: string,
  args: unknown[],
};

export const useOscServer = (targetAddress: string, handlers: {
  onOpen: () => void,
  onClose: () => void,
  onListen: (payload: OscPayload) => void,
}) => {
  const { onOpen, onClose, onListen } = handlers;
  const oscServer = new OSC({ plugin: new OSC.DatagramPlugin() });
  let lastListenedAt = 0;
  let lastListenedAddress = '';

  oscServer.on('open', () => {
    onOpen();
    console.log('DefeatFit: Start listening: ' + targetAddress);
  });

  oscServer.on('close', () => {
    lastListenedAt = 0;
    lastListenedAddress = '';
    onClose();
    console.log('DefeatFit: closed');
  });

  oscServer.on(targetAddress, (payload: OscPayload) => {
    /* HACK:
    * ネットワーク環境によってはOSCサービスが2つ以上登録され、同じメッセージが同タイミングで複数受信されることがある
    * 1回のOSC送信で多重にカウントされるのを防止するため、前回の受信から10ms以下で同じメッセージが来た場合は無視する
    */
    const nowDate = Date.now();
    const elapsedSinceLastListen = nowDate - lastListenedAt;

    if (payload.address === lastListenedAddress && elapsedSinceLastListen <= 10) {
      return;
    }

    lastListenedAt = nowDate;
    lastListenedAddress = payload.address;

    onListen(payload);
    console.log('DefeatFit: listened: ' + `${payload.address},${payload.args.join(',')}`);
  });

  return oscServer;
};
