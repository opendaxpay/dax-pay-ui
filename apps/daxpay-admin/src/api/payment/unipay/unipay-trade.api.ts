/**
 * 统一支付(unipay)交易接口 — 商户侧契约
 *
 * 调试页通过此 API 模拟真实商户 HTTP 调用, 不走 admin 特权通道。
 */
import type { DaxResult } from './unipay-request';
import type { PayParam, PayResult } from '#/api/payment/develop/developTrade.api';

import { unipayPost } from './unipay-request';

/**
 * 统一支付下单
 *
 * POST /unipay/pay
 * 请求体须含完整商户签名字段(reqTime/nonceStr/sign 等)
 */
export function uniPay(data: PayParam): Promise<DaxResult<PayResult>> {
  return unipayPost<PayResult>('/unipay/pay', data);
}
