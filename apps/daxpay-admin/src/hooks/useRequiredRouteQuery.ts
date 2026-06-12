import { type MaybeRefOrGetter, computed, toValue, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { $t } from '@vben/locales';

import { useMessage } from '#/hooks/useMessage';

/** 规范化路由 query 值，空串与纯空白视为缺失 */
export function normalizeRouteQueryValue(value: unknown): string {
  return String(value ?? '').trim();
}

export interface UseRequiredRouteQueryOptions {
  /** 必填 query 参数名 */
  keys: string[];
  /** 缺失时 toast 文案 i18n key */
  messageKey: MaybeRefOrGetter<string>;
  /** 返回列表/上级页路径，可含 query 字符串 */
  fallbackPath: MaybeRefOrGetter<string>;
  /** 是否在缺失时弹出 toast，默认 true */
  showMessage?: boolean;
  /** 所属路由 path，默认取组件 setup 时的 route.path（keep-alive 场景避免误校验） */
  matchPath?: string;
}

/**
 * 校验页面必填路由 query 参数
 */
export function useRequiredRouteQuery(options: UseRequiredRouteQueryOptions) {
  const route = useRoute();
  const router = useRouter();
  const { message } = useMessage();

  // 组件 setup 时捕获所属 path，keep-alive 缓存页离开后不参与全局路由校验
  const ownedPath = options.matchPath ?? route.path;

  const isRouteActive = computed(() => route.path === ownedPath);

  const query = computed(() => {
    const result: Record<string, string> = {};
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

  /** 跳转至 fallback 页面 */
  function goFallback() {
    const path = toValue(options.fallbackPath);
    const queryIndex = path.indexOf('?');
    if (queryIndex === -1) {
      router.push(path);
      return;
    }
    const pathname = path.slice(0, queryIndex);
    const search = path.slice(queryIndex + 1);
    const queryObj: Record<string, string> = {};
    new URLSearchParams(search).forEach((value, key) => {
      queryObj[key] = value;
    });
    router.push({ path: pathname, query: queryObj });
  }

  watch(
    isValid,
    (valid) => {
      if (!isRouteActive.value) {
        return;
      }
      if (!valid && options.showMessage !== false) {
        // 国际化：路由必填参数缺失提示
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
