import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'

/**
 * 获取基础配置
 */
export function getBasic() {
  return defHttp.get<Result<PlatformBasicConfig>>({ url: '/platform/config/basic/get' })
}

/**
 * 修改基础配置
 */
export function updateBasic(data: PlatformBasicConfig) {
  return defHttp.post<Result>({ url: '/platform/config/basic/update', data })
}

/**
 * 获取访问地址配置
 */
export function getUrls() {
  return defHttp.get<Result<PlatformUrlConfig>>({ url: '/platform/config/url/get' })
}
/**
 * 修改访问地址配置
 */
export function updateUrls(data: PlatformUrlConfig) {
  return defHttp.post<Result>({ url: '/platform/config/url/update', data })
}

/**
 * 获取站点显示内容配置
 */
export function getWebsite() {
  return defHttp.get<Result<PlatformWebsiteConfig>>({ url: '/platform/config/website/get' })
}

/**
 * 修改站点显示内容配置
 */
export function updateWebsite(data: PlatformWebsiteConfig) {
  return defHttp.post<Result>({ url: '/platform/config/website/update', data })
}

/**
 * 平台配置
 */
export interface PlatformBasicConfig {
  /** 全局单笔限额 */
  singleLimitAmount?: number
  /** 每月累计限额 */
  monthlyLimitAmount?: number
  /** 每日限额 */
  dailyLimitAmount?: number
}

/**
 * 平台提现规则配置
 */
export interface PlatformCashoutsConfig {
  /** 起始提现额度 */
  startAmount?: number
  /** 手续费计算公式 */
  feeFormula?: string
  /** 单笔固定 */
  fixedFee?: number
  /** 单笔费率 */
  fixedRate?: number
  /** 组合 固定手续费 */
  fixedFeeCombined?: number
  /** 组合 费率 */
  fixedRateCombined?: number
  /** 冻结金额 */
  freezeAmount?: number
}

/**
 * 平台访问地址配置
 */
export interface PlatformUrlConfig {
  /** 运营端网址 */
  adminWebUrl?: string
  /** 商户端网址 */
  mchWebUrl?: string
  /** 支付网关地址 */
  gatewayServiceUrl?: string
  /** 网关h5地址 */
  gatewayH5Url?: string
}

/**
 * 站点显示内容配置
 * @author xxm
 * @since 2025/6/29
 */
export interface PlatformWebsiteConfig {
  /** 系统名称 */
  systemName?: string
  /** 公司全称 */
  companyName?: string
  /** 公司电话 */
  companyPhone?: string
  /** 公司邮箱 */
  companyEmail?: string
  /** 系统完整logo */
  wholeLogo?: string
  /** 系统简化Logo */
  simpleLogo?: string
  /** 工信部ICP备案信息 */
  icpInfo?: string
  /** 工信部ICP链接地址 */
  icpLink?: string
  /** 公网安备案信息 */
  mpsInfo?: string
  /** 公网安备案链接地址 */
  mpsLink?: string
  /** 中国支付清算协会备案信息 */
  pcacInfo?: string
  /** 中国支付清算协会备案链接地址 */
  pcacLink?: string
  /** 电信增值业务许可信息 */
  icpPlusInfo?: string
  /** 电信增值业务许可链接地址 */
  icpPlusLink?: string
  /** 版权信息 */
  copyright?: string
  /** 版权信息链接 */
  copyrightLink?: string
}
