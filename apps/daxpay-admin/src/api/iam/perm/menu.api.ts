import type { RouteRecordStringComponent } from '@vben/types';

import type { BaseEntity, Result } from '#/types/web';

import { requestClient } from '#/api/request';
import { MenuTypeEnum } from '#/enums/menuType';

/**
 * 统一标题生成：返回 i18nKey，由路由框架负责翻译
 */
function resolveMenuTitle(menu: PermMenu): string {
  return menu.i18nKey || '';
}

/**
 * 根据 menuType 过滤按钮类型节点（按钮不生成可导航路由，仅作权限标识）
 */
function filterButtonMenus(menus: PermMenu[]): PermMenu[] {
  return menus
    .filter((menu) => menu.menuType !== 'button')
    .map((menu) => ({
      ...menu,
      children: menu.children ? filterButtonMenus(menu.children) : undefined,
    }));
}

/**
 * 过滤仅作权限锚点、无路由信息的菜单节点
 * 中文：如 payment:isv / payment:isv 仅用于 @PermCode menuCode 挂载，无 path/component
 */
function filterPermissionAnchorMenus(menus: PermMenu[]): PermMenu[] {
  return menus
    .filter((menu) => {
      const menuType = menu.menuType || MenuTypeEnum.MENU;
      if (menuType === MenuTypeEnum.MENU && !menu.path && !menu.component) {
        return false;
      }
      return true;
    })
    .map((menu) => ({
      ...menu,
      children: menu.children ? filterPermissionAnchorMenus(menu.children) : undefined,
    }));
}

/**
 * 面包屑链项
 */
interface BreadcrumbChainItem {
  icon?: string;
  path?: string;
  title?: string;
}

/**
 * 构建 id → 祖先链(含自身)的映射
 * 子页面路由提升后会丢失 menu 父级，提升前用原始树构建完整层级链，供面包屑补全
 */
function buildBreadcrumbChainMap(menus: PermMenu[]): Map<string, BreadcrumbChainItem[]> {
  const map = new Map<string, BreadcrumbChainItem[]>();
  function walk(nodes: PermMenu[], ancestors: BreadcrumbChainItem[]) {
    for (const node of nodes) {
      const item: BreadcrumbChainItem = {
        title: resolveMenuTitle(node),
        path: node.path || undefined,
        icon: node.icon || undefined,
      };
      const chain = [...ancestors, item];
      if (node.id) {
        map.set(node.id, chain);
      }
      if (node.children?.length) {
        walk(node.children, chain);
      }
    }
  }
  walk(menus, []);
  return map;
}

/**
 * 处理单个菜单节点，提取其子菜单中的子页面/子页面分组并提升到当前层级
 * 中文：子页面/子页面分组在数据库中作为菜单的子节点维护，但路由生成时需要提升到目录级别
 */
function processMenuNode(menu: PermMenu): PermMenu {
  if (!menu.children || menu.children.length === 0) {
    return menu;
  }

  const processedChildren: PermMenu[] = [];
  // 从 menu 类型子节点中提升出来的子页面类节点(subpage / subpage_group)
  const lifted: PermMenu[] = [];

  for (const child of menu.children) {
    const processedChild = processMenuNode(child);

    // 仅 menu 类型节点下的子页面类需要提升到目录层级；
    // subpage_group 下的 subpage 保留不动（分组整体提升，保持 group>subpage 嵌套用于面包屑）
    if (
      processedChild.menuType === MenuTypeEnum.MENU &&
      processedChild.children &&
      processedChild.children.length > 0
    ) {
      const liftable = processedChild.children.filter(
        (c) => c.menuType === MenuTypeEnum.SUBPAGE || c.menuType === MenuTypeEnum.SUBPAGE_GROUP,
      );
      const remaining = processedChild.children.filter(
        (c) => c.menuType !== MenuTypeEnum.SUBPAGE && c.menuType !== MenuTypeEnum.SUBPAGE_GROUP,
      );

      lifted.push(...liftable);
      processedChild.children = remaining.length > 0 ? remaining : undefined;
    }

    processedChildren.push(processedChild);
  }

  const finalChildren = [...processedChildren, ...lifted];

  return {
    ...menu,
    children: finalChildren.length > 0 ? finalChildren : undefined,
  };
}

/**
 * 从菜单树中提取所有子页面，并提升到其祖父节点下
 * 中文：维护时保持层级关系，路由生成时提升子页面
 */
function extractAndLiftSubpages(menus: PermMenu[]): PermMenu[] {
  return menus.map((menu) => processMenuNode(menu));
}

