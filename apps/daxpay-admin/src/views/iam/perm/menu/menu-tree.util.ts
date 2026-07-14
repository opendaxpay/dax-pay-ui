import type { Menu } from '#/api/iam/perm/menu.api';

import { i18n } from '@vben/locales';

import { MenuTypeEnum } from '#/enums/menuType';

/**
 * 子页面嵌套策略：维持「subpage 仅挂在 menu 下、不可再有下级」。
 * 路由侧由 convertMenuListToRoutes 提升子页面，不在管理端开放多级 subpage。
 */

/** 骨架树节点：不含 subpage 子节点，附带子页面/分组数量 */
export interface MenuSkeletonNode extends Menu {
  /** 直属子页面数量（menu 为未分组直挂数，subpage_group 为其下子页面数） */
  subpageCount?: number;
  /** 直属子页面分组数量（仅 menu 有值） */
  subpageGroupCount?: number;
  children?: MenuSkeletonNode[];
}

/** 子页面搜索命中 */
export interface SubpageMatch {
  subpage: Menu;
  parentMenu: Menu;
}

/** 骨架树搜索（含子页面）结果 */
export interface SkeletonSearchResult {
  tree: MenuSkeletonNode[];
  subpageMatches: SubpageMatch[];
}

/**
 * 统计菜单节点下直属子页面数量
 */
export function countDirectSubpages(node: Menu): number {
  return (node.children || []).filter((child) => child.menuType === MenuTypeEnum.SUBPAGE).length;
}

/**
 * 从树中剥离 subpage，构建骨架树（catalog / menu / embedded / link / subpage_group）
 * subpage_group 作为可展开分组节点保留，其下 subpage 仍剥离
 */
export function buildSkeletonTree(data: Menu[]): MenuSkeletonNode[] {
  return data.map((item) => {
    const directSubpages = (item.children || []).filter((c) => c.menuType === MenuTypeEnum.SUBPAGE);
    const directGroups = (item.children || []).filter((c) => c.menuType === MenuTypeEnum.SUBPAGE_GROUP);
    // 骨架子节点：排除 subpage（由右侧面板管理），保留 subpage_group 作为可展开分组节点
    const skeletonChildrenRaw = (item.children || []).filter((c) => c.menuType !== MenuTypeEnum.SUBPAGE);
    const builtChildren = buildSkeletonTree(skeletonChildrenRaw);
    return {
      ...item,
      children: builtChildren.length > 0 ? builtChildren : undefined,
      // menu 记直属分组数
      subpageGroupCount: item.menuType === MenuTypeEnum.MENU ? directGroups.length : undefined,
      // menu 记未分组直挂子页面数；subpage_group 记其下子页面数
      subpageCount:
        item.menuType === MenuTypeEnum.MENU || item.menuType === MenuTypeEnum.SUBPAGE_GROUP
          ? directSubpages.length
          : undefined,
    };
  });
}

/**
 * 扁平化菜单树，建立 id -> 节点映射
 */
export function flattenMenuMap(data: Menu[], map = new Map<string, Menu>()): Map<string, Menu> {
  for (const item of data) {
    if (item.id) {
      map.set(item.id, item);
    }
    if (item.children?.length) {
      flattenMenuMap(item.children, map);
    }
  }
  return map;
}

/**
 * 获取某节点下直属子页面列表（适用于 menu 直挂 / subpage_group 下）
 */
export function getDirectSubpages(parent: Menu, allMap: Map<string, Menu>): Menu[] {
  const node = parent.id ? allMap.get(parent.id) : parent;
  if (!node?.children?.length) {
    return [];
  }
  return node.children.filter((child) => child.menuType === MenuTypeEnum.SUBPAGE);
}

/**
 * 获取 menu 下直属子页面分组 + 直挂子页面（未分组的老数据）
 */
export function getDirectMenuChildren(menu: Menu, allMap: Map<string, Menu>): Menu[] {
  const node = menu.id ? allMap.get(menu.id) : menu;
  if (!node?.children?.length) {
    return [];
  }
  return node.children.filter(
    (child) => child.menuType === MenuTypeEnum.SUBPAGE_GROUP || child.menuType === MenuTypeEnum.SUBPAGE,
  );
}

/**
 * 获取 menu 下直属子页面分组列表
 */
export function getDirectSubpageGroups(menu: Menu, allMap: Map<string, Menu>): Menu[] {
  const node = menu.id ? allMap.get(menu.id) : menu;
  if (!node?.children?.length) {
    return [];
  }
  return node.children.filter((child) => child.menuType === MenuTypeEnum.SUBPAGE_GROUP);
}

