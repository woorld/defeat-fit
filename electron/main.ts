import 'dotenv/config'; // エントリポイントでのみロードすればOK
import { app, type BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { oscApi } from '@electron/api/osc';
import { migrateStore } from '@electron/store/migrate';
import { createWindow } from '@electron/window';
import { getUserDataPath } from '@electron/path/user-data';

app.setPath('userData', getUserDataPath());

// DB設定
if (app.isPackaged) {
  const dbName = 'app.db'; // TODO: できれば共通化
  const dbPath = path.join(getUserDataPath(), dbName);

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

let win: BrowserWindow | null = null;
void win; // HACK: 未使用でコンパイルエラーになるのを回避

app.on('window-all-closed', async () => {
  try {
    oscApi.stopDiscovery();
    await oscApi.closeServer();
  }
  catch (e) {
    console.error('DefeatFit: Error while closing OSC server on shutdown: ', e);
  }
  finally {
    app.quit();
    win = null;
  }
});

app.whenReady().then(() => {
  migrateStore();
  win = createWindow();
});
