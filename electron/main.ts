import 'dotenv/config'; // エントリポイントでのみロードすればOK
import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { oscApi } from '@electron/api/osc';
import { migrateStore } from '@electron/store/migrate';
import { createWindow } from './window';

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

let win: BrowserWindow | null = null;
void win; // HACK: 未使用でコンパイルエラーになるのを回避

app.on('window-all-closed', () => {
  app.quit();
  win = null;

  oscApi.stopDiscovery();
  oscApi.closeServer();
});

app.whenReady().then(() => {
  migrateStore();
  win = createWindow();
});
