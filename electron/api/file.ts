import { ipcMain, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { License } from '@common/types';
import { noticeApi } from '@electron/api/notice';

let isInitialized = false;
let isDev = false;
let licenseDir = '';

export const fileApi = {
  initialize(deps: { isDev: boolean }) {
    if (isInitialized) {
      return;
    }

    isDev = deps.isDev;
    licenseDir = path.join(
      // TODO: ビルド済みを見越してる開発用パス設定なんとかならんか
      isDev
        ? path.join(process.env.APP_ROOT, 'dist')
        : process.resourcesPath,
      'license'
    );

    ipcMain.handle('get-license-text', () => this.getLicenses());
    ipcMain.on('open-license-folder', () => this.openLicenseFolder());

    isInitialized = true;
  },

  getLicenses(): License[] {
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
        text: 'OSSライセンスの読み込みに失敗しました',
        color: 'error',
      });
      return [];
    }
  },

  openLicenseFolder() {
    shell.openPath(licenseDir);
  },
} as const;
