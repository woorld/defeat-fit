import { ipcMain } from 'electron';
import { type Menu, PrismaClient } from '@prisma-generated-client';
import { noticeApi } from '@electron/api/notice';

const prisma = new PrismaClient();

let isInitialized = false;

export const menuApi = {
  initialize() {
    if (isInitialized) {
      return;
    }

    ipcMain.handle('get-menu-list', () => this.getMenuList());
    ipcMain.handle('add-menu', (_, menu: Menu) => this.addMenu(menu));
    ipcMain.handle('delete-menu', (_, id: number) => this.deleteMenu(id));
    ipcMain.handle('replace-menu', (_, id: number, newMenu: Menu) => this.replaceMenu(id, newMenu));

    isInitialized = true;
  },

  getMenuList() {
    return prisma.menu.findMany();
  },

  async addMenu(menu: Menu) {
    const result = await prisma.menu.create({
      data: {
        ...menu,
        id: undefined, // idをオートインクリメントさせるためにundefinedにする
      },
    });

    noticeApi.createNotice({
      text: 'メニューを追加しました',
      color: 'success',
    });

    return result;
  },

  async deleteMenu(id: number) {
    // NOTE: 戻り値がvoidなので返却不要
    await prisma.$transaction(async (tx) => {
      // 削除対象メニューに関連する項目の削除
      await Promise.all([
        tx.statsMenu.deleteMany({ where: { menuId: id } }),
        tx.presetMenu.deleteMany({ where: { menuId: id } }),
      ]);

      // プリセットメニュー削除で空になったプリセットの取得・削除
      const emptyPresets = await tx.preset.findMany({
        where: { presetMenuList: { none: {} } },
      });

      await tx.preset.deleteMany({
        where: { id: { in: emptyPresets.map(preset => preset.id) } },
      });

      // NOTE: 統計は負け回数を残すために削除しない

      // メニュー本体の削除
      await tx.menu.delete({ where: { id } });
    });

    noticeApi.createNotice({
      text: 'メニューを削除しました',
      color: 'success',
    });
  },

  async replaceMenu(id: number, newMenu: Menu) {
    const result = await prisma.menu.update({
      where: { id },
      data: {
        ...newMenu,
        id: undefined, // 念のためID以外を更新させる
      },
    });

    noticeApi.createNotice({
      text: 'メニューを更新しました',
      color: 'success',
    });

    return result;
  },
} as const;
