<script lang="ts" setup>
  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  interface Props {
    /** 指标标签(i18n key 或已翻译文本) */
    label: string;
    /** 主数值; undefined 表示加载失败 */
    value?: null | number;
    /** 数值前缀(如 ¥) */
    prefix?: string;
    /** 数值后缀(如 %) */
    suffix?: string;
    /** 环比百分比(正涨负跌, null 表示无上期数据) */
    chainRatio?: null | number;
    /** 是否归零显示(0 显示 ¥0 但灰色, undefined 显示 —) */
    zeroAsEmpty?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    chainRatio: null,
    prefix: '',
    suffix: '',
    zeroAsEmpty: true,
    value: undefined,
  });

  defineOptions({ name: 'StatCard' });

  /** 三态: 'error'(加载失败, value undefined) | 'empty'(真无数据, value===0) | 'normal' */
  const status = computed<'empty' | 'error' | 'normal'>(() => {
    if (props.value === undefined || props.value === null) return 'error';
    if (props.zeroAsEmpty && props.value === 0) return 'empty';
    return 'normal';
  });

  /** 格式化数值(千分位) */
  function formatNum(v: number): string {
    return v.toLocaleString('en-US');
  }
</script>

<template>
  <a-card variant="borderless" class="!bg-card">
    <div class="text-foreground/60 text-sm">{{ label }}</div>
    <div
      class="mt-2 text-2xl font-semibold tabular-nums"
      :class="status === 'empty' ? 'text-foreground/40' : ''"
    >
      <template v-if="status === 'error'">—</template>
      <template v-else>
        <span v-if="prefix" class="mr-0.5 text-base">{{ prefix }}</span>
        {{ formatNum(value!) }}
        <span v-if="suffix" class="ml-0.5 text-base">{{ suffix }}</span>
      </template>
    </div>
    <div class="mt-1 flex items-center text-xs">
      <span
        v-if="chainRatio !== null && Number.isFinite(chainRatio)"
        :class="chainRatio >= 0 ? 'text-red-500' : 'text-emerald-500'"
      >
        <!-- 涨跌色遵循中国惯例：涨红跌绿 -->
        {{ chainRatio >= 0 ? '↑' : '↓' }} {{ Math.abs(chainRatio) }}%
      </span>
      <span v-else class="text-foreground/40">—</span>
      <span class="text-foreground/40 ml-1">{{ $t('dashboard.analytics.overview.chainRatio') }}</span>
    </div>
  </a-card>
</template>
