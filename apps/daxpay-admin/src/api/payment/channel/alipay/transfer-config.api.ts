import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付宝转账配置 API（运营端 /admin/alipay/transfer-config/*）
 *
 * 一对一绑定通道商户的「转账转出应用」，发起转账时按配置解析应用的 aliAppId 与密钥。
 */
export const AlipayTransferConfigApi = {
  /** 查询通道商户的转账配置（一对一，未配置返回 null） */
  findByChannelMchNo(mchNo: string, channelMchNo: string): Promise<Result<AlipayTransferConfig | null>> {
    return defHttp.get({
      url: '/admin/alipay/transfer-config/find-by-channel-mch-no',
      params: { mchNo, channelMchNo },
    });
  },
  /** 保存或更新转账配置（一对一 upsert） */
  save(data: AlipayTransferConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/alipay/transfer-config/save', data });
  },
};

/** 支付宝转账配置保存参数 */
export interface AlipayTransferConfigParam {
  mchNo: string;
  channelMchNo: string;
  /** 转账转出应用引用（alipay_direct_app 主键） */
  transferAppRefId: string;
}

/** 支付宝转账配置返回结果 */
export interface AlipayTransferConfig extends MchEntity {
  channelMchNo?: string;
  transferAppRefId?: string;
  /** 转出应用名称（后端 Service 填充） */
  transferAppName?: string;
  /** 转出应用支付宝 AppId */
  aliAppId?: string;
  /** 转出应用类型 */
  appType?: string;
}
