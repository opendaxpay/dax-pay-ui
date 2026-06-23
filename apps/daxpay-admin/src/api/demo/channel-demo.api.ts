import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 通道连通性演示 API
 */
export const ChannelDemoApi = {
  /**
   * 发起通道 Demo 支付（主应用 → 子应用 → 返回）
   */
  pay(data: ChannelDemoPayParam): Promise<Result<ChannelDemoPayResult>> {
    return defHttp.post({ url: '/demo/channel/pay', data });
  },
};

/**
 * 支付方式选项
 */
export interface ChannelDemoMethodOption {
  /** 选项值 */
  value: string;
  /** 选项标签 */
  label: string;
}

/**
 * Demo 支付请求参数
 */
export interface ChannelDemoPayParam {
  /** 商户订单号 */
  bizOrderNo: string;
  /** 支付金额（元） */
  amount: number;
  /** 支付标题 */
  subject: string;
  /** 支付方式 */
  method: string;
}

/**
 * Demo 支付返回结果
 */
export interface ChannelDemoPayResult {
  /** 商户订单号 */
  bizOrderNo: string;
  /** 通道侧订单号 */
  outOrderNo: string;
  /** 支付内容 */
  payBody: string;
  /** 支付内容类型 */
  payBodyType: string;
  /** 主应用 traceId */
  mainAppTraceId: string;
  /** 子应用 traceId */
  subAppTraceId: string;
}
