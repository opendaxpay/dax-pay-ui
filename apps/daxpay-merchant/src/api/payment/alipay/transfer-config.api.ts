import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝转账配置 API（商户端 /mch/alipay/transfer-config/*）
 *
 * 一对一绑定通道商户的「转账转出应用」，发起转账时按配置解析应用的 aliAppId 与密钥。
 * 后端强制 mchNo=PaymentContext，前端不必/不应传跨商户 mchNo。
 */
export const AlipayTransferConfigApi = {
  /** 查询通道商户的转账配置（一对一，未配置返回 null） */
  findByChannelMchNo(channelMchNo: string): Promise<Result<AlipayTransferConfig | null>> {
    return defHttp.get({
      url: '/mch/alipay/transfer-config/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /** 保存或更新转账配置（一对一 upsert） */
  save(data: AlipayTransferConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/alipay/transfer-config/save', data });
  },
};

/** 支付宝转账配置保存参数 */
export interface AlipayTransferConfigParam {
  channelMchNo: string;
  /** 转账转出应用引用（alipay_direct_app 主键） */
  transferAppRefId: string;
}

/** 支付宝转账配置返回结果 */
export interface AlipayTransferConfig {
  id?: string;
  mchNo?: string;
  channelMchNo?: string;
  transferAppRefId?: string;
  /** 转出应用名称（后端 Service 填充） */
  transferAppName?: string;
  /** 转出应用支付宝 AppId */
  aliAppId?: string;
  /** 转出应用类型 */
  appType?: string;
}
