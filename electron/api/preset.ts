import { MenuIdWithMultiplier } from '../../common/types';
import { Preset, PrismaClient } from '../../prisma/generated/client';

const prisma = new PrismaClient();

export const presetApi = {
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
    return prisma.preset.create({
      data: {
        name,
        presetMenuList: {
          create: menuIdWithMultiplierList,
        },
      },
    });
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

    return prisma.$transaction([
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
  },
};

export type UpdatePreset = ReturnType<typeof presetApi.updatePreset>;
