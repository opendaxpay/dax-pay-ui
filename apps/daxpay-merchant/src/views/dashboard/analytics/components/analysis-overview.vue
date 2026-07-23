<script lang="ts" setup>
  import type { OverviewStat } from '../types';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  import StatCard from '#/components/charts/StatCard.vue';

  defineOptions({ name: 'AnalysisOverview' });

  const props = withDefaults(defineProps<Props>(), {
    data: () => [],
    emptyText: '',
    error: false,
    loading: false,
  });

  interface Props {
    /** 6 个指标卡片数据（规模 + 质量） */
    data?: OverviewStat[];
    /** 加载中(显示骨架屏) */
    loading?: boolean;
    /** 加载失败(显示错误占位 + 重试) */
    error?: boolean;
    /** 空状态文案(预留, 默认走 a-empty 自带文案) */
    emptyText?: string;
  }

  defineEmits<{ retry: [] }>();
</script>

<template>
  <a-row :gutter="[16, 16]">
    <!-- 错误占位: 跨 24 列显示 a-result + 重试 -->
    <a-col v-if="error" :span="24">
      <a-card variant="borderless" class="!bg-card">
        <div class="flex flex-col items-center justify-center gap-2 py-4">
          <IconifyIcon icon="ant-design:warning-outlined" class="text-foreground/40 size-8" />
          <p class="text-foreground/60 text-sm">{{ $t('common.loadFailed') }}</p>
          <a-button size="small" type="primary" @click="$emit('retry')">{{ $t('common.retry') }}</a-button>
        </div>
      </a-card>
    </a-col>
    <!-- 加载中: 6 个 skeleton 卡片占位 -->
    <template v-else-if="loading">
      <a-col v-for="i in 6" :key="i" :span="4">
        <a-card variant="borderless" class="!bg-card">
          <a-skeleton active :paragraph="{ rows: 2 }" />
        </a-card>
      </a-col>
    </template>
    <!-- 无数据: 跨 24 列 a-empty -->
    <a-col v-else-if="props.data.length === 0" :span="24">
      <a-card variant="borderless" class="!bg-card">
        <a-empty :description="emptyText || $t('common.noData')" class="!my-6" />
      </a-card>
    </a-col>
    <!-- 正常: 6 个 StatCard(0 自动灰色, undefined 自动 —) -->
    <a-col v-for="item in props.data" v-else :key="item.key" :span="4">
      <StatCard
        :chain-ratio="item.chainRatio"
        :label="$t(`dashboard.analytics.overview.${item.key}`)"
        :prefix="item.prefix"
        :suffix="item.suffix"
        :value="item.value"
      />
    </a-col>
  </a-row>
</template>
