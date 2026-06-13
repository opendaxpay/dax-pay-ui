import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/** 支付产品系统常量 API（只读） */
export const PayProductApi = {
  /** 分页查询 */
  page(params: PayProductPageParam): Promise<Result<PageResult<PayProductResult>>> {
    return defHttp.get({ url: '/admin/product/page', params });
  },
  /** 根据编码查询详情 */
  findByCode(code: string): Promise<Result<PayProductResult>> {
    return defHttp.get({ url: '/admin/product/get', params: { code } });
  },
  /** 启用产品下拉列表 */
  dropdown(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/admin/product/dropdown' });
  },
  /** 全量查询支付产品（卡片式管理页使用） */
  listAll(): Promise<Result<PayProductResult[]>> {
    return defHttp.get({ url: '/admin/product/list-all' });
  },
};

/** 标签值 */
export interface LabelValue {
  label?: string;
  value?: string;
}

/** 支付产品分页查询参数 */
export interface PayProductPageParam {
  current?: number;
  size?: number;
  code?: string;
  name?: string;
  channel?: string;
}

/** 支付产品已挂载能力项 */
export interface PayProductCapabilityItem {
  code?: string;
  name?: string;
  sortNo?: number;
}

/** 支付产品信息 */
export interface PayProductResult extends BaseEntity {
  code?: string;
  name?: string;
  channel?: string;
  channelName?: string;
  description?: string;
  icon?: string;
  settlePeriods?: string[];
  sortNo?: number;
  remark?: string;
  isv?: boolean;
  allocatable?: boolean;
  terminal?: boolean;
  apply?: boolean;
  sandbox?: boolean;
  apiCallMode?: string;
  payIdType?: string;
  capabilities?: PayProductCapabilityItem[];
}
