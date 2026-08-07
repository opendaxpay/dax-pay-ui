import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信转账配置 API（一对一：转账场景 + 发起应用）
 */
export const WechatTransferConfigApi = {
  /** 查询通道商户的转账配置 */
  findByChannelMchNo(mchNo: string, channelMchNo: string): Promise<Result<WechatTransferConfig | null>> {
    return defHttp.get({
      url: '/admin/wechat/transfer-config/find-by-channel-mch-no',
      params: { mchNo, channelMchNo },
    });
  },
  /** 保存或更新转账配置（一对一 upsert） */
  save(data: WechatTransferConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/transfer-config/save', data });
  },
};

/** 微信转账配置保存参数 */
export interface WechatTransferConfigParam {
  mchNo: string;
  channelMchNo: string;
  /** 转账场景ID（微信 transfer_scene） */
  transferScene?: string;
  /** 转账发起应用引用（wx_mch_app 主键） */
  transferAppRefId?: string;
}

/** 微信转账配置返回结果 */
export interface WechatTransferConfig extends MchEntity {
  channelMchNo?: string;
  transferScene?: string;
  transferAppRefId?: string;
  /** 场景名称（枚举推导） */
  sceneName?: string;
  /** 发起应用名称 */
  transferAppName?: string;
  /** 发起应用 AppId */
  wxAppId?: string;
  /** 发起应用类型 */
  appType?: string;
}
