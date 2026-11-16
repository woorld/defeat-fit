import type { WebContents } from 'electron';
import type { SendMessage } from '@common/types';

const targets = new Set<WebContents>();

/** mainからのpush通知を受け取るウィンドウを登録する（破棄時に自動で解除される） */
export const addBroadcastTarget = (webContents: WebContents) => {
  targets.add(webContents);
  webContents.once('destroyed', () => targets.delete(webContents));
};

export const broadcast: SendMessage = (channel, ...args) => {
  for (const webContents of targets) {
    try {
      if (webContents.isDestroyed()) {
        continue;
      }
      webContents.send(channel, ...args);
    }
    catch (e) {
      console.warn('DefeatFit: sendMessage failed: ', e);
    }
  }
};
