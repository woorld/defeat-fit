import 'dotenv/config'; // エントリポイントでのみロードすればOK
import { app, dialog, type BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { oscApi } from '@electron/api/osc';
import { DatabaseMigrationError, migrateDatabase } from '@electron/db/migrate';
import { migrateStore } from '@electron/store/migrate';
import { createWindow } from '@electron/window';
import { getUserDataPath } from '@electron/path/user-data';

app.setPath('userData', getUserDataPath());

// NOTE: 多重起動すると、起動中のインスタンスが開いているDBに対して後発がマイグレーションやバックアップ復元を行い破損し得るため
const isPrimaryInstance = !app.isPackaged || app.requestSingleInstanceLock();
if (!isPrimaryInstance) {
  app.quit();
}

// DB設定
if (app.isPackaged && isPrimaryInstance) {
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

const buildMigrationErrorMessage = (e: unknown): string => {
  const detail = e instanceof Error ? e.message : String(e);
  const state = e instanceof DatabaseMigrationError ? e.state : 'unchanged';
  const summary = {
    unchanged: 'データベースの更新に失敗しました。データベースは変更されていません。',
    restored: 'データベースの更新に失敗したため、変更前の状態に戻しました。',
    'restore-failed': 'データベースの更新と復元に失敗しました。データベースが破損している可能性があります。',
  }[state];

  return `${summary}アプリを終了します。\n\n${detail}`;
};

let win: BrowserWindow | null = null;
void win; // HACK: 未使用でコンパイルエラーになるのを回避

app.on('window-all-closed', async () => {
  try {
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

app.whenReady().then(async () => {
  if (!isPrimaryInstance) {
    return;
  }

  if (app.isPackaged) {
    try {
      await migrateDatabase(
        path.join(getUserDataPath(), 'app.db'),
        path.join(process.resourcesPath, 'migrations'),
      );
    }
    catch (e) {
      dialog.showErrorBox('DefeatFit', buildMigrationErrorMessage(e));
      app.quit();
      return;
    }
  }

  migrateStore();
  win = createWindow();
});
