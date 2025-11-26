import { app, BrowserWindow, ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { defeatCountApi } from './api/defeat-count';
import { oscApi } from './api/osc';
import { menuApi } from './api/menu';
import { settingApi } from './api/setting';
import { statsApi } from './api/stats';
import { presetApi } from './api/preset';
import type { Setting, MenuIdWithMultiplier } from '../common/types';
import type { Menu, Preset } from '../prisma/generated/client';
import 'dotenv/config'; // エントリポイントでのみロードすればOK

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
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist', 'main');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist', 'renderer');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// DB設定
if (!VITE_DEV_SERVER_URL) {
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
    width: VITE_DEV_SERVER_URL ? 1200 : undefined, // 開発者ツールでコンテンツが潰れないよう横幅を広げる
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      devTools: !!VITE_DEV_SERVER_URL,
    },
    autoHideMenuBar: true,
    show: false, // ページがロードされるまではウィンドウを非表示にする
  });

  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  win.on('ready-to-show', () => {
    win?.show();
  });

  // 各種ショートカットの無効化
  win.webContents.on('before-input-event', (event, input) => {
    const disabledShortcuts = [
      !VITE_DEV_SERVER_URL && input.control && input.code === 'KeyR',
      !VITE_DEV_SERVER_URL && input.shift && input.control && input.code === 'KeyI',
      input.code === 'F5',
      input.code === 'F12',
      input.alt,
    ];

    if (disabledShortcuts.some(Boolean)) {
      event.preventDefault();
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
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

  oscApi.closeServer();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

// -------- ↑ウィンドウ設定 API関連処理↓ --------

const onListenOsc = () => {
  const newCount = defeatCountApi.incrementDefeatCount();
  console.log('DefeatFit: listened! count: ' + newCount);
  win?.webContents.send('update-defeat-count', newCount);
};

// 負けカウントAPI
ipcMain.handle('get-defeat-count', () => defeatCountApi.getDefeatCount());
ipcMain.handle('decrement-defeat-count', () => defeatCountApi.decrementDefeatCount());
ipcMain.on('reset-defeat-count', () => {
  defeatCountApi.resetDefeatCount();
  win?.webContents.send('update-defeat-count', defeatCountApi.getDefeatCount());
});

// OSCサーバAPI
ipcMain.handle('get-listening-status', () => oscApi.isListening());
ipcMain.handle('start-listening', () => oscApi.openServer(onListenOsc));
ipcMain.handle('stop-listening', () => oscApi.closeServer());

// メニューAPI
ipcMain.handle('get-menu-list', () => menuApi.getMenuList());
ipcMain.handle('add-menu', (_, menu: Menu) => menuApi.addMenu(menu));
ipcMain.handle('delete-menu', (_, id: number) => menuApi.deleteMenu(id));
ipcMain.handle('replace-menu', (_, id: number, newMenu: Menu) => menuApi.replaceMenu(id, newMenu));

// 設定API
ipcMain.handle('get-setting', (_, settingName: keyof Setting) => settingApi.getSetting(settingName));
ipcMain.handle('get-all-setting', () => settingApi.getAllSetting());
ipcMain.handle(
  'set-setting',
  <K extends keyof Setting>(
    _: IpcMainInvokeEvent,
    settingName: K,
    value: Setting[K]
  ) => settingApi.setSetting(settingName, value)
);
ipcMain.on('set-all-setting', async (_, setting: Setting) => {
  settingApi.setAllSetting(setting);
  if (oscApi.isListening()) {
    // OSCサーバを開きなおさないと変更が反映されない
    await oscApi.closeServer();
    return oscApi.openServer(onListenOsc);
  }
});
ipcMain.on('reset-setting', () => settingApi.resetSetting());

// 統計API
ipcMain.handle('get-stats-list', () => statsApi.getStatsList());
ipcMain.handle('get-total-stats', () => statsApi.getTotalStats());
ipcMain.handle('add-stats', (_, defeatCount: number, menuIdWithMultiplierList: MenuIdWithMultiplier[]) => statsApi.addStats(defeatCount, menuIdWithMultiplierList));
ipcMain.handle('delete-stats', (_, id: number) => statsApi.deleteStats(id));

// プリセットAPI
ipcMain.handle('get-preset-list', () => presetApi.getPresetList());
ipcMain.handle('add-preset', (_, name: string, presetMenuList: MenuIdWithMultiplier[]) => presetApi.addPreset(name, presetMenuList));
ipcMain.handle(
  'update-preset', (
    _,
    preset: Preset,
    menuIdWithMultiplierList: MenuIdWithMultiplier[]
  ) => presetApi.updatePreset(preset, menuIdWithMultiplierList)
);
ipcMain.handle('delete-preset', (_, id: number) => presetApi.deletePreset(id));
