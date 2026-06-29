import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝直连商户应用支付能力关联 API
 */
export const AlipayMchAppCapabilityApi = {
  /** 查询通道商户的能力应用关联列表 */
  listByChannelMchNo(mchNo: string, channelMchNo: string): Promise<Result<AlipayMchAppCapability[]>> {
    return defHttp.get({
      url: '/admin/alipay/mch-app/capability/list-by-channel-mch-no',
      params: { mchNo, channelMchNo },
    });
  },
  /** 全量保存能力应用关联 */
  saveBatch(data: AlipayMchAppCapabilityBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/mch-app/capability/save-batch', data });
  },
  /** 查询支付宝直连支持的支付能力候选 */
  listSupportedCapabilities(): Promise<Result<AlipayDirectCapabilityOption[]>> {
    return defHttp.get({ url: '/admin/alipay/mch-app/capability/list-supported-capabilities' });
  },
};

/** 支付宝直连商户应用支付能力关联 */
export interface AlipayMchAppCapability extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 支付能力编码 */
  capability?: string;
  /** 关联支付宝直连应用ID */
  alipayDirectAppId?: string;
  /** 应用名称(冗余展示) */
  appName?: string;
  /** 支付宝应用ID(冗余展示) */
  aliAppId?: string;
  /** 应用类型(冗余展示): mini_program/mobile_app/web_app */
  appType?: string;
}

/** 支付能力关联应用单项 */
export interface AlipayMchAppCapabilityItem {
  /** 支付能力编码 */
  capability: string;
  /** 关联支付宝直连应用ID */
  alipayDirectAppId: string;
}

/** 支付能力关联应用批量保存参数 */
export interface AlipayMchAppCapabilityBatchParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户号 */
  channelMchNo: string;
  /** 支付能力关联应用列表 */
  items: AlipayMchAppCapabilityItem[];
}

/** 支付能力候选项 */
export interface AlipayDirectCapabilityOption {
  /** 支付能力编码 */
  code: string;
  /** 国际化名称 */
  name: string;
}
