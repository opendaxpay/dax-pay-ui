<script lang="ts" setup>
  import { $t } from '@vben/locales';

  import AnalysisAmountRange from './components/analysis-amount-range.vue';
  import AnalysisChannelSuccess from './components/analysis-channel-success.vue';
  import AnalysisChannelVolume from './components/analysis-channel-volume.vue';
  import AnalysisHourlyDist from './components/analysis-hourly-dist.vue';
  import AnalysisDimRank from './components/analysis-dim-rank.vue';
  import AnalysisOverview from './components/analysis-overview.vue';
  import AnalysisPayMethod from './components/analysis-pay-method.vue';
  import AnalysisRefundTrend from './components/analysis-refund-trend.vue';
  import AnalysisTradeTrend from './components/analysis-trade-trend.vue';
  import { useAnalyticsData } from './composables/useAnalyticsData';

  defineOptions({ name: 'Analytics' });

  // 全局时间范围（预设 + 自定义互斥）+ 派生数据(异步加载, 8 个维度并发)
  const { activePreset, customRange, data, dateRange, errors, isCustom, loading, reload, subtitle } = useAnalyticsData();
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
          <a-radio-button value="today">{{ $t('dashboard.analytics.timeRange.today') }}</a-radio-button>
          <a-radio-button value="yesterday">{{ $t('dashboard.analytics.timeRange.yesterday') }}</a-radio-button>
          <a-radio-button value="last7days">{{ $t('dashboard.analytics.timeRange.last7days') }}</a-radio-button>
          <a-radio-button value="last30days">{{ $t('dashboard.analytics.timeRange.last30days') }}</a-radio-button>
          <a-radio-button value="thisMonth">{{ $t('dashboard.analytics.timeRange.thisMonth') }}</a-radio-button>
          <a-radio-button value="custom">{{ $t('dashboard.analytics.timeRange.custom') }}</a-radio-button>
        </a-radio-group>
        <a-range-picker v-model:value="customRange" :disabled="!isCustom" allow-clear value-format="YYYY-MM-DD" />
      </div>
    </div>

    <!-- 指标卡片行：规模(总额/笔数/客单价) + 质量(成功率/退款额/退款率) -->
    <AnalysisOverview
      :data="data.overview"
      :error="errors.overview"
      :loading="loading"
      @retry="reload"
    />

    <!-- 图表网格：核心趋势 → 洞察三连 → 深度 → 明细 -->
    <a-row :gutter="[16, 16]" align="stretch" class="!mt-4">
      <!-- 第二行：交易趋势(多度量) + 支付方式占比 -->
      <a-col :span="16">
        <AnalysisTradeTrend
          :data="data.tradeTrend"
          :error="errors.tradeTrend"
          :loading="loading"
          @retry="reload"
        />
      </a-col>
      <a-col :span="8">
        <AnalysisPayMethod
          :data="data.payMethod"
          :error="errors.payMethod"
          :loading="loading"
          @retry="reload"
        />
      </a-col>

      <!-- 第三行：洞察三连（渠道质量/时段/金额区间） -->
      <a-col :span="8">
        <AnalysisChannelSuccess
          :data="data.channelSuccess"
          :error="errors.channelSuccess"
          :loading="loading"
          @retry="reload"
        />
      </a-col>
      <a-col :span="8">
        <AnalysisHourlyDist
          :data="data.hourlyDist"
          :error="errors.hourlyDist"
          :loading="loading"
          @retry="reload"
        />
      </a-col>
      <a-col :span="8">
        <AnalysisAmountRange
          :data="data.amountRange"
          :error="errors.amountRange"
          :loading="loading"
          @retry="reload"
        />
      </a-col>

      <!-- 第四行：渠道交易量 + 退款趋势 -->
      <a-col :span="12">
        <AnalysisChannelVolume
          :data="data.channelVolume"
          :error="errors.channelVolume"
          :loading="loading"
          @retry="reload"
        />
      </a-col>
      <a-col :span="12">
        <AnalysisRefundTrend
          :data="data.refundTrend"
          :error="errors.refundTrend"
          :loading="loading"
          @retry="reload"
        />
      </a-col>

      <!-- 第五行：维度交易额排名明细 -->
      <a-col :span="24">
        <AnalysisDimRank :date-range="dateRange" />
      </a-col>
    </a-row>
  </div>
</template>
