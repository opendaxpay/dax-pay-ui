import type { RouteRecordStringComponent } from '@vben/types';

import type { BaseEntity, Result } from '#/types/web';

import { requestClient } from '#/api/request';
import { i18n } from '#/locales';
import zhCnMenuTitles from '../../locales/menu-titles/zh-CN.json';
import enUsMenuTitles from '../../locales/menu-titles/en-US.json';
import zhHkMenuTitles from '../../locales/menu-titles/zh-HK.json';
import zhTwMenuTitles from '../../locales/menu-titles/zh-TW.json';
import jaJpMenuTitles from '../../locales/menu-titles/ja-JP.json';
import koKrMenuTitles from '../../locales/menu-titles/ko-KR.json';
import idIdMenuTitles from '../../locales/menu-titles/id-ID.json';
import viVnMenuTitles from '../../locales/menu-titles/vi-VN.json';
import thThMenuTitles from '../../locales/menu-titles/th-TH.json';
import msMyMenuTitles from '../../locales/menu-titles/ms-MY.json';

/**
 * 注入菜单标题国际化文案
 * 数据源为静态语言包文件（menu-titles/*.json），不依赖 DB title_cn/title_en 列
 * DB 仅存 i18n_key，文案真相源在语言包
 *
 * 仅写入完整 locale（含东盟 id-ID/vi-VN/th-TH/ms-MY）。
 * 禁止把简体挂到短码 `zh`：vue-i18n 对 zh-TW/zh-HK 会回退 zh，会导致繁体界面菜单标题变简体。
 * en/ja/ko/id/vi/th/ms 短码可保留（与完整 locale 文案同语种，回退无害）。
 * 语言切换时由 locales/loadMessages 再次并入对应 menu-titles，与本函数双保险。
 */
export function injectMenuI18n() {
  i18n.global.mergeLocaleMessage('zh-CN', zhCnMenuTitles);
  // 不注入短码 zh，避免 zh-TW/zh-HK 回退到简体
  i18n.global.mergeLocaleMessage('en-US', enUsMenuTitles);
  i18n.global.mergeLocaleMessage('en', enUsMenuTitles);
  i18n.global.mergeLocaleMessage('zh-TW', zhTwMenuTitles);
  i18n.global.mergeLocaleMessage('zh-HK', zhHkMenuTitles);
  i18n.global.mergeLocaleMessage('ja-JP', jaJpMenuTitles);
  i18n.global.mergeLocaleMessage('ja', jaJpMenuTitles);
  i18n.global.mergeLocaleMessage('ko-KR', koKrMenuTitles);
  i18n.global.mergeLocaleMessage('ko', koKrMenuTitles);
  i18n.global.mergeLocaleMessage('id-ID', idIdMenuTitles);
  i18n.global.mergeLocaleMessage('id', idIdMenuTitles);
  i18n.global.mergeLocaleMessage('vi-VN', viVnMenuTitles);
  i18n.global.mergeLocaleMessage('vi', viVnMenuTitles);
  i18n.global.mergeLocaleMessage('th-TH', thThMenuTitles);
  i18n.global.mergeLocaleMessage('th', thThMenuTitles);
  i18n.global.mergeLocaleMessage('ms-MY', msMyMenuTitles);
  i18n.global.mergeLocaleMessage('ms', msMyMenuTitles);
}

/**
 * 统一标题生成链路：返回 i18nKey，由框架 $t 翻译
 */
