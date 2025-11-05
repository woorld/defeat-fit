import { PrismaClient } from '../../prisma/generated/client';
import type { Menu } from '../../prisma/generated/client';

const prisma = new PrismaClient();

export const menuListApi = {
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
    await prisma.statsMenu.deleteMany({ where: { menuId: id }});
    return prisma.menu.delete({ where: { id }});
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
