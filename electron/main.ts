import { app, BrowserWindow, ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defeatCountApi } from './api/defeat-count';
import { oscApi } from './api/osc';
import { menuListApi } from './api/menu-list';
import { settingApi } from './api/setting';
import { statsListApi } from './api/stats-list';
import { presetApi } from './api/preset';
import type { Setting, MenuIdWithMultiplier } from '../common/types';
import type { Menu, Preset } from '../prisma/generated/client';
import 'dotenv/config'; // エントリポイントでのみロードすればOK

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

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

  oscApi.openServer(onListenOsc);
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
ipcMain.handle('start-listening', async () => {
  await oscApi.openServer(onListenOsc);
  return oscApi.isListening();
});
ipcMain.handle('stop-listening', async () => {
  await oscApi.closeServer();
  return oscApi.isListening();
});

// メニューAPI
ipcMain.handle('get-menu-list', () => menuListApi.getMenuList());
ipcMain.handle('add-menu', (_, menu: Menu) => menuListApi.addMenu(menu));
ipcMain.handle('delete-menu', (_, id: number) => menuListApi.deleteMenu(id));
ipcMain.handle('replace-menu', (_, id: number, newMenu: Menu) => menuListApi.replaceMenu(id, newMenu));

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
ipcMain.handle('get-stats-list', () => statsListApi.getStatsList());
ipcMain.handle('get-total-stats', () => statsListApi.getTotalStats());
ipcMain.handle('add-stats', (_, defeatCount: number, menuList: Menu[]) => statsListApi.addStats(defeatCount, menuList));

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
