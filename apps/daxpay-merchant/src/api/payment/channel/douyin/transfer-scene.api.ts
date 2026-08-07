import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 抖音转账场景配置 API（商户端 /mch/douyin/transfer-scene/*）
 *
 * 后端强制 mchNo=PaymentContext，前端不必/不应传跨商户 mchNo。
 */
export const DouyinTransferSceneApi = {
  /**
   * 查询通道商户的转账场景列表
   */
  list(channelMchNo: string): Promise<Result<DouyinTransferSceneConfig[]>> {
    return defHttp.get({
      url: '/mch/douyin/transfer-scene/list',
      params: { channelMchNo },
    });
  },
  /**
   * 新增转账场景
   */
  save(data: DouyinTransferSceneConfigParam): Promise<Result<string>> {
    return defHttp.post({ url: '/mch/douyin/transfer-scene/save', data });
  },
  /**
   * 更新转账场景
   */
  update(data: DouyinTransferSceneConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/douyin/transfer-scene/update', data });
  },
  /**
   * 删除转账场景
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/douyin/transfer-scene/delete', params: { id } });
  },
  /**
   * 设为默认转账场景
   */
  setDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/douyin/transfer-scene/set-default', params: { id } });
  },
};

/**
 * 抖音转账场景配置（与后端 DouyinTransferSceneEnum 一致）
 */
export const DOUYIN_TRANSFER_SCENES: DouyinTransferSceneOption[] = [
  { code: '1001', name: '现金营销' },
  { code: '1002', name: '企业赔付' },
  { code: '1003', name: '佣金报酬' },
  { code: '1004', name: '采购货款' },
  { code: '1005', name: '二手回收' },
  { code: '1006', name: '公益补助' },
  { code: '1007', name: '行政补贴' },
];

/**
 * 抖音转账场景配置结果
 */
export interface DouyinTransferSceneConfig extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 转账场景ID */
  sceneId?: string;
  /** 转账场景名称(枚举推导) */
  sceneName?: string;
  /** 是否默认场景 */
  isDefault?: boolean;
  /** 备注 */
  remark?: string;
}

/**
 * 抖音转账场景配置保存参数
 */
export interface DouyinTransferSceneConfigParam {
  /** 主键(更新必填) */
  id?: string;
  /** 通道商户号 */
  channelMchNo: string;
  /** 转账场景ID */
  sceneId: string;
  /** 是否默认场景 */
  isDefault?: boolean;
  /** 备注 */
  remark?: string;
}

/**
 * 场景枚举选项
 */
export interface DouyinTransferSceneOption {
  /** 场景ID */
  code: string;
  /** 场景名称 */
  name: string;
}
