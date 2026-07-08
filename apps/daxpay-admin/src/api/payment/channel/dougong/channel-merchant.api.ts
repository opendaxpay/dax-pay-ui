import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 斗拱(汇付天下)通道商户绑定 API
 */
export const DougongChannelMerchantApi = {
  /**
   * 根据通道商户号查询斗拱通道商户配置
   */
  findByChannelMchNo(
    channelMchNo: string,
  ): Promise<Result<DougongIsvChannelMerchant>> {
    return defHttp.get({
      url: '/admin/dougong/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 创建斗拱通道商户
   */
  create(data: DougongIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/dougong/isv-channel-merchant/create',
      data,
    });
  },
  /** 更新商户AppId */
  updateAppId(channelMchNo: string, appId: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/dougong/isv-channel-merchant/update-app-id',
      params: { channelMchNo, appId },
    });
  },
};

/** 斗拱通道商户绑定 */
export interface DougongIsvChannelMerchant {
  /** 主键 */
  id?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 汇付商户号(merchantNo/huifuId) */
  merchantNo?: string;
  /** 商户AppId(汇付SDK key) */
  appId?: string;
}

/** 斗拱通道商户创建参数 */
export interface DougongIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 汇付商户号 */
  merchantNo: string;
  /** 商户AppId */
  appId: string;
}
