/**
 * 菜单类型枚举
 */
export const MenuTypeEnum = {
  /** 目录 */
  CATALOG: 'catalog',
  /** 内嵌页面 */
  EMBEDDED: 'embedded',
  /** 外链 */
  LINK: 'link',
  /** 菜单 */
  MENU: 'menu',
  /** 子页面 */
  SUBPAGE: 'subpage',
} as const;

export type MenuTypeEnum = (typeof MenuTypeEnum)[keyof typeof MenuTypeEnum];

/**
 * 菜单类型选项配置
 */
export const menuTypeOptions: { label: string; value: string }[] = [
  { label: 'iam.menu.typeCatalog', value: MenuTypeEnum.CATALOG },
  { label: 'iam.menu.typeMenu', value: MenuTypeEnum.MENU },
  { label: 'iam.menu.typeSubpage', value: MenuTypeEnum.SUBPAGE },
  { label: 'iam.menu.typeEmbedded', value: MenuTypeEnum.EMBEDDED },
  { label: 'iam.menu.typeLink', value: MenuTypeEnum.LINK },
];

/**
 * 菜单类型标签颜色映射
 */
export const menuTypeColorMap: Record<string, string> = {
  [MenuTypeEnum.CATALOG]: 'blue',
  [MenuTypeEnum.MENU]: 'green',
  [MenuTypeEnum.SUBPAGE]: 'cyan',
  [MenuTypeEnum.EMBEDDED]: 'orange',
  [MenuTypeEnum.LINK]: 'purple',
};

/**
 * 菜单类型国际化Key映射
 */
export const menuTypeI18nMap: Record<string, string> = {
  [MenuTypeEnum.CATALOG]: 'iam.menu.typeCatalog',
  [MenuTypeEnum.MENU]: 'iam.menu.typeMenu',
  [MenuTypeEnum.SUBPAGE]: 'iam.menu.typeSubpage',
  [MenuTypeEnum.EMBEDDED]: 'iam.menu.typeEmbedded',
  [MenuTypeEnum.LINK]: 'iam.menu.typeLink',
};
