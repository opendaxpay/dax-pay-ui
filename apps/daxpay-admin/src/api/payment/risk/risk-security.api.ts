import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付安全配置 API（接口防重放 + 风控开关）
 */
export const RiskSecurityApi = {
  /**
   * 获取API安全配置
   */
  getApiSecurityConfig(): Promise<Result<ApiSecurityConfig>> {
    return defHttp.get({ url: '/payment/risk/security/api-security/get' });
  },
  /**
   * 更新API安全配置
   */
  updateApiSecurityConfig(data: ApiSecurityConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/payment/risk/security/api-security/update', data });
  },
  /**
   * 获取风控策略配置
   */
  getPaySecurityConfig(): Promise<Result<PaySecurityConfig>> {
    return defHttp.get({ url: '/payment/risk/security/pay-security/get' });
  },
  /**
   * 更新风控策略配置
   */
  updatePaySecurityConfig(data: PaySecurityConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/payment/risk/security/pay-security/update', data });
  },
};

/**
 * API安全配置（开放支付接口防重放）
 */
export interface ApiSecurityConfig {
  /** 是否启用 Nonce 防重放校验 */
  nonceVerifyEnabled?: boolean;
  /** 是否启用请求时间窗口校验 */
  reqTimeoutEnabled?: boolean;
  /** 请求时间窗口容差（秒） */
  reqTimeoutSeconds?: number;
  /** Nonce 有效期（秒） */
  nonceTtlSeconds?: number;
}

/**
 * 支付风控配置（风控开关）
 */
export interface PaySecurityConfig {
  /** 风控总开关（关闭后所有风控检查跳过） */
  riskEnabled?: boolean;
  /** 黑名单拦截开关（IP / 用户标识） */
  blacklistEnabled?: boolean;
  /** 命中黑名单后是否阻断下单（false=仅记录不拦截） */
  riskBlockBeforePay?: boolean;
  /** 支付成功后是否补录命中（用于事后分析） */
  riskCheckAfterPay?: boolean;
  /** 用户标识拦截级别（normal=正常拦截 / enhanced=增强拦截） */
  riskOpenIdLevel?: string;
  /** 海外 IP 拦截（默认关闭, 拦截境外 IP 支付请求） */
  blockOverseasIp?: boolean;
  /** 省级地区拦截（默认关闭, 开启后根据 IP 归属省份匹配省级黑名单） */
  provinceBlacklistEnabled?: boolean;
  /** 市级地区拦截（默认关闭, 开启后根据 IP 归属城市匹配市级黑名单; 与省级开关独立, 省命中后不执行） */
  cityBlacklistEnabled?: boolean;
  /** 地理围栏全局开关（默认关闭, 开启后各商户围栏 opt-in 才生效） */
  geoFenceEnabled?: boolean;
  /** 地理围栏全局策略（strict 严格 / balanced 平衡 / loose 宽松） */
  geoFenceStrategy?: string;
}