/**
 * 将后端 PermMenu 转换为前端路由格式
 * menuType 分支行为：
 * - catalog：目录容器路由，可带 redirect，不渲染页面
 * - menu：普通组件路由，component 必填
 * - subpage：子页面路由，component 必填，强制隐藏菜单
 * - embedded：内嵌容器路由，component = IFrameView，写入 meta.iframeSrc
 * - link：外链路由，写入 meta.link + meta.external
 * - button：不过滤（已在入参层移除），保留子级处理
 */
function convertMenuToRoute(
  menu: PermMenu,
  breadcrumbMap?: Map<string, BreadcrumbChainItem[]>,
): RouteRecordStringComponent {
  const title = resolveMenuTitle(menu);
  const menuType = menu.menuType || MenuTypeEnum.MENU;

  // 构建基础路由对象
  const route: RouteRecordStringComponent = {
    name: menu.path,
    path: menu.path,
    component: '',
    meta: {
      title,
      icon: menu.icon || undefined,
      order: menu.sortNo ?? 0,
      hideInMenu: menu.hidden,
      hideChildrenInMenu: menu.hideChildrenMenu,
      keepAlive: menu.keepAlive,
      affixTab: menu.affixTab,
      // 扩展字段
      badge: menu.badge || undefined,
      badgeType: (menu.badgeType as 'dot' | 'normal') || 'normal',
      badgeVariants: menu.badgeVariants || 'subtle',
    },
    children: menu.children ? menu.children.map((child) => convertMenuToRoute(child, breadcrumbMap)) : undefined,
  };

  // 根据 menuType 分支处理
  switch (menuType) {
    case MenuTypeEnum.CATALOG: {
      // 目录：无组件，仅容器，可带 redirect
      route.component = '';
      route.redirect = menu.redirect;
      // 目录隐藏时不传递 hideInMenu（目录本身不显示无意义）
      route.meta!.hideInMenu = menu.hidden;
      break;
    }

    case MenuTypeEnum.EMBEDDED: {
      // 内嵌：强制使用 IFrameView 容器，写入 iframeSrc
      route.component = 'IFrameView';
      route.meta!.iframeSrc = menu.iframeSrc || '';
      break;
    }

    case MenuTypeEnum.LINK: {
      // 外链：写入 link 地址，component 置空由前端框架处理
      route.component = '';
      route.meta!.link = menu.link || '';
      break;
    }

    case MenuTypeEnum.SUBPAGE: {
      // 子页面：使用 component，强制隐藏菜单
      route.component = menu.component || '';
      route.meta!.hideInMenu = true;
      // 注入完整面包屑链（含 catalog/menu/group），弥补路由提升后 matched 缺失 menu 层
      if (menu.id && breadcrumbMap?.has(menu.id)) {
        route.meta!.customBreadcrumb = breadcrumbMap.get(menu.id);
      }
      break;
    }

    case MenuTypeEnum.SUBPAGE_GROUP: {
      // 子页面分组：透明容器（无组件），强制隐藏菜单
      // 分组无 path，用 id 派生唯一 name/path（有 children 时 component 会被框架移除成为透明容器）
      route.name = `subpage-group-${menu.id}`;
      route.component = '';
      route.path = `/_subpage-group/${menu.id}`;
      route.meta!.hideInMenu = true;
      break;
    }

    default: {
      // 普通菜单：直接使用 component
      route.component = menu.component || '';
      route.redirect = menu.redirect;
      break;
    }
  }

  return route;
}

/**
 * 批量转换菜单列表（先过滤按钮类型，再提取提升子页面，最后递归转换）
 */
export function convertMenuListToRoutes(menus: PermMenu[]): RouteRecordStringComponent[] {
  const filtered = filterPermissionAnchorMenus(filterButtonMenus(menus));
  // 提升前构建面包屑祖先链映射（提升会破坏 menu→subpage 父子关系，必须在提升前建立）
  const breadcrumbMap = buildBreadcrumbChainMap(filtered);
  const processed = extractAndLiftSubpages(filtered);
  return processed.map((menu) => convertMenuToRoute(menu, breadcrumbMap));
}

/**
 * 菜单管理 API
 */
export const MenuApi = {
  /**
   * 获取当前用户菜单
   */
  getMyMenus(): Promise<Result<PermMenu[]>> {
    return requestClient.get('/perm/menu/my');
  },
  /**
   * 获取菜单树结构
   */
  tree(clientCode: string): Promise<Result<Menu[]>> {
    return requestClient.get('/perm/menu/tree', { params: { clientCode } });
  },
  /**
   * 根据ID获取菜单详情
   */
  findById(id: string): Promise<Result<Menu>> {
    return requestClient.get('/perm/menu/get', { params: { id } });
  },
  /**
   * 新增菜单
   */
  add(data: Menu): Promise<Result<Menu>> {
    return requestClient.post('/perm/menu/add', data);
  },
  /**
   * 更新菜单
   */
  update(data: Menu): Promise<Result<Menu>> {
    return requestClient.post('/perm/menu/update', data);
  },
  /**
   * 删除菜单
   */
  delete(id: string): Promise<Result<boolean>> {
    return requestClient.post('/perm/menu/delete', null, { params: { id } });
  },
  /**
   * 检查菜单编码是否已存在
   */
  checkMenuCodeExists(menuCode: string, clientCode: string, excludeId?: string): Promise<Result<boolean>> {
    return requestClient.get('/perm/menu/check-menu-code-exists', {
      params: { menuCode, clientCode, excludeId },
    });
  },
};

