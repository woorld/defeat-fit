import { Client } from 'node-osc';
import readline from 'readline';
import { oscSetting } from './constants.mjs';
import process from 'process';

const sendMultipleType = process.argv[2] === 'multiple';
const log = (str) => console.log('osc-sender: ' + str);

const oscAddress = '/avatar/parameters/BJK/IsDead';
const oscValue = 'true';
const client = new Client(oscSetting.host, oscSetting.port);

let count = 0;

const onKeyPress = (_str, key) => {
  if (!key) {
    return;
  }

  if (key.ctrl && key.name === 'c') {
    log('Exit');
    client.close();
    process.stdin.pause(); // 標準入力の監視をやめる
    return;
  }

  if (key.name === 'return') {
    count++;
    const sendOscAddress = sendMultipleType
      ? `${oscAddress}/${count}`
      : oscAddress;

    client.send(sendOscAddress, oscValue, () => {
      log(`Message Sent - ${sendOscAddress},${oscValue}`);
    });
  }
};

// キー入力1つ1つに対してイベントを発行させる
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (_str, key) => onKeyPress(_str, key));

log('Message Send Ready - Press Enter To Send');
