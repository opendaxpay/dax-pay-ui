import type { Ref } from 'vue';

import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * PageShell 左导航配置页的 ?tab= 双向同步 hook(防裂页签配套)
 *
 * 使用页所在路由必须在 menu.api.ts 的 QUERY_SYNC_PATHS 登记(meta.fullPathKey=false,
 * 页签 key 忽略 query), 否则带 query 访问会在页签栏裂出独立页签, 且 keep-alive
 * 随 key 失效导致切分组整页重挂闪烁(同 Hub 页登记机制)。
 *
 * - 初始化: query.tab 命中可见分组则激活, 无效/缺省回退首个可见分组
 * - 切分组: router.replace 回写 ?tab=(其余 query 保留, 同 path 同 key 仅激活既有页签)
 * - 外部导航: watch query.tab 跟随(菜单裸路径进入时 query 清空回退首个可见分组)
 *
 * @param getValidKeys 当前可见分组 key 列表(权限过滤型页签传函数延迟求值)
 * @returns activeKey 当前分组; handleTabChange 分组点击处理器(绑定导航按钮 @click)
 */
export function useQueryTab(getValidKeys: () => string[]): {
  activeKey: Ref<string>;
  handleTabChange: (key: string) => void;
} {
  const route = useRoute();
  const router = useRouter();

  // query 归一: 命中可见分组返回原值, 否则回退首个可见分组
  function normalizeTab(raw: unknown): string {
    const tab = typeof raw === 'string' ? raw : '';
    const keys = getValidKeys();
    return keys.includes(tab) ? tab : (keys[0] ?? '');
  }

  const activeKey = ref(normalizeTab(route.query.tab));

  /**
   * 分组点击: 激活并回写 ?tab= 到路由
   */
  function handleTabChange(key: string) {
    activeKey.value = key;
    if (route.query.tab === key) {
      return;
    }
    router.replace({ path: route.path, query: { ...route.query, tab: key } });
  }

  // 外部导航带 ?tab= 时跟随(无效值/菜单裸路径进入回退首个可见分组)
  watch(
    () => route.query.tab,
    (raw) => {
      const next = normalizeTab(raw);
      if (next && next !== activeKey.value) {
        activeKey.value = next;
      }
    },
  );

  return { activeKey, handleTabChange };
}
