import { type MaybeRefOrGetter, computed, toValue, watch } from 'vue';
import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router';

import { $t } from '@vben/locales';

import { useMessage } from './useMessage';

/** 规范化路由 query 值，空串与纯空白视为缺失 */
export function normalizeRouteQueryValue(value: unknown): string {
  return String(value ?? '').trim();
}

/** fallback 目标：纯路径字符串或带 query 的对象 */
export type RouteFallbackTarget = string | { path: string; query?: LocationQueryRaw };

export interface UseRequiredRouteQueryOptions<K extends string = string> {
  /** 必填 query 参数名 */
  keys: readonly K[];
  /** 缺失时 toast 文案 i18n key */
  messageKey: MaybeRefOrGetter<string>;
  /** 返回列表/上级页路径，支持字符串或 { path, query } 对象 */
  fallbackPath: MaybeRefOrGetter<RouteFallbackTarget>;
  /** 是否在缺失时弹出 toast，默认 true */
  showMessage?: boolean;
  /** 所属路由 path，默认取组件 setup 时的 route.path（keep-alive 场景避免误校验） */
  matchPath?: string;
}

/**
 * 校验页面必填路由 query 参数
 */
export function useRequiredRouteQuery<K extends string = string>(options: UseRequiredRouteQueryOptions<K>) {
  const route = useRoute();
  const router = useRouter();
  const { message } = useMessage();

  // 组件 setup 时捕获所属 path，keep-alive 缓存页离开后不参与全局路由校验
  const ownedPath = options.matchPath ?? route.path;

  const isRouteActive = computed(() => route.path === ownedPath);

  const query = computed((): Record<K, string> => {
    const result = {} as Record<K, string>;
    for (const key of options.keys) {
      result[key] = normalizeRouteQueryValue(route.query[key]);
    }
    return result;
  });

  const isValid = computed(() => {
    if (!isRouteActive.value) {
      return true;
    }
    return options.keys.every((key) => !!query.value[key]);
  });

  /** 跳转至 fallback 页面（支持字符串或 { path, query } 对象） */
  function goFallback() {
    router.push(toValue(options.fallbackPath));
  }

  watch(
    isValid,
    (valid) => {
      if (!isRouteActive.value) {
        return;
      }
      if (!valid && options.showMessage !== false) {
        message.warning($t(toValue(options.messageKey)));
      }
    },
    { immediate: true },
  );

  return {
    query,
    isValid,
    isRouteActive,
    goFallback,
  };
}
