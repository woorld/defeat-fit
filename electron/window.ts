import { app, BrowserWindow, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defeatCountApi } from '@electron/api/defeat-count';
import { oscApi } from '@electron/api/osc';
import { menuApi } from '@electron/api/menu';
import { settingApi } from '@electron/api/setting';
import { statsApi } from '@electron/api/stats';
import { presetApi } from '@electron/api/preset';
import type { SendMessage } from '@common/types';
import { noticeApi } from '@electron/api/notice';
import { ALLOWED_EXTERNAL_LINKS } from '@common/constants';
import { fileApi } from '@electron/api/file';
import { updateApi } from '@electron/api/update';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
// dist
// ├─┬ main
// │ ├── main.js
// │ └── preload.mjs
// │
// ├─┬ renderer
// │ └── index.html
process.env.APP_ROOT = path.join(__dirname, '../..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist', 'renderer');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

export function createWindow() {
  const win = new BrowserWindow({
    width: app.isPackaged ? undefined : 1200, // 開発者ツールでコンテンツが潰れないよう横幅を広げる
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      devTools: !app.isPackaged,
    },
    autoHideMenuBar: true,
    show: false, // ページがロードされるまではウィンドウを非表示にする
  });

  const sendMessage: SendMessage = (channel, ...args) => {
    try {
      if (!win || win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) {
        return;
      }
      win.webContents.send(channel, ...args);
    }
    catch (e) {
      console.warn('DefeatFit: sendMessage failed: ', e);
    }
  }

  defeatCountApi.initialize({ sendMessage });
  oscApi.initialize({ sendMessage });
  menuApi.initialize();
  settingApi.initialize();
  statsApi.initialize();
  presetApi.initialize();
  noticeApi.initialize({ sendMessage, closeWindow: () => win.close() });
  fileApi.initialize();
  updateApi.initialize({ sendMessage })

  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }

  win.on('ready-to-show', () => {
    win?.show();
  });

  win.on('close', (e) => {
    const defeatCount = defeatCountApi.getDefeatCount();
    if (defeatCount <= 0) {
      return;
    }

    e.preventDefault();
    noticeApi.showAppCloseConfirmDialog('未登録のカウントおよび筋トレがあります。統計に登録せず終了しますか？');
  });

  // 各種ショートカットの無効化
  win.webContents.on('before-input-event', (event, input) => {
    const disabledShortcuts = [
      app.isPackaged && input.control && input.code === 'KeyR',
      app.isPackaged && input.shift && input.control && input.code === 'KeyI',
      input.code === 'F5',
      input.code === 'F12',
      input.alt,
    ];

    if (disabledShortcuts.some(Boolean)) {
      event.preventDefault();
    }
  });

  win.webContents.setWindowOpenHandler(detail => {
    if (Object.values(ALLOWED_EXTERNAL_LINKS).includes(detail.url)) {
      shell.openExternal(detail.url);
    }
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  }
  else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  return win;
}
