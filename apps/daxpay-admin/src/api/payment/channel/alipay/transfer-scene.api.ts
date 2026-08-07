import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝转账场景配置 API(2026 新商户转账必配)
 */
export const AlipayTransferSceneApi = {
  /** 查询通道商户的转账场景列表(预置行由 SQL 初始化) */
  list(mchNo: string, channelMchNo: string): Promise<Result<AlipayTransferSceneConfig[]>> {
    return defHttp.get({
      url: '/admin/alipay/transfer-scene/list',
      params: { mchNo, channelMchNo },
    });
  },
  /** 设为默认转账场景(自动启用) */
  setDefault(mchNo: string, id: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/alipay/transfer-scene/set-default',
      params: { mchNo, id },
    });
  },
  /** 切换转账场景启用状态(最多启用3个) */
  setEnabled(mchNo: string, id: string, enabled: boolean): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/alipay/transfer-scene/set-enabled',
      params: { mchNo, id, enabled },
    });
  },
};

/**
 * 支付宝转账场景配置(预置8行,按通道商户维度管理,最多启用3个)
 */
export interface AlipayTransferSceneConfig extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 转账场景名称(8 枚举之一) */
  sceneName?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 是否默认场景(默认必须启用) */
  isDefault?: boolean;
  /** 报备字段定义(后端枚举推导,供前端动态渲染) */
  reportInfoTypes?: string[];
  /** 报备字段说明(与 reportInfoTypes 平行) */
  reportInfoDescriptions?: string[];
}
