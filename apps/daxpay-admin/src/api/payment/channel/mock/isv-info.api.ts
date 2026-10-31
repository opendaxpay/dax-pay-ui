import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Mock 模拟通道服务商 API(服务商管理页 / 建档下拉 / 详情工作台共用)
 */
export const MockIsvInfoApi = {
  /**
   * 服务商下拉选项(返回全部行含停用, 停用项由前端标注「（已停用）」)
   */
  dropdown(): Promise<Result<MockIsvInfoOption[]>> {
    return defHttp.get({ url: '/admin/mock/isv-info/dropdown' });
  },

  /**
   * 全量服务商列表(模拟服务商管理页, 含名下通道商户数统计)
   */
  list(): Promise<Result<MockIsvInfoResult[]>> {
    return defHttp.get({ url: '/admin/mock/isv-info/list' });
  },

  /**
   * 按主键查询服务商详情
   */
  find(id: string): Promise<Result<MockIsvInfoResult>> {
    return defHttp.get({ url: '/admin/mock/isv-info/find', params: { id } });
  },

  /**
   * 新建服务商(启用/启停支付不传时由后端补 true)
   */
  create(data: MockIsvInfoCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mock/isv-info/create', data });
  },

  /**
   * 编辑服务商(编辑与启停合一, 空字段不覆盖)
   */
  update(data: MockIsvInfoUpdateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mock/isv-info/update', data });
  },

  /**
   * 删除服务商(名下仍有通道商户时后端拒绝)
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mock/isv-info/delete', params: { id } });
  },
};

/**
 * Mock 服务商下拉选项(全量行, 含停用)
 */
export interface MockIsvInfoOption {
  /** 主键(后端 Long 按字符串序列化) */
  id: string;
  /** 服务商编号(系统生成) */
  isvNo: string;
  /** 服务商名称 */
  isvName: string;
  /** 是否允许新建服务商通道商户(停用项不可用于新建通道商户) */
  enable: boolean;
  /** 是否启用服务商支付 */
  payEnable: boolean;
}

/**
 * Mock 服务商列表行(模拟服务商管理页, 含通道商户数统计)
 */
export interface MockIsvInfoResult extends BaseEntity {
  /** 服务商编号(系统生成) */
  isvNo?: string;
  /** 服务商名称 */
  isvName?: string;
  /** 是否允许新建服务商通道商户 */
  enable?: boolean;
  /** 是否启用服务商支付 */
  payEnable?: boolean;
  /** 名下服务商通道商户数(mock_isv 产品; 后端 Long 按字符串序列化) */
  channelMerchantCount?: number | string;
  /** 服务商级签名密钥是否已配置(未配置时回落通道级全局密钥) */
  credentialConfigured?: boolean;
}

/**
 * Mock 服务商新建参数
 */
export interface MockIsvInfoCreateParam {
  /** 服务商名称 */
  isvName: string;
  /** 是否允许新建服务商通道商户(默认 true) */
  enable?: boolean;
  /** 是否启用服务商支付(默认 true) */
  payEnable?: boolean;
}

/**
 * Mock 服务商编辑参数(编辑与启停合一)
 */
export interface MockIsvInfoUpdateParam {
  /** 主键 */
  id: string;
  /** 服务商名称 */
  isvName: string;
  /** 是否允许新建服务商通道商户 */
  enable: boolean;
  /** 是否启用服务商支付 */
  payEnable: boolean;
}
