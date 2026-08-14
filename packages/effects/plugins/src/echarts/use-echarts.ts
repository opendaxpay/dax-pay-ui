import type { EChartsOption } from 'echarts';

import type { Ref } from 'vue';

import type { Nullable } from '@vben/types';

import type EchartsUI from './echarts-ui.vue';

import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  unref,
  watch,
} from 'vue';

import { usePreferences } from '@vben/preferences';

import {
  tryOnUnmounted,
  useDebounceFn,
  useResizeObserver,
  useTimeoutFn,
  useWindowSize,
} from '@vueuse/core';

import echarts from './echarts';

type EchartsUIType = typeof EchartsUI | undefined;

type EchartsThemeType = 'dark' | 'light' | null;

function useEcharts(chartRef: Ref<EchartsUIType>) {
  let chartInstance: echarts.ECharts | null = null;
  let cacheOptions: EChartsOption = {};
  // 渲染代际: 每次 renderEcharts 调用自增, 使旧调用(含其 30ms 重试链)失效,
  // 防止"空数据时的遗留重试"在后续真实渲染完成后再次 setOption 覆盖画面(表现为空白 canvas)
  let renderGeneration = 0;
  // echarts是否处于激活状态
  const isActiveRef = ref(false);

  const { isDark } = usePreferences();
  const { height, width } = useWindowSize();
  const resizeHandler: () => void = useDebounceFn(resize, 200);

  const getChartEl = (): HTMLElement | null => {
    const refValue = chartRef?.value as unknown;
    if (!refValue) return null;
    if (refValue instanceof HTMLElement) {
      return refValue;
    }
    const maybeComponent = refValue as { $el?: HTMLElement };
    return maybeComponent.$el ?? null;
  };

  onMounted(() => (isActiveRef.value = true));
  onActivated(() => (isActiveRef.value = true));
  onDeactivated(() => (isActiveRef.value = false));
  onBeforeUnmount(() => (isActiveRef.value = false));

  const isElHidden = (el: HTMLElement | null): boolean => {
    if (!el) return true;
    return el.offsetHeight === 0 || el.offsetWidth === 0;
  };

  const getOptions = computed((): EChartsOption => {
    if (!isDark.value) {
      return {};
    }

    return {
      backgroundColor: 'transparent',
    };
  });

  const initCharts = (t?: EchartsThemeType) => {
    const el = chartRef?.value?.$el;
    if (!el) {
      return;
    }
    chartInstance = echarts.init(el, t || isDark.value ? 'dark' : null);

    return chartInstance;
  };

  const renderEcharts = (
    options: EChartsOption,
    clear = true,
  ): Promise<Nullable<echarts.ECharts>> => {
    if (!unref(isActiveRef)) {
      return Promise.resolve(null);
    }
    cacheOptions = options;
    const currentOptions = {
      ...options,
      ...getOptions.value,
    };
    // 本次调用取代之前所有进行中的渲染/重试链
    const generation = ++renderGeneration;
    return new Promise((resolve) => {
      if (chartRef.value?.offsetHeight === 0) {
        useTimeoutFn(async () => {
          if (generation !== renderGeneration) {
            resolve(null);
            return;
          }
          resolve(await renderEcharts(currentOptions));
        }, 30);
        return;
      }
      nextTick(() => {
        if (generation !== renderGeneration) {
          resolve(null);
          return;
        }
        const el = getChartEl();
        if (isElHidden(el)) {
          useTimeoutFn(async () => {
            if (generation !== renderGeneration) {
              resolve(null);
              return;
            }
            resolve(await renderEcharts(currentOptions));
          }, 30);
          return;
        }
        useTimeoutFn(() => {
          // setOption 前最后一道防线: 等待期间若已被新调用取代则放弃, 避免旧 options 清空画面
          if (generation !== renderGeneration) {
            resolve(null);
            return;
          }
          if (!chartInstance || chartInstance?.getDom() !== el) {
            chartInstance?.dispose();
            const instance = initCharts();
            if (!instance) return;
            chartInstance = instance;
          }
          clear && chartInstance?.clear();
          chartInstance?.setOption(currentOptions);
          resolve(chartInstance);
        }, 30);
      });
    });
  };

  const updateData = (
    option: EChartsOption,
    notMerge = false, // false = 合并（保留动画），true = 完全替换
    lazyUpdate = false, // true 时不立即重绘，适合短时间内多次调用
  ): Promise<echarts.ECharts | null> => {
    return new Promise((resolve) => {
      nextTick(() => {
        if (!chartInstance) {
          // 还没初始化 → 当作首次渲染
          renderEcharts(option).then(resolve);
          return;
        }

        // 合并你原有的全局配置（比如 backgroundColor）
        const finalOption = {
          ...option,
          ...getOptions.value,
        };

        chartInstance.setOption(finalOption, {
          notMerge,
          lazyUpdate,
          // silent: true,     // 如果追求极致性能可开启（关闭所有事件）
        });

        resolve(chartInstance);
      });
    });
  };

  function resize() {
    const el = getChartEl();
    if (isElHidden(el)) {
      return;
    }
    chartInstance?.resize({
      animation: {
        duration: 300,
        easing: 'quadraticIn',
      },
    });
  }

  watch([width, height], () => {
    resizeHandler?.();
  });

  useResizeObserver(chartRef as never, resizeHandler);

  watch([isDark, isActiveRef], () => {
    if (chartInstance && unref(isActiveRef)) {
      chartInstance.dispose();
      initCharts();
      renderEcharts(cacheOptions);
      resize();
    }
  });

  tryOnUnmounted(() => {
    // 销毁实例，释放资源
    chartInstance?.dispose();
  });
  return {
    isActive: isActiveRef,
    renderEcharts,
    resize,
    updateData,
    getChartInstance: () => chartInstance,
  };
}

export { useEcharts };

export type { EchartsUIType };
