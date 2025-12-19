// TODO: OSCQuery対応してVRChatのOSCも受信できるようにする
import OSC from 'osc-js';
import readline from 'readline';
import { oscSetting, useLog } from './common.mjs';

const log = useLog('osc-listener');

const oscServer = new OSC({ plugin: new OSC.DatagramPlugin() });
oscServer.on('*', (message) => {
  log(`Message Received - ${message.address},${message.args.join(',')}`);
});
oscServer.on('open', () => {
  log('Start Listening');
});
oscServer.open({ host: oscSetting.host, port: oscSetting.port });

const onExit = () => {
  log('End Listening');
  oscServer.close();
  process.stdin.pause();
};

// キー入力1つ1つに対してイベントを発行させる
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (_str, key) => {
  if (!key.ctrl || !key === 'c') {
    return;
  }
  onExit();
});