/**
 * 权限码管理 API
 */
export const PermCodeApi = {
  /**
   * 扫描权限码
   */
  scan(): Promise<Result<PermCodeScanResult>> {
    return requestClient.post('/perm/code/scan');
  },
  /**
   * 根据菜单ID查询权限码列表
   */
  findByMenu(menuId: string): Promise<Result<MenuPermCodeItem[]>> {
    return requestClient.get('/perm/code/get-by-menu', { params: { menuId } });
  },
};

/**
 * 运行时菜单结果类型（与后端 PermMenu 对齐）
 * menuType 分支值：catalog=目录, menu=菜单, subpage=子页面, embedded=内嵌, link=外链, button=按钮
 */
export interface PermMenu extends BaseEntity {
  /** 父级ID */
  pid: string;
  /** 客户端编码 */
  clientCode: string;
  /** 国际化key */
  i18nKey?: string;
  /** 图标 */
  icon?: string;
  /** 是否隐藏 */
  hidden: boolean;
  /** 是否隐藏子菜单 */
  hideChildrenMenu: boolean;
  /** 组件路径 */
  component?: string;
  /** 路由路径 */
  path: string;
  /** 重定向路径 */
  redirect?: string;
  /** 排序号 */
  sortNo: number;
  /** 是否缓存页面 */
  keepAlive: boolean;
  /** 是否固定标签页 */
  affixTab: boolean;
  /** 菜单类型 @see MenuTypeEnum */
  menuType?: string;
  /** 徽章显示文本 */
  badge?: string;
  /** 徽章类型: dot-圆点, normal-文本 */
  badgeType?: string;
  /** 徽章样式变体 */
  badgeVariants?: string;
  /** 内嵌页面URL地址（menuType=embedded 时使用） */
  iframeSrc?: string;
  /** 外部链接URL地址（menuType=link 时使用） */
  link?: string;
  /** 子菜单 */
  children?: PermMenu[];
}

/**
 * 菜单信息
 */
export interface Menu extends BaseEntity {
  /** 应用编码 */
  clientCode?: string;
  /** 父级ID */
  pid?: string;
  /** 菜单编码 */
  menuCode?: string;
  /** 国际化Key */
  i18nKey?: string;
  /** 图标 */
  icon?: string;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 是否隐藏子菜单 */
  hideChildrenMenu?: boolean;
  /** 组件路径 */
  component?: string;
  /** 路由路径 */
  path?: string;
  /** 重定向路径 */
  redirect?: string;
  /** 排序号 */
  sortNo?: number;
  /** 是否缓存 */
  keepAlive?: boolean;
  /** 是否固定标签页 */
  affixTab?: boolean;
  /** 菜单类型 */
  menuType?: string;
  /** 徽标内容 */
  badge?: string;
  /** 徽标类型 */
  badgeType?: string;
  /** 徽标样式 */
  badgeVariants?: string;
  /** iframe嵌入地址 */
  iframeSrc?: string;
  /** 外链地址 */
  link?: string;
  /** 子菜单列表 */
  children?: Menu[];
}

/**
 * 权限码扫描结果
 */
export interface PermCodeScanResult {
  /** 新增数量 */
  addedCount?: number;
  /** 更新数量 */
  updatedCount?: number;
  /** 跳过数量 */
  skippedCount?: number;
  /** 删除数量 */
  deletedCount?: number;
  /** 错误数量 */
  errorCount?: number;
  /** 新增的权限码列表 */
  addedCodes?: string[];
  /** 更新的权限码列表 */
  updatedCodes?: string[];
  /** 跳过的权限码列表 */
  skippedCodes?: string[];
  /** 删除的权限码列表 */
  deletedCodes?: string[];
  /** 错误信息列表 */
  errors?: string[];
}

/**
 * 菜单权限码项
 */
export interface MenuPermCodeItem extends BaseEntity {
  /** 权限码 */
  code?: string;
  /** 国际化key */
  i18nKey?: string;
  /** 菜单编码 */
  menuCode?: string;
  /** 是否内置 */
  internal?: boolean;
  /** 备注 */
  remark?: string;
}
