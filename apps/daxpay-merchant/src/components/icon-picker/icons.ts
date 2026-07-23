import { listIcons } from '@vben/icons';

// 本地图标合并缓存(lucide 通用图标 + simple-icons 品牌图标)
let mergedCache: string[] | null = null;

/**
 * 获取本地已预加载的图标列表
 * 数据源为 bootstrap 中 addCollection 注册到内存的图标集,完全离线可用:
 * - lucide: 通用 UI 图标(线条风,菜单主力)
 * - simple-icons: 品牌图标(wechat/qq/alipay/tiktok 等)
 * 合并后支持双集合并搜索,如搜 wechat 命中品牌图标,搜 user 命中 UI 图标
 */
export function getLocalIcons(): string[] {
  if (mergedCache) {
    return mergedCache;
  }
  mergedCache = [...listIcons('', 'lucide'), ...listIcons('', 'simple-icons')];
  return mergedCache;
}

/** 判断指定图标是否存在于本地预加载集合中(用于手输弱提示) */
export function isLocalIcon(icon: string): boolean {
  if (!icon) {
    return false;
  }
  return getLocalIcons().includes(icon);
}

/** 清除本地图标缓存(图标集动态更新后强制刷新) */
export function clearIconCache(): void {
  mergedCache = null;
}
