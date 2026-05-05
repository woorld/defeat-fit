import { ipcMain } from 'electron';
import type { MenuIdWithMultiplier } from '@common/types';
import { Preset, PrismaClient } from '@prisma-generated-client';
import { noticeApi } from '@electron/api/notice';
import { getStore } from '@electron/store/store';
import { ELECTRON_STORE_DEFAULT_VALUE } from '@common/constants';
import type { Schema } from '@electron/store/schema';
import Store from 'electron-store';

const prisma = new PrismaClient();

let store: Store<Schema> | null = null;
let isInitialized = false;

export const presetApi = {
  initialize() {
    if (isInitialized) {
      return;
    }

    store = getStore();

    ipcMain.handle('get-preset-list', () => this.getPresetList());
    ipcMain.handle(
      'add-preset', (
        _,
        name: string,
        presetMenuList: MenuIdWithMultiplier[]
      ) => this.addPreset(name, presetMenuList)
    );
    ipcMain.handle(
      'update-preset', (
        _,
        preset: Preset,
        menuIdWithMultiplierList: MenuIdWithMultiplier[]
      ) => this.updatePreset(preset, menuIdWithMultiplierList)
    );
    ipcMain.handle('delete-preset', (_, id: number) => this.deletePreset(id));
    ipcMain.handle('get-last-selected-preset-id', () => this.getLastSelectedPresetId());
    ipcMain.on('set-last-selected-preset-id', (_, id: number | null) => this.setLastSelectedPresetId(id));

    isInitialized = true;
  },

  getPresetList() {
    return prisma.preset.findMany({
      include: {
        presetMenuList: {
          include: { menu: true },
        },
      },
    });
  },

  async addPreset(name: string, menuIdWithMultiplierList: MenuIdWithMultiplier[]) {
    const result = await prisma.preset.create({
      data: {
        name,
        presetMenuList: {
          create: menuIdWithMultiplierList,
        },
      },
    });

    noticeApi.createNotice({
      text: 'プリセットを登録しました',
      color: 'success',
    });

    return result;
  },

  async updatePreset(preset: Preset, menuIdWithMultiplierList: MenuIdWithMultiplier[]) {
    const currentPresetMenuList = await prisma.presetMenu.findMany({ where: { presetId: preset.id } });
    const currentPresetMenuIds = currentPresetMenuList.map(presetMenu => presetMenu.menuId);
    const newPresetMenu = menuIdWithMultiplierList
      .filter(item => !currentPresetMenuIds.includes(item.menuId))
      .map(
        presetMenu => ({
          presetId: preset.id,
          ...presetMenu,
        })
      );

    const result = await prisma.$transaction([
      // 新プリセットに存在しないプリセットメニューの削除
      prisma.presetMenu.deleteMany({
        where: {
          presetId: preset.id,
          menuId:{ notIn: menuIdWithMultiplierList.map(presetMenu => presetMenu.menuId) },
        },
      }),

      // プリセット名、前からプリセットに存在するプリセットメニューの更新
      prisma.preset.update({
        where: { id: preset.id },
        data: {
          name: preset.name,
          presetMenuList: {
            updateMany: menuIdWithMultiplierList.map(presetMenu => ({
              where: {
                presetId: preset.id,
                menuId: presetMenu.menuId,
              },
              data: {
                multiplier: presetMenu.multiplier,
              },
            })),
          },
        },
      }),

      // NOTE: プリセットメニュー更新の前に追加すると無駄に処理が増えそうなので、更新後に追加する
      // 新プリセットで追加されたプリセットメニューの追加
      prisma.presetMenu.createMany({
        data: newPresetMenu,
      }),
    ]);

    noticeApi.createNotice({
      text: 'プリセットを更新しました',
      color: 'success',
    });

    return result;
  },

  async deletePreset(id: number) {
    const result = await prisma.$transaction([
      prisma.presetMenu.deleteMany({ where: { presetId: id }}),
      prisma.preset.delete({ where: { id } }),
    ]);

    noticeApi.createNotice({
      text: 'プリセットを削除しました',
      color: 'success',
    });

    return result;
  },

  getLastSelectedPresetId() {
    if (store === null) {
      store = getStore();
    }
    return store === null
      ? ELECTRON_STORE_DEFAULT_VALUE.lastSelectedPresetId
      : store.get('lastSelectedPresetId', ELECTRON_STORE_DEFAULT_VALUE.lastSelectedPresetId);
  },

  setLastSelectedPresetId(id: number | null) {
    if (store === null) {
      store = getStore();
    }
    if (store === null) {
      return;
    }
    store.set('lastSelectedPresetId', id);
  },
} as const;

export type UpdatePreset = ReturnType<typeof presetApi.updatePreset>;
