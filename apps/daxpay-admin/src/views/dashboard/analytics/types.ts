/** 时间范围模式（预设快捷选项 + 自定义） */
export type PresetKey = 'today' | 'yesterday' | 'custom' | 'last7days' | 'last30days' | 'thisMonth';

/** 日期范围 [开始, 结束]，格式 YYYY-MM-DD */
export type DateRange = [string, string];

/** 趋势度量（交易趋势图 extra 区切换） */
export type TrendMetric = 'amount' | 'avgAmount' | 'orders';

/** 环比三态: 可算百分比 / 上期无基数本期有值(新增) / 无法展示 */
export type ChainRatioResult = { type: 'new' } | { type: 'pct'; value: number } | null;

/** 指标卡片单项 */
export interface OverviewStat {
  /** i18n key 后缀（对应 overview.{key}），如 totalAmount */
  key: string;
  /** 主数值 */
  value: number;
  /** 数值前缀（如 ¥） */
  prefix?: string;
  /** 数值后缀（如 %） */
  suffix?: string;
  /** 环比: pct=百分比 / new=上期无基数本期有值 / null=无意义 */
  chainRatio: ChainRatioResult;
}

/** 折线图序列数据（日期 + 多度量） */
export interface TrendSeries {
  dates: string[];
  amounts: number[];
  orders: number[];
  avgAmounts: number[];
}

/** 退款趋势（金额 + 笔数，笔数用于空态判断） */
export interface RefundTrendSeries {
  dates: string[];
  amounts: number[];
  /** 每日退款笔数；空态优先看笔数，避免小额被误判为空 */
  counts: number[];
}

/** 通用名称-数值对（饼图 / 柱状图） */
export interface NameValue {
  name: string;
  value: number;
}

/** 渠道成功率单项 */
export interface ChannelSuccessItem {
  name: string;
  /** 成功率百分比 */
  rate: number;
}

/** 金额区间分桶 */
export interface AmountRangeItem {
  /** 区间标签 */
  range: string;
  /** 笔数 */
  count: number;
}

/** 商户排名行 */
export interface MerchantRankItem {
  merchantName: string;
  amount: number;
  orders: number;
  /** 占比百分比 */
  proportion: number;
}

/** 分析页聚合数据（由 useAnalyticsData 按 timeRange 异步加载组装） */
export interface AnalyticsData {
  overview: OverviewStat[];
  tradeTrend: TrendSeries;
  payMethod: NameValue[];
  channelSuccess: ChannelSuccessItem[];
  hourlyDist: number[];
  amountRange: AmountRangeItem[];
  channelVolume: NameValue[];
  refundTrend: RefundTrendSeries;
  merchantRank: MerchantRankItem[];
}

/** 空数据(初次加载前的占位, 所有图表显示空状态) */
export function emptyAnalyticsData(): AnalyticsData {
  return {
    overview: [],
    tradeTrend: { amounts: [], avgAmounts: [], dates: [], orders: [] },
    payMethod: [],
    channelSuccess: [],
    hourlyDist: [],
    amountRange: [],
    channelVolume: [],
    refundTrend: { amounts: [], counts: [], dates: [] },
    merchantRank: [],
  };
}
