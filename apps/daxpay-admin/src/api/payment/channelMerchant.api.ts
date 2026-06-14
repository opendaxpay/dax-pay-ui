import type { BaseEntity, MchEntity, PageResult, Result } from '#/types/web';

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
  /** 来源 */
  source?: string;
  /** 是否启用 */
  enable?: boolean;
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
 * 微信通道商户创建 API
 */
export const ChannelMerchantWechatApi = {
  /**
   * 创建微信通道商户
   */
  create(data: Record<string, any>): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/channel-merchant/create', data });
  },
  /**
   * 根据通道商户号查询微信通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<WechatChannelMerchantConfig>> {
    return defHttp.get({
      url: '/admin/wechat/channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
};

/**
 * 拉卡拉通道商户创建 API
 */
export const ChannelMerchantLakalaApi = {
  /**
   * 创建拉卡拉通道商户
   */
  create(data: Record<string, any>): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/lakala/channel-merchant/create', data });
  },
};

/**
 * 银联商务通道商户创建 API
 */
export const ChannelMerchantUmsApi = {
  /**
   * 创建银联商务通道商户
   */
  create(data: Record<string, any>): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/ums/channel-merchant/create', data });
  },
};

/**
 * 抖音通道商户创建 API
 */
export const ChannelMerchantDouyinApi = {
  /**
   * 创建抖音通道商户
   */
  create(data: Record<string, any>): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/channel-merchant/create', data });
  },
};

/** 微信通道商户配置 */
export interface WechatChannelMerchantConfig extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 微信特约商户号/二级商户号 */
  subMchId?: string;
}
