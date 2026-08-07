import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 抖音转账配置 API（商户端 /mch/douyin/transfer-config/*）
 *
 * 一对一绑定通道商户的「转账发起应用」（须为网站应用 web_app），
 * 决定转出主体与收款人 openId 来源。后端强制 mchNo=PaymentContext，前端不必传 mchNo。
 */
export const DouyinTransferConfigApi = {
  /** 查询通道商户的转账配置（一对一，未配置返回 null） */
  findByChannelMchNo(channelMchNo: string): Promise<Result<DouyinTransferConfig | null>> {
    return defHttp.get({
      url: '/mch/douyin/transfer-config/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
};

/** 抖音转账配置返回结果 */
export interface DouyinTransferConfig {
  id?: string;
  mchNo?: string;
  channelMchNo?: string;
  /** 转账发起应用引用（dy_mch_app 主键，须为网站应用 web_app） */
  transferAppRefId?: string;
  /** 发起应用名称（后端 Service 填充） */
  transferAppName?: string;
  /** 发起应用 AppId（真实抖音应用 AppId） */
  douyinAppId?: string;
  /** 发起应用类型（须为 web_app 网站应用） */
  appType?: string;
}