/**
 * 获取目录下直属 menu / embedded / link（不含 subpage，不递归）
 */
export function getDirectMenusUnderCatalog(catalog: Menu, allMap: Map<string, Menu>): Menu[] {
  const node = catalog.id ? allMap.get(catalog.id) : catalog;
  if (!node?.children?.length) {
    return [];
  }
  return node.children.filter((child) => child.menuType !== MenuTypeEnum.SUBPAGE);
}

/**
 * 按关键字匹配菜单节点（标题、编码、路径、组件）
 */
export function matchesMenuKeyword(node: Menu, keyword: string): boolean {
  const lower = keyword.toLowerCase();
  // 匹配翻译后的菜单标题
  const title = node.i18nKey ? i18n.global.t(node.i18nKey) : '';
  return !!(
    title.toLowerCase().includes(lower) ||
    node.menuCode?.toLowerCase().includes(lower) ||
    node.path?.toLowerCase().includes(lower) ||
    node.component?.toLowerCase().includes(lower)
  );
}

/**
 * 在全量菜单树中查找匹配关键字的子页面（递归进入子页面分组）
 */
export function findMatchingSubpages(fullTree: Menu[], keyword: string): SubpageMatch[] {
  const matches: SubpageMatch[] = [];

  function walk(nodes: Menu[]) {
    for (const node of nodes) {
      // 子页面可挂在 menu 或 subpage_group 下
      if (node.menuType === MenuTypeEnum.MENU || node.menuType === MenuTypeEnum.SUBPAGE_GROUP) {
        for (const child of node.children || []) {
          if (child.menuType === MenuTypeEnum.SUBPAGE && matchesMenuKeyword(child, keyword)) {
            matches.push({ subpage: child, parentMenu: node });
          }
        }
      }
      if (node.children?.length) {
        walk(node.children);
      }
    }
  }

  walk(fullTree);
  return matches;
}

/**
 * 按关键字过滤骨架树
 */
export function filterSkeletonTree(data: MenuSkeletonNode[], keyword: string): MenuSkeletonNode[] {
  const result: MenuSkeletonNode[] = [];
  for (const item of data) {
    const match = matchesMenuKeyword(item, keyword);

    if (match) {
      result.push(item);
    } else if (item.children?.length) {
      const children = filterSkeletonTree(item.children, keyword);
      if (children.length > 0) {
        result.push({ ...item, children });
      }
    }
  }
  return result;
}

/**
 * 收集骨架树中全部节点 id
 */
function collectIdsInTree(tree: MenuSkeletonNode[]): Set<string> {
  const ids = new Set<string>();

  function walk(nodes: MenuSkeletonNode[]) {
    for (const node of nodes) {
      if (node.id) {
        ids.add(node.id);
      }
      if (node.children?.length) {
        walk(node.children);
      }
    }
  }

  walk(tree);
  return ids;
}

/**
 * 在骨架树中查找目标节点的祖先路径（含自身）
 */
function findPathToNode(tree: MenuSkeletonNode[], targetId: string, path: string[] = []): null | string[] {
  for (const node of tree) {
    const currentPath = node.id ? [...path, node.id] : path;
    if (node.id === targetId) {
      return currentPath;
    }
    if (node.children?.length) {
      const found = findPathToNode(node.children, targetId, currentPath);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * 按骨架关键字 + 子页面命中合并过滤骨架树
 */
export function filterSkeletonTreeWithSubpages(
  skeletonTree: MenuSkeletonNode[],
  fullTree: Menu[],
  keyword: string,
): SkeletonSearchResult {
  const skeletonFiltered = filterSkeletonTree(skeletonTree, keyword);
  const subpageMatches = findMatchingSubpages(fullTree, keyword);
  const includeIds = collectIdsInTree(skeletonFiltered);

  for (const { parentMenu } of subpageMatches) {
    if (parentMenu.id) {
      const path = findPathToNode(skeletonTree, parentMenu.id);
      if (path) {
        for (const id of path) {
          includeIds.add(id);
        }
      }
    }
  }

  function prune(nodes: MenuSkeletonNode[]): MenuSkeletonNode[] {
    const result: MenuSkeletonNode[] = [];
    for (const item of nodes) {
      if (!item.id || !includeIds.has(item.id)) {
        continue;
      }
      const children = item.children?.length ? prune(item.children) : undefined;
      result.push({
        ...item,
        children: children?.length ? children : undefined,
      });
    }
    return result;
  }

  return {
    tree: prune(skeletonTree),
    subpageMatches,
  };
}
