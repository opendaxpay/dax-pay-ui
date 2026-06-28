<script lang="ts" setup>
  import type { OverviewStat } from '../types';

  import { $t } from '@vben/locales';

  defineOptions({ name: 'AnalysisOverview' });

  const props = withDefaults(defineProps<Props>(), {
    data: () => [],
  });

  interface Props {
    /** 6 个指标卡片数据（规模 + 质量） */
    data?: OverviewStat[];
  }

  // 数值千分位格式化
  function formatNum(v: number): string {
    return v.toLocaleString('en-US');
  }
</script>

<template>
  <a-row :gutter="[16, 16]">
    <a-col v-for="item in props.data" :key="item.key" :span="4">
      <a-card variant="borderless" class="!bg-card">
        <div class="text-foreground/60 text-sm">
          {{ $t(`dashboard.analytics.overview.${item.key}`) }}
        </div>
        <div class="mt-2 text-2xl font-semibold tabular-nums">
          <span v-if="item.prefix" class="mr-0.5 text-base">{{ item.prefix }}</span>
          {{ formatNum(item.value) }}
          <span v-if="item.suffix" class="ml-0.5 text-base">{{ item.suffix }}</span>
        </div>
        <div class="mt-1 flex items-center text-xs">
          <span :class="item.chainRatio >= 0 ? 'text-emerald-500' : 'text-red-500'">
            {{ item.chainRatio >= 0 ? '↑' : '↓' }} {{ Math.abs(item.chainRatio) }}%
          </span>
          <span class="text-foreground/40 ml-1">{{ $t('dashboard.analytics.overview.chainRatio') }}</span>
        </div>
      </a-card>
    </a-col>
  </a-row>
</template>
