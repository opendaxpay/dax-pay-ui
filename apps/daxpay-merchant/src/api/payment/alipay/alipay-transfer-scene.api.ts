import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝转账场景配置 API（商户端 /mch/alipay/transfer-scene/*）
 *
 * 商户号由后端 PaymentContext 强制,前端不传 mchNo,防越权。
 */
export const AlipayTransferSceneApi = {
  /** 查询通道商户的转账场景列表 */
  list(channelMchNo: string): Promise<Result<AlipayTransferSceneConfig[]>> {
    return defHttp.get({
      url: '/mch/alipay/transfer-scene/list',
      params: { channelMchNo },
    });
  },
  /** 新增转账场景 */
  save(data: AlipayTransferSceneConfigParam): Promise<Result<string>> {
    return defHttp.post({ url: '/mch/alipay/transfer-scene/save', data });
  },
  /** 更新转账场景 */
  update(data: AlipayTransferSceneConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/alipay/transfer-scene/update', data });
  },
  /** 删除转账场景 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/alipay/transfer-scene/delete',
      params: { id },
    });
  },
  /** 设为默认转账场景 */
  setDefault(id: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/mch/alipay/transfer-scene/set-default',
      params: { id },
    });
  },
};

/**
 * 支付宝转账场景配置(一对多,按通道商户维度管理)
 */
export interface AlipayTransferSceneConfig extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 转账场景名称(8 枚举之一) */
  sceneName?: string;
  /** 是否默认场景 */
  isDefault?: boolean;
  /** 备注 */
  remark?: string;
}

/**
 * 转账场景保存参数(mchNo 由后端强制,前端不必传)
 */
export interface AlipayTransferSceneConfigParam {
  /** 主键(更新必填) */
  id?: string;
  /** 商户号(后端强制覆盖,前端可不传) */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo: string;
  /** 转账场景名称 */
  sceneName: string;
  /** 是否默认场景 */
  isDefault?: boolean;
  /** 备注 */
  remark?: string;
}

/**
 * 支付宝支持的 8 大转账场景(与支付宝文档枚举对齐)
 */
export const ALIPAY_TRANSFER_SCENES: Array<{ label: string; value: string }> = [
  { label: '现金营销', value: '现金营销' },
  { label: '企业退款', value: '企业退款' },
  { label: '佣金报酬', value: '佣金报酬' },
  { label: '业务结算', value: '业务结算' },
  { label: '二手回收', value: '二手回收' },
  { label: '公益补助', value: '公益补助' },
  { label: '行政补贴和退款', value: '行政补贴和退款' },
  { label: '保险理赔', value: '保险理赔' },
];
