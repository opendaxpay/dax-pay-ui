import type { MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { MchAppInfoApi } from '#/api/payment/merchant/mch-app-info.api';
import { normalizeRouteQueryValue } from '#/hooks/useRequiredRouteQuery';

/**
 * 商户端应用级页面：顶部 appId 选择器
 *
 * - 数据源：`GET /mch/app-info/list`
 * - 去掉 mchNo URL 依赖；可选同步 `?appId=` 便于深链
 * - mchNo 取自选中应用（保存配置时用）
 */
export function useMchAppSelector(options?: { syncQuery?: boolean }) {
  const syncQuery = options?.syncQuery !== false;
  const route = useRoute();
  const router = useRouter();

  const loading = ref(false);
  const apps = ref<MchAppInfoResult[]>([]);
  const appId = ref('');

  const selectedApp = computed(() => apps.value.find((a) => a.appId === appId.value));
  const mchNo = computed(() => selectedApp.value?.mchNo || '');
  const appName = computed(() => selectedApp.value?.appName || '');
  const hasApps = computed(() => apps.value.length > 0);

  /** 下拉选项 */
  const appOptions = computed(() =>
    apps.value.map((a) => ({
      label: a.defaultApp ? `${a.appName} ★` : a.appName || a.appId || '',
      value: a.appId || '',
    })),
  );

  /**
   * 解析初始 appId：URL query > 默认应用 > 列表首项
   */
  function resolveInitialAppId(list: MchAppInfoResult[]): string {
    const fromQuery = normalizeRouteQueryValue(route.query.appId);
    if (fromQuery && list.some((a) => a.appId === fromQuery)) {
      return fromQuery;
    }
    const defaultApp = list.find((a) => a.defaultApp);
    if (defaultApp?.appId) {
      return defaultApp.appId;
    }
    return list[0]?.appId || '';
  }

  /**
   * 同步 appId 到 URL query（不引入 mchNo）
   */
  function syncAppIdQuery(nextAppId: string) {
    if (!syncQuery) {
      return;
    }
    const current = normalizeRouteQueryValue(route.query.appId);
    if (current === nextAppId) {
      return;
    }
    const query = { ...route.query };
    if (nextAppId) {
      query.appId = nextAppId;
    } else {
      delete query.appId;
    }
    // 确保不残留 mchNo
    delete query.mchNo;
    router.replace({ query });
  }

  /**
   * 加载应用列表并选定当前应用
   */
  async function loadApps() {
    loading.value = true;
    try {
      const { data } = await MchAppInfoApi.list();
      apps.value = data || [];
      const next = resolveInitialAppId(apps.value);
      appId.value = next;
      syncAppIdQuery(next);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 切换应用
   */
  function setAppId(next: string) {
    if (!next || next === appId.value) {
      return;
    }
    if (!apps.value.some((a) => a.appId === next)) {
      return;
    }
    appId.value = next;
    syncAppIdQuery(next);
  }

  // 浏览器前进/后退时跟随 query.appId
  watch(
    () => route.query.appId,
    (q) => {
      const next = normalizeRouteQueryValue(q);
      if (next && next !== appId.value && apps.value.some((a) => a.appId === next)) {
        appId.value = next;
      }
    },
  );

  return {
    loading,
    apps,
    appId,
    mchNo,
    appName,
    selectedApp,
    hasApps,
    appOptions,
    loadApps,
    setAppId,
  };
}
