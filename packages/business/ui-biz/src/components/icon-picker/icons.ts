import { ref } from 'vue';

import { addCollection, listIcons } from '@vben/icons';

// 本地图标合并缓存(lucide 通用图标 + simple-icons 品牌图标)
let mergedCache: null | string[] = null;

// 品牌图标集加载态(幂等: 首次调用后复用同一 Promise, 失败后允许重试)
let brandLoading: null | Promise<void> = null;

// 品牌集就位版本号: getLocalIcons/isLocalIcon 读取它建立响应式依赖,
// 选择器列表与手输弱提示等 computed 在品牌集后台加载完成后自动重算
const brandVersion = ref(0);

/**
 * 按需加载品牌图标集(simple-icons, 约 4.55MB)
 * 菜单图标只用 lucide, 品牌集仅供图标选择器候选, 不打进首屏包;
 * 加载完成后注册进内存集合并使合并缓存失效(离线渲染能力保留, 只延后时机)。
 * 由两端 bootstrap 在首屏 load 后空闲期后台预取, 图标选择器打开时也会兜底调用
 */
export function ensureBrandIcons(): Promise<void> {
  if (!brandLoading) {
    brandLoading = import('@iconify/json/json/simple-icons.json')
      .then((mod) => {
        addCollection(mod.default);
        mergedCache = null;
        brandVersion.value++;
      })
      .catch(() => {
        // 加载失败(如弱网)不缓存失败的 Promise, 下次调用重新发起
        brandLoading = null;
      });
  }
  return brandLoading;
}

/**
 * 获取本地已加载的图标列表, 数据源为注册到内存的图标集, 完全离线可用:
 * - lucide: bootstrap 内联注册(通用 UI 图标, 菜单首帧依赖)
 * - simple-icons: ensureBrandIcons 按需注册(品牌图标 wechat/qq/alipay 等)
 * 读取 brandVersion 建立响应式依赖, 品牌集就位后调用方(computed)自动刷新
 */
export function getLocalIcons(): string[] {
  void brandVersion.value;
  if (mergedCache) {
    return mergedCache;
  }
  mergedCache = [...listIcons('', 'lucide'), ...listIcons('', 'simple-icons')];
  return mergedCache;
}

/**
 * 判断指定图标是否存在于本地已加载集合中(用于手输弱提示)
 * 品牌集未就位期间对 simple-icons:* 会短暂返回 false(提示"未收录"),
 * 实际渲染由 @iconify/vue 自动在线 fallback 兜底, 不阻断保存; 集合就位后提示自动消失
 */
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
