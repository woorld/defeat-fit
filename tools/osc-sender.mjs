import OSC from 'osc-js';
import readline from 'readline';
import { oscSetting, useLog } from './common.mjs';
import process from 'process';

const sendMultipleType = process.argv[2] === 'multiple';
const log = useLog('osc-sender');

const oscAddress = '/avatar/parameters/BJK/IsDead';
const oscValue = true;
const client = new OSC({ plugin: new OSC.DatagramPlugin() });
let count = 0;

const onKeyPress = (_str, key) => {
  if (!key) {
    return;
  }

  if (key.ctrl && key.name === 'c') {
    log('Exit');
    client.close(); // クライアントとして使う場合もclose()が必要
    process.stdin.pause(); // 標準入力の監視をやめる
    return;
  }

  if (key.name === 'return') {
    count++;
    const sendOscAddress = sendMultipleType
      ? `${oscAddress}/${count}`
      : oscAddress;

    const message = new OSC.Message(sendOscAddress, oscValue);
    client.send(message, { host: oscSetting.host, port: oscSetting.port });
    log(`Message Sent - ${sendOscAddress},${oscValue}`);
  }
};

// キー入力1つ1つに対してイベントを発行させる
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (_str, key) => onKeyPress(_str, key));

log('Message Send Ready - Press Enter To Send');
