import type { BaseEntity, LabelValue, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/** 支付能力系统常量 API（只读） */
export const PayCapabilityApi = {
  /** 分页查询 */
  page(params: PayCapabilityPageParam) {
    return defHttp.get<Result<PageResult<PayCapabilityResult>>>({
      url: '/admin/payment/pay-capability/page',
      params,
    });
  },
  /** 根据编码查询详情 */
  findByCode(code: string) {
    return defHttp.get<Result<PayCapabilityResult>>({
      url: '/admin/payment/pay-capability/get',
      params: { code },
    });
  },
};

/** 支付能力分页查询参数 */
export interface PayCapabilityPageParam {
  current?: number;
  size?: number;
  code?: string;
  name?: string;
}

/** 支付能力信息 */
export interface PayCapabilityResult extends BaseEntity {
  code?: string;
  name?: string;
  sortNo?: number;
  description?: string;
  products?: LabelValue[];
}
