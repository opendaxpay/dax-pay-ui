import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 通道商户 API
 */
export const ChannelMerchantApi = {
  /**
   * 分页查询
   */
  page(params: ChannelMerchantQueryParam): Promise<Result<PageResult<ChannelMerchantResult>>> {
    return defHttp.get({ url: '/admin/merchant/channel-merchant/page', params });
  },
  /**
   * 根据商户号查询所有通道商户
   */
  findAllByMchNo(mchNo: string): Promise<Result<ChannelMerchantResult[]>> {
    return defHttp.get({ url: '/admin/merchant/channel-merchant/all-by-mch-no', params: { mchNo } });
  },
  /**
   * 查询详情
   */
  findById(id: string): Promise<Result<ChannelMerchantResult>> {
    return defHttp.get({ url: '/admin/merchant/channel-merchant/get', params: { id } });
  },
  /**
   * 更新启用状态
   */
  updateEnable(id: string, enable: boolean): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/channel-merchant/update-enable', params: { id, enable } });
  },
  /**
   * 修改商户名称
   */
  update(data: ChannelMerchantEditParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/channel-merchant/update', data });
  },
  /**
   * 删除通道商户
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/channel-merchant/delete', params: { id } });
  },
  /**
   * 引用明细查询（按应用分组，停用影响面提示用）
   */
  referenceDetail(channelMchNo: string): Promise<Result<ChannelMerchantReferenceResult>> {
    return defHttp.get({ url: '/admin/merchant/channel-merchant/reference-detail', params: { channelMchNo } });
  },
};

/**
 * 通道商户结果
 */
export interface ChannelMerchantResult extends BaseEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 商户名称 */
  channelMerchantName?: string;
  /** 所属支付产品 */
  product?: string;
  /** 商户类型 */
  channelMerchantType?: string;
  /** 所属通道 */
  channel?: string;
  /** 是否启用 */
  enable?: boolean;
  /** 是否支持沙箱环境 */
  sandboxSupport?: boolean;
  /** 是否为沙箱环境通道商户(创建时按当时产品 activeEnv 固化写入, 之后不随产品切换改变) */
  sandbox?: boolean;
  /** 通道商户创建来源 */
  source?: string;
  /** 备注 */
  remark?: string;
  /** 交易标识（前端不展示） */
  tradeIdentity?: string;
  /** 商户号 */
  mchNo?: string;
  /** 商户名称 */
  mchName?: string;
}

/**
 * 通道商户编辑参数
 */
export interface ChannelMerchantEditParam {
  /** 主键 */
  id: string;
  /** 商户名称 */
  channelMerchantName: string;
  /** 商户类型 */
  channelMerchantType?: string;
  /** 备注 */
  remark?: string;
  /** 交易标识（保持原值透传） */
  tradeIdentity?: string;
}

/**
 * 通道商户查询参数
 */
export interface ChannelMerchantQueryParam {
  /** 当前页 */
  current?: number;
  /** 每页大小 */
  size?: number;
  /** 商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMerchantNo?: string;
  /** 通道商户名称 */
  channelMerchantName?: string;
  /** 所属通道 */
  channel?: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}

/**
 * 通道商户基础创建参数
 */
export interface ChannelMerchantBaseCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 所属通道 */
  channel: string;
}

/**
 * 通道商户引用明细（单条）
 */
export interface ChannelMerchantReferenceItemResult {
  /** 引用类型(route_scene/route_basic/gateway_env/cashier_item) */
  type?: string;
  /** 引用类型中文名 */
  typeName?: string;
  /** 引用内容人读摘要 */
  detail?: string;
}

/**
 * 通道商户引用明细·按应用分组
 */
export interface ChannelMerchantReferenceAppResult {
  /** 应用号 */
  appId?: string;
  /** 应用名称 */
  appName?: string;
  /** 商户号 */
  mchNo?: string;
  /** 该应用下的引用明细列表 */
  refs?: ChannelMerchantReferenceItemResult[];
}

/**
 * 通道商户引用明细
 */
export interface ChannelMerchantReferenceResult {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 总引用处数 */
  total?: number;
  /** 按应用分组的引用明细 */
  apps?: ChannelMerchantReferenceAppResult[];
}
