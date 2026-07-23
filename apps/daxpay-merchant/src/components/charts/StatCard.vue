<script lang="ts" setup>
  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  /** 环比三态: pct / new / null(无意义显示 —) */
  type ChainRatioResult = { type: 'new' } | { type: 'pct'; value: number } | null;

  interface Props {
    /** 指标标签(i18n key 或已翻译文本) */
    label: string;
    /** 主数值; undefined 表示加载失败 */
    value?: null | number;
    /** 数值前缀(如 ¥) */
    prefix?: string;
    /** 数值后缀(如 %) */
    suffix?: string;
    /** 环比三态: pct / new / null(无意义显示 —) */
    chainRatio?: ChainRatioResult;
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

  /** 格式化数值(千分位)；金额(¥ 前缀)固定 2 位小数 */
  function formatNum(v: number): string {
    if (props.prefix === '¥') {
      return v.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
    }
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
      <!-- 环比百分比: 涨红跌绿 -->
      <span
        v-if="chainRatio?.type === 'pct'"
        :class="chainRatio.value >= 0 ? 'text-red-500' : 'text-emerald-500'"
      >
        {{ chainRatio.value >= 0 ? '↑' : '↓' }} {{ Math.abs(chainRatio.value) }}%
      </span>
      <!-- 上期无基数、本期有值: 显示「新增」, 不造假百分比 -->
      <span v-else-if="chainRatio?.type === 'new'" class="text-primary">
        {{ $t('dashboard.analytics.overview.chainRatioNew') }}
      </span>
      <span v-else class="text-foreground/40">—</span>
      <!-- new 态已含「新增」语义, 不再追加「环比」 -->
      <span
        v-if="chainRatio?.type !== 'new'"
        class="text-foreground/40 ml-1"
      >
        {{ $t('dashboard.analytics.overview.chainRatio') }}
      </span>
    </div>
  </a-card>
</template>
