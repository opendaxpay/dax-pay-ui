import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 抖音转账配置 API（一对一：转账发起应用）
 */
export const DouyinTransferConfigApi = {
  /** 查询通道商户的转账配置 */
  findByChannelMchNo(mchNo: string, channelMchNo: string): Promise<Result<DouyinTransferConfig | null>> {
    return defHttp.get({
      url: '/admin/douyin/transfer-config/find-by-channel-mch-no',
      params: { mchNo, channelMchNo },
    });
  },
  /** 保存或更新转账配置（一对一 upsert） */
  save(data: DouyinTransferConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/transfer-config/save', data });
  },
};

/** 抖音转账配置保存参数 */
export interface DouyinTransferConfigParam {
  mchNo: string;
  channelMchNo: string;
  /** 转账发起应用引用（dy_mch_app 主键，须为网站应用 web_app） */
  transferAppRefId?: string;
}

/** 抖音转账配置返回结果 */
export interface DouyinTransferConfig extends MchEntity {
  channelMchNo?: string;
  transferAppRefId?: string;
  /** 发起应用名称 */
  transferAppName?: string;
  /** 发起应用 AppId（真实抖音应用 AppId） */
  douyinAppId?: string;
  /** 发起应用类型（须为 web_app 网站应用） */
  appType?: string;
}