function resolveMenuTitle(menu: PermMenuResult): string {
  return menu.i18nKey || '';
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
function buildBreadcrumbChainMap(menus: PermMenuResult[]): Map<string, BreadcrumbChainItem[]> {
  const map = new Map<string, BreadcrumbChainItem[]>();
  function walk(nodes: PermMenuResult[], ancestors: BreadcrumbChainItem[]) {
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
 * 根据 menuType 过滤按钮类型节点（按钮不生成可导航路由，仅作权限标识）
 */
function filterButtonMenus(menus: PermMenuResult[]): PermMenuResult[] {
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
function filterPermissionAnchorMenus(menus: PermMenuResult[]): PermMenuResult[] {
  return menus
    .filter((menu) => {
      const menuType = menu.menuType || 'menu';
      if (menuType === 'menu' && !menu.path && !menu.component) {
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
 * 处理单个菜单节点，提取其子菜单中的子页面/子页面分组并提升到当前层级
 * 中文：子页面/子页面分组在数据库中作为菜单的子节点维护，但路由生成时需要提升到目录级别
 */
function processMenuNode(menu: PermMenuResult): PermMenuResult {
  if (!menu.children || menu.children.length === 0) {
    return menu;
  }

  const processedChildren: PermMenuResult[] = [];
  // 从 menu 类型子节点中提升出来的子页面类节点(subpage / subpage_group)
  const lifted: PermMenuResult[] = [];

  for (const child of menu.children) {
    const processedChild = processMenuNode(child);

    // 仅 menu 类型节点下的子页面类需要提升到目录层级；
    // subpage_group 下的 subpage 保留不动（分组整体提升，保持 group>subpage 嵌套用于面包屑）
    if (processedChild.menuType === 'menu' && processedChild.children && processedChild.children.length > 0) {
      const liftable = processedChild.children.filter(
        (c) => c.menuType === 'subpage' || c.menuType === 'subpage_group',
      );
      const remaining = processedChild.children.filter(
        (c) => c.menuType !== 'subpage' && c.menuType !== 'subpage_group',
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
function extractAndLiftSubpages(menus: PermMenuResult[]): PermMenuResult[] {
  return menus.map((menu) => processMenuNode(menu));
}

/**
 * 将后端 PermMenuResult 转换为前端路由格式
 * menuType 分支行为：
 * - catalog：目录容器路由，可带 redirect，不渲染页面
 * - menu：普通组件路由，component 必填
 * - subpage：子页面路由，component 必填，强制隐藏菜单
 * - embedded：内嵌容器路由，component = IFrameView，写入 meta.iframeSrc
 * - link：外链路由，写入 meta.link + meta.external
 * - button：不过滤（已在入参层移除），保留子级处理
 */
function convertMenuToRoute(
  menu: PermMenuResult,
  breadcrumbMap?: Map<string, BreadcrumbChainItem[]>,
): RouteRecordStringComponent {
  const title = resolveMenuTitle(menu);
  const menuType = menu.menuType || 'menu';

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
    case 'catalog': {
      // 目录：无组件，仅容器，可带 redirect
      route.component = '';
      route.redirect = menu.redirect;
      // 目录隐藏时不传递 hideInMenu（目录本身不显示无意义）
      route.meta!.hideInMenu = menu.hidden;
      break;
    }

    case 'embedded': {
      // 内嵌：强制使用 IFrameView 容器，写入 iframeSrc
      route.component = 'IFrameView';
      route.meta!.iframeSrc = menu.iframeSrc || '';
      break;
    }

    case 'link': {
      // 外链：写入 link 地址，component 置空由前端框架处理
      route.component = '';
      route.meta!.link = menu.link || '';
      break;
    }

    case 'subpage': {
      // 子页面：使用 component，强制隐藏菜单
      route.component = menu.component || '';
      route.meta!.hideInMenu = true;
      // 注入完整面包屑链（含 catalog/menu/group），弥补路由提升后 matched 缺失 menu 层
      if (menu.id && breadcrumbMap?.has(menu.id)) {
        route.meta!.customBreadcrumb = breadcrumbMap.get(menu.id);
      }
      break;
    }

    case 'subpage_group': {
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
export function convertMenuListToRoutes(menus: PermMenuResult[]): RouteRecordStringComponent[] {
  const filtered = filterPermissionAnchorMenus(filterButtonMenus(menus));
  // 提升前构建面包屑祖先链映射（提升会破坏 menu→subpage 父子关系，必须在提升前建立）
  const breadcrumbMap = buildBreadcrumbChainMap(filtered);
  const processed = extractAndLiftSubpages(filtered);
  return processed.map((menu) => convertMenuToRoute(menu, breadcrumbMap));
}

/**
 * 获取当前用户菜单
 * 接口：/perm/menu/my
 */
export async function getAllMenusApi() {
  return requestClient.get<Result<PermMenuResult[]>>('/perm/menu/my');
}

/**
 * 运行时菜单结果类型（与后端 PermMenuResult 对齐）
 * 严格遵循 Entity-first 约定：所有字段均可由数据库实体直接映射产生
 * menuType 分支值：catalog=目录, menu=菜单, subpage=子页面, embedded=内嵌, link=外链, button=按钮
 */
export interface PermMenuResult extends BaseEntity {
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
  /** 菜单类型: catalog-目录, menu-菜单, embedded-内嵌, link-外链, button-按钮 */
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
  children?: PermMenuResult[];
}
