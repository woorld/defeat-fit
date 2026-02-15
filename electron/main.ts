import { app, BrowserWindow, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { defeatCountApi } from '@electron/api/defeat-count';
import { oscApi } from '@electron/api/osc';
import { menuApi } from '@electron/api/menu';
import { settingApi } from '@electron/api/setting';
import { statsApi } from '@electron/api/stats';
import { presetApi } from '@electron/api/preset';
import 'dotenv/config'; // エントリポイントでのみロードすればOK
import type { SendMessage } from '@common/types';
import { noticeApi } from '@electron/api/notice';
import { ALLOWED_EXTERNAL_LINKS } from '@common/constants';
import { fileApi } from '@electron/api/file';
import { updateApi } from '@electron/api/update';
import { migrateStore } from '@electron/store/migrate';

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

process.env.VITE_PUBLIC = app.isPackaged
  ? RENDERER_DIST
  : path.join(process.env.APP_ROOT, 'public');

// DB設定
if (app.isPackaged) {
  const dbName = 'app.db'; // TODO: できれば共通化
  const dbPath = path.join(app.getPath('userData'), dbName);

  process.env.DATABASE_URL = `file:${dbPath}`;

  if (!fs.existsSync(dbPath)) {
    const sourceDb = path.join(process.resourcesPath, dbName);
    try {
      fs.copyFileSync(sourceDb, dbPath);
    }
    catch (e) {
      console.error(e);
    }
  }
}

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
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
    win?.webContents.send(channel, ...args);
  }

  defeatCountApi.initialize({ sendMessage });
  oscApi.initialize({ sendMessage });
  menuApi.initialize();
  settingApi.initialize();
  statsApi.initialize();
  presetApi.initialize();
  noticeApi.initialize({ sendMessage });
  fileApi.initialize();
  updateApi.initialize({ sendMessage })

  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }

  win.on('ready-to-show', () => {
    win?.show();
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
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }

  oscApi.stopDiscovery();
  oscApi.closeServer();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  migrateStore();
  createWindow();
});
