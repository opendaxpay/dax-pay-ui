import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 工作台/分析页交易聚合统计 API
 *
 * 对接后端 /admin/dashboard/trade/* 聚合接口, 供 workspace widget 与 analytics 9 维度图表使用。
 *
 * ## 参数约定
 * - **天数模式**: `days` 参数(近 N 天含今天)
 * - **区间模式**: `start` + `end` 参数(yyyy-MM-dd, 均包含), 同时传时优先区间模式
 *
 * 金额字段单位为分, 前端按需转元展示。
 */
export const DashboardTradeApi = {
  /**
   * 工作台头部计数(商户/通道商户/运营用户总量)
   */
  headerCounts(): Promise<Result<AdminHeaderCountResult>> {
    return defHttp.get({ url: '/admin/dashboard/trade/header-counts' });
  },

  /**
   * 交易概览(今日/昨日快捷 或 自定义区间含上期对比)
   * @param date 'today' | 'yesterday' 快捷模式, 仅在未传 start/end 时生效
   * @param start yyyy-MM-dd(包含), 与 end 同时传时进入区间模式
   * @param end   yyyy-MM-dd(包含)
   */
  overview(params: {
    date?: 'today' | 'yesterday';
    end?: string;
    start?: string;
  }): Promise<Result<TradeOverviewResult>> {
    return defHttp.get({ url: '/admin/dashboard/trade/overview', params });
  },

  /**
   * 交易趋势(每日成交金额 + 笔数)
   */
  trend(params: { days?: number; end?: string; start?: string }): Promise<Result<TradeTrendItemResult[]>> {
    return defHttp.get({ url: '/admin/dashboard/trade/trend', params });
  },

  /**
   * 退款趋势(每日退款金额 + 笔数)
   */
  refundTrend(params: { days?: number; end?: string; start?: string }): Promise<Result<RefundTrendItemResult[]>> {
    return defHttp.get({ url: '/admin/dashboard/trade/refund-trend', params });
  },

  /**
   * 支付渠道分布(各渠道成交金额 + 笔数)
   */
  providerDist(params: { days?: number; end?: string; start?: string }): Promise<Result<ProviderDistItemResult[]>> {
    return defHttp.get({ url: '/admin/dashboard/trade/provider-dist', params });
  },

  /**
   * 支付渠道成功率(各渠道 success_count / total_count * 100)
   */
  providerSuccess(params: { days?: number; end?: string; start?: string }): Promise<Result<ProviderSuccessItemResult[]>> {
    return defHttp.get({ url: '/admin/dashboard/trade/provider-success', params });
  },

  /**
   * 时段分布(日均): 各小时成交金额 + 笔数已按区间天数日均化, 补齐 0-23
   */
  hourlyDist(params: { days?: number; end?: string; start?: string }): Promise<Result<HourlyDistItemResult[]>> {
    return defHttp.get({ url: '/admin/dashboard/trade/hourly-dist', params });
  },

  /**
   * 金额区间分桶(5 档: 0-50/50-200/200-1000/1000-5000/5000+, 已补齐)
   */
  amountRange(params: { days?: number; end?: string; start?: string }): Promise<Result<AmountRangeItemResult[]>> {
    return defHttp.get({ url: '/admin/dashboard/trade/amount-range', params });
  },

  /**
   * 商户交易额排名
   * @param limit 返回前 N 名(默认 10, 上限 50)
   */
  merchantRank(params: { days?: number; end?: string; limit?: number; start?: string }): Promise<Result<MerchantRankItemResult[]>> {
    return defHttp.get({ url: '/admin/dashboard/trade/merchant-rank', params });
  },
};

/** 交易概览结果(金额单位: 分; Long 字段可能为 number 或 JSON 字符串) */
export interface TradeOverviewResult {
  // ===== 本期 =====
  /** 成交金额(分) */
  successAmount?: number | string;
  /** 成交笔数 */
  successCount?: number | string;
  /** 退款金额(分) */
  refundAmount?: number | string;
  /** 退款笔数 */
  refundCount?: number | string;
  /** 总下单笔数(含成功/失败/关闭, 用于成功率分母, 按 create_time 口径) */
  totalOrders?: number | string;
  // ===== 上期(用于环比, undefined 表示上期无数据) =====
  prevSuccessAmount?: number | string;
  prevSuccessCount?: number | string;
  prevRefundAmount?: number | string;
  prevRefundCount?: number | string;
  prevTotalOrders?: number | string;
}

/** 交易趋势单项(日期 + 金额 + 笔数) */
export interface TradeTrendItemResult {
  /** 日期(yyyy-MM-dd) */
  date?: string;
  /** 成交金额(分) */
  amount?: number | string;
  /** 成交笔数 */
  count?: number | string;
}

/** 退款趋势单项 */
export interface RefundTrendItemResult {
  date?: string;
  amount?: number | string;
  count?: number | string;
}

/** 支付渠道分布单项 */
export interface ProviderDistItemResult {
  /** 支付渠道编码(如 wechat/alipay/union_pay) */
  provider?: string;
  /** 成交金额(分) */
  amount?: number | string;
  /** 成交笔数 */
  count?: number | string;
}

/** 支付渠道成功率单项 */
export interface ProviderSuccessItemResult {
  /** 支付渠道编码 */
  provider?: string;
  /** 成功率(0-100) */
  rate?: number;
}

/** 时段分布单项(日均: 区间汇总 ÷ 天数) */
export interface HourlyDistItemResult {
  /** 小时(0-23) */
  hour?: number;
  /** 日均成交金额(分) */
  amount?: number | string;
  /** 日均成交笔数 */
  count?: number | string;
}

/** 金额区间分桶单项 */
export interface AmountRangeItemResult {
  /** 区间标签(如 '0-50', '5000+') */
  bucket?: string;
  /** 笔数 */
  count?: number | string;
}

/** 商户交易额排名单项 */
export interface MerchantRankItemResult {
  /** 商户号 */
  mchNo?: string;
  /** 商户名称 */
  merchantName?: string;
  /** 成交金额(分) */
  amount?: number | string;
  /** 成交笔数 */
  orders?: number | string;
  /** 占比百分比(0-100) */
  proportion?: number;
}

/** 运营工作台头部计数结果 */
export interface AdminHeaderCountResult {
  /** 商户总数 */
  merchantCount?: number | string;
  /** 通道商户总数 */
  channelMerchantCount?: number | string;
  /** 运营端用户数(不含超管) */
  userCount?: number | string;
}
