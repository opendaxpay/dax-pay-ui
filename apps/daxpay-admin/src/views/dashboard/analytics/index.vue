<script lang="ts" setup>
  import { $t } from '@vben/locales';

  import AnalysisAmountRange from './components/analysis-amount-range.vue';
  import AnalysisChannelSuccess from './components/analysis-channel-success.vue';
  import AnalysisChannelVolume from './components/analysis-channel-volume.vue';
  import AnalysisHourlyDist from './components/analysis-hourly-dist.vue';
  import AnalysisMerchantRank from './components/analysis-merchant-rank.vue';
  import AnalysisOverview from './components/analysis-overview.vue';
  import AnalysisPayMethod from './components/analysis-pay-method.vue';
  import AnalysisRefundTrend from './components/analysis-refund-trend.vue';
  import AnalysisTradeTrend from './components/analysis-trade-trend.vue';
  import { useAnalyticsData } from './composables/useAnalyticsData';

  defineOptions({ name: 'Analytics' });

  // 全局时间范围（预设 + 自定义互斥）+ 派生数据(异步加载, 8 个维度并发)
  const { activePreset, customRange, data, isCustom, loading, subtitle } = useAnalyticsData();
</script>

<template>
  <div class="p-4">
    <!-- 顶部工具栏：标题 + 动态日期摘要 / 预设切换 + 自定义范围（卡片包裹） -->
    <div class="card-box mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
      <!-- 左：标题 + 日期摘要（一行，分隔符区隔） -->
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-semibold">{{ $t('dashboard.analytics.title') }}</h2>
        <span class="text-foreground/40">·</span>
        <span class="text-foreground/60 text-sm">{{ subtitle }}</span>
      </div>
      <!-- 右：预设切换 + 自定义范围（选「自定义」才启用 picker） -->
      <div class="flex items-center gap-3">
        <a-radio-group v-model:value="activePreset" button-style="solid">
          <a-radio-button value="last7days">{{ $t('dashboard.analytics.timeRange.last7days') }}</a-radio-button>
          <a-radio-button value="last30days">{{ $t('dashboard.analytics.timeRange.last30days') }}</a-radio-button>
          <a-radio-button value="thisMonth">{{ $t('dashboard.analytics.timeRange.thisMonth') }}</a-radio-button>
          <a-radio-button value="custom">{{ $t('dashboard.analytics.timeRange.custom') }}</a-radio-button>
        </a-radio-group>
        <a-range-picker v-model:value="customRange" :disabled="!isCustom" allow-clear value-format="YYYY-MM-DD" />
      </div>
    </div>

    <!-- 指标卡片行：规模(总额/笔数/客单价) + 质量(成功率/退款额/退款率) -->
    <AnalysisOverview :data="data.overview" :loading="loading" />

    <!-- 图表网格：核心趋势 → 洞察三连 → 深度 → 明细 -->
    <a-row :gutter="[16, 16]" align="stretch" class="!mt-4">
      <!-- 第二行：交易趋势(多度量) + 支付方式占比 -->
      <a-col :span="16">
        <AnalysisTradeTrend :data="data.tradeTrend" :loading="loading" />
      </a-col>
      <a-col :span="8">
        <AnalysisPayMethod :data="data.payMethod" :loading="loading" />
      </a-col>

      <!-- 第三行：洞察三连（渠道质量/时段/金额区间） -->
      <a-col :span="8">
        <AnalysisChannelSuccess :data="data.channelSuccess" :loading="loading" />
      </a-col>
      <a-col :span="8">
        <AnalysisHourlyDist :data="data.hourlyDist" :loading="loading" />
      </a-col>
      <a-col :span="8">
        <AnalysisAmountRange :data="data.amountRange" :loading="loading" />
      </a-col>

      <!-- 第四行：渠道交易量 + 退款趋势 -->
      <a-col :span="12">
        <AnalysisChannelVolume :data="data.channelVolume" :loading="loading" />
      </a-col>
      <a-col :span="12">
        <AnalysisRefundTrend :data="data.refundTrend" :loading="loading" />
      </a-col>

      <!-- 第五行：商户交易额排名明细 -->
      <a-col :span="24">
        <AnalysisMerchantRank :data="data.merchantRank" :loading="loading" />
      </a-col>
    </a-row>
  </div>
</template>
