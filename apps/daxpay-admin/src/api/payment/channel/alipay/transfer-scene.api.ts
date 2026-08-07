import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝转账场景配置 API(2026 新商户转账必配, 主数据枚举驱动)
 */
export const AlipayTransferSceneApi = {
  /** 查询通道商户的转账场景配置行(仅已操作过的行, 前端按场景选项合并渲染) */
  list(mchNo: string, channelMchNo: string): Promise<Result<AlipayTransferSceneConfig[]>> {
    return defHttp.get({
      url: '/admin/alipay/transfer-scene/list',
      params: { mchNo, channelMchNo },
    });
  },
  /** 查询支付宝转账场景选项列表(主数据枚举投影, 含报备字段元数据) */
  findSceneOptions(): Promise<Result<AlipayTransferSceneOption[]>> {
    return defHttp.get({
      url: '/admin/alipay/transfer-scene/scene-options',
    });
  },
  /** 设为默认转账场景(自动启用, 按场景名称按需创建) */
  setDefault(mchNo: string, channelMchNo: string, sceneName: string): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/alipay/transfer-scene/set-default',
      params: { mchNo, channelMchNo, sceneName },
    });
  },
  /** 切换转账场景启用状态(最多启用3个, 按场景名称按需创建) */
  setEnabled(mchNo: string, channelMchNo: string, sceneName: string, enabled: boolean): Promise<Result<void>> {
    return defHttp.post({
      url: '/admin/alipay/transfer-scene/set-enabled',
      params: { mchNo, channelMchNo, sceneName, enabled },
    });
  },
};

/**
 * 支付宝转账场景选项(主数据枚举投影)
 */
export interface AlipayTransferSceneOption {
  /** 转账场景名称(支付宝协议固定中文取值) */
  sceneName?: string;
  /** 报备字段定义(支付宝协议固定中文 infoType) */
  reportInfoTypes?: string[];
  /** 报备字段说明(与 reportInfoTypes 平行) */
  reportInfoDescriptions?: string[];
}

/**
 * 支付宝转账场景配置(仅存已操作过的场景行)
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
