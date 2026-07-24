import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付黑名单 API（运营端 /admin/pay/blacklist）
 */
export const PayBlacklistApi = {
  /** 分页查询 */
  page(
    params: PayBlacklistQuery & { current: number; size: number },
  ): Promise<Result<PageResult<PayBlacklistVo>>> {
    return defHttp.get({ url: '/admin/pay/blacklist/page', params });
  },

  /** 详情 */
  get(id: string): Promise<Result<PayBlacklistVo>> {
    return defHttp.get({ url: '/admin/pay/blacklist/get', params: { id } });
  },

  /** 新增 */
  add(data: PayBlacklistParam): Promise<Result<PayBlacklistVo>> {
    return defHttp.post({ url: '/admin/pay/blacklist/add', data });
  },

  /** 修改 */
  update(data: PayBlacklistParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/pay/blacklist/update', data });
  },

  /** 删除 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/pay/blacklist/delete', params: { id } });
  },
};

/** 查询参数 */
export interface PayBlacklistQuery {
  /** 类型 ip / alipay_user / wechat_openid */
  type?: string;
  /** 名单值 */
  value?: string;
  /** 状态 enable / disable */
  status?: string;
  /** 微信平台支付应用 AppId */
  wxAppId?: string;
}

/** 表单参数 */
export interface PayBlacklistParam {
  id?: string;
  /** ip / alipay_user / wechat_openid */
  type?: string;
  value?: string;
  wxAppId?: string;
  status?: string;
  reason?: string;
  expireTime?: string;
  remark?: string;
}

/** 列表/详情 VO */
export interface PayBlacklistVo extends BaseEntity {
  type?: string;
  value?: string;
  wxAppId?: string;
  status?: string;
  reason?: string;
  expireTime?: string;
  remark?: string;
}
