import { ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { License } from '../../common/types';
import { noticeApi } from './notice';

let isInitialized = false;
let isDev = false;

export const fileApi = {
  initialize(deps: { isDev: boolean }) {
    if (isInitialized) {
      return;
    }

    isDev = deps.isDev;
    ipcMain.handle('get-license-text', () => this.getLicenses());

    isInitialized = true;
  },

  getLicenses(): License[] {
    const licenseDir = path.join(
      // TODO: ビルド済みを見越してる開発用パス設定なんとかならんか
      isDev
        ? path.join(process.env.APP_ROOT, 'dist')
        : process.resourcesPath,
      'license'
    );

    try {
      const licenseMain = fs.readFileSync(path.join(licenseDir, 'license.main.json'), 'utf8');
      const licenseRenderer = fs.readFileSync(path.join(licenseDir, 'license.renderer.json'), 'utf8');
      const licenseAll: License[] = [
        ...JSON.parse(licenseMain),
        ...JSON.parse(licenseRenderer),
      ];
      return licenseAll.sort((licenseA, licenseB) => (licenseA.name ?? '').localeCompare(licenseB.name ?? ''));
    }
    catch (e) {
      noticeApi.createNotice({
        text: 'OSSライセンス表記の読み込みに失敗しました',
        color: 'error',
      });
      return [];
    }
  },
} as const;
