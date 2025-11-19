import { PrismaClient } from '../../prisma/generated/client';
import type { Menu } from '../../prisma/generated/client';

const prisma = new PrismaClient();

export const menuApi = {
  getMenuList() {
    return prisma.menu.findMany();
  },

  addMenu(menu: Menu) {
    return prisma.menu.create({
      data: {
        ...menu,
        id: undefined, // idをオートインクリメントさせるためにundefinedにする
      },
    });
  },

  async deleteMenu(id: number) {
    return prisma.$transaction(async (tx) => {
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
  },

  replaceMenu(id: number, newMenu: Menu) {
    return prisma.menu.update({
      where: { id },
      data: {
        ...newMenu,
        id: undefined, // 念のためID以外を更新させる
      },
    });
  },
} as const;
