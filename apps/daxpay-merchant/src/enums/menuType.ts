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
  /** 子页面分组 */
  SUBPAGE_GROUP: 'subpage_group',
} as const;

export type MenuTypeEnum = (typeof MenuTypeEnum)[keyof typeof MenuTypeEnum];

/**
 * 菜单类型选项配置
 */
export const menuTypeOptions: { label: string; value: string }[] = [
  { label: 'iam.menu.typeCatalog', value: MenuTypeEnum.CATALOG },
  { label: 'iam.menu.typeMenu', value: MenuTypeEnum.MENU },
  { label: 'iam.menu.typeSubpage', value: MenuTypeEnum.SUBPAGE },
  { label: 'iam.menu.typeSubpageGroup', value: MenuTypeEnum.SUBPAGE_GROUP },
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
  [MenuTypeEnum.SUBPAGE_GROUP]: 'geekblue',
  [MenuTypeEnum.EMBEDDED]: 'orange',
  [MenuTypeEnum.LINK]: 'purple',
};

/**
 * 菜单类型小圆点 Tailwind class（树节点等轻量标识，与 menuTypeColorMap 语义一致）
 */
export const menuTypeDotClassMap: Record<string, string> = {
  [MenuTypeEnum.CATALOG]: 'bg-blue-500',
  [MenuTypeEnum.MENU]: 'bg-green-500',
  [MenuTypeEnum.SUBPAGE]: 'bg-cyan-500',
  [MenuTypeEnum.SUBPAGE_GROUP]: 'bg-indigo-500',
  [MenuTypeEnum.EMBEDDED]: 'bg-orange-500',
  [MenuTypeEnum.LINK]: 'bg-purple-500',
};

/**
 * 菜单类型国际化Key映射
 */
export const menuTypeI18nMap: Record<string, string> = {
  [MenuTypeEnum.CATALOG]: 'iam.menu.typeCatalog',
  [MenuTypeEnum.MENU]: 'iam.menu.typeMenu',
  [MenuTypeEnum.SUBPAGE]: 'iam.menu.typeSubpage',
  [MenuTypeEnum.SUBPAGE_GROUP]: 'iam.menu.typeSubpageGroup',
  [MenuTypeEnum.EMBEDDED]: 'iam.menu.typeEmbedded',
  [MenuTypeEnum.LINK]: 'iam.menu.typeLink',
};

/**
 * 菜单类型功能说明国际化Key映射（编辑表单顶部 Alert）
 */
export const menuTypeTipI18nMap: Record<string, string> = {
  [MenuTypeEnum.CATALOG]: 'iam.menu.typeCatalogTip',
  [MenuTypeEnum.MENU]: 'iam.menu.typeMenuTip',
  [MenuTypeEnum.SUBPAGE]: 'iam.menu.typeSubpageTip',
  [MenuTypeEnum.SUBPAGE_GROUP]: 'iam.menu.typeSubpageGroupTip',
  [MenuTypeEnum.EMBEDDED]: 'iam.menu.typeEmbeddedTip',
  [MenuTypeEnum.LINK]: 'iam.menu.typeLinkTip',
};
