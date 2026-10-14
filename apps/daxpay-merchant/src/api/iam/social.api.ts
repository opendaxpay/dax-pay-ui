import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';
import { CLIENT_CODE } from '#/constants/client';

/**
 * 第三方社交登录 API
 */
export const SocialApi = {
  /**
   * 生成授权地址(前端拿到后跳转到第三方)
   * @param source 平台来源(wechat/qq/github 等)
   * @param client 终端编码(admin/merchant), 默认商户端
   * @param mode 授权场景: BIND(已登录绑定) | LOGIN(未登录登录), 不传按登录态判断
   * @param redirect 成功后前端跳转路径
   * @param silent 应用内静默/网页授权(企微 oauth / 微信 snsapi_base)
   */
  render(
    source: string,
    client: string = CLIENT_CODE,
    mode?: string,
    redirect?: string,
    silent?: boolean,
  ): Promise<Result<string>> {
    return defHttp.get({
      url: `/social/render/${source}`,
      params: { client, mode, redirect, silent: silent ? true : undefined },
    });
  },

  /**
   * 查询当前登录用户已绑定的第三方账号列表
   */
  bindList(): Promise<Result<SocialBindResult[]>> {
    return defHttp.get({ url: '/social/bind/list' });
  },

  /**
   * 解除当前登录用户的指定平台绑定
   */
  unbind(source: string): Promise<Result<void>> {
    return defHttp.post({ url: '/social/unbind', params: { source } });
  },

  /**
   * OAuth 授权码兑换 - 登录(公开)
   * 前端登录回调页收到第三方平台的 code+state 后调用
   */
  exchangeLogin(
    code: string,
    state: string,
    source: string,
    client: string = CLIENT_CODE,
  ): Promise<Result<SocialExchangeResult>> {
    return defHttp.post({ url: '/social/exchange-login', params: { code, state, source, client } });
  },

  /**
   * OAuth 授权码兑换 - 绑定(需登录)
   * 前端绑定回调页收到第三方平台的 code+state 后调用
   */
  exchangeBind(
    code: string,
    state: string,
    source: string,
    client: string = CLIENT_CODE,
  ): Promise<Result<SocialExchangeResult>> {
    return defHttp.post({ url: '/social/exchange-bind', params: { code, state, source, client } });
  },

  /**
   * 查询已启用的第三方登录平台(登录页公开接口)
   * 仅返回平台编码(source), 不含敏感字段
   */
  enabledList(): Promise<Result<SocialEnabledPlatform[]>> {
    return defHttp.get({ url: '/social/enabled-list' });
  },

  /**
   * 生成扫码绑定二维码(公众号等仅微信内可授权的平台, PC 端发起)
   * 返回含票据的 H5 页面地址, 前端转二维码供手机微信扫码完成绑定
   */
  bindScanCreate(source: string, client: string = CLIENT_CODE): Promise<Result<SocialBindScanQrResult>> {
    return defHttp.get({ url: '/social/bind-scan/create', params: { source, client } });
  },

  /**
   * 轮询扫码绑定结果(票据 5 分钟过期)
   */
  bindScanStatus(ticket: string): Promise<Result<SocialBindScanStatusResult>> {
    return defHttp.get({ url: '/social/bind-scan/status', params: { ticket } });
  },

  /**
   * 生成扫码登录二维码(公众号等仅微信内可授权的平台, PC 登录页匿名发起)
   */
  loginScanCreate(source: string, client: string = CLIENT_CODE): Promise<Result<SocialLoginScanQrResult>> {
    return defHttp.get({ url: '/social/login-scan/create', params: { source, client } });
  },

  /**
   * 轮询扫码登录结果(票据 5 分钟过期, success 一次性返回登录 token)
   */
  loginScanStatus(ticket: string): Promise<Result<SocialLoginScanStatusResult>> {
    return defHttp.get({ url: '/social/login-scan/status', params: { ticket } });
  },
};

/**
 * 第三方平台登录配置管理 API
 */
export const SocialLoginConfigApi = {
  /**
   * 全量查询平台配置(枚举驱动, 首次访问读时初始化缺失平台)
   * 未配置平台返回 configured=false 的占位记录(已落库, 含 id)
   */
  findAll(): Promise<Result<SocialLoginConfigResult[]>> {
    return defHttp.get({ url: '/social/login-config/find-all' });
  },

  /**
   * 查询应在第三方开放平台登记的回调地址清单(运营/商户 × 平台 × 登录/绑定)
   */
  callbackUrls(): Promise<Result<SocialCallbackUrlItem[]>> {
    return defHttp.get({ url: '/social/login-config/callback-urls' });
  },

  /**
   * 根据平台编码查询(不存在则初始化占位记录, 返回含 id 的记录)
   */
  findBySource(source: string): Promise<Result<SocialLoginConfigResult>> {
    return defHttp.get({ url: '/social/login-config/get-by-source', params: { source } });
  },

  /**
   * 修改平台配置(保存即标记为已配置)
   */
  update(data: SocialLoginConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/social/login-config/update', data });
  },

  /**
   * 切换平台启用状态(仅已配置平台可启停)
   */
  updateEnabled(source: string, enabled: boolean): Promise<Result<void>> {
    return defHttp.post({ url: '/social/login-config/update-enabled', params: { source, enabled } });
  },
};

/**
 * 社交账号绑定结果
 */
export interface SocialBindResult {
  /** 主键 */
  id?: string;
  /** 本地用户ID */
  userId?: string;
  /** 终端编码 */
  clientCode?: string;
  /** 平台编码 */
  source?: string;
  /** 平台用户唯一标识 */
  openId?: string;
  /** 平台昵称 */
  username?: string;
  /** 平台头像 */
  avatar?: string;
  /** 绑定时间 */
  createTime?: string;
}

/**
 * 应登记的 OAuth 回调地址项
 */
export interface SocialCallbackUrlItem {
  /** 终端 admin/merchant */
  clientCode: string;
  /** 平台编码 */
  source: string;
  /** LOGIN / BIND */
  mode: string;
  /** 完整回调 URL */
  url: string;
  /** 对应端 baseUrl 是否已配置 */
  baseUrlConfigured: boolean;
}

/**
 * 第三方平台登录配置
 */
export interface SocialLoginConfigResult {
  /** 主键 */
  id?: string;
  /** 平台编码 */
  source?: string;
  /** 客户端ID */
  clientId?: string;
  /** 客户端密钥(脱敏返回) */
  clientSecret?: string;
  /** 平台特有配置(如企业微信 agentId) */
  extra?: Record<string, string>;
  /** 是否已配置(内存合并缺失项为 false, 保存配置后为 true) */
  configured?: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 是否平台级跳转型配置(运行时由后端 SocialSourceEnum.isPlatformRedirect 计算, 不落库)
   *  true: 不在本表存 clientId/clientSecret, 使用独立平台级配置, 前端卡片渲染为跳转按钮
   *  false: 标准 OAuth2 平台, 在本表存 clientId/clientSecret */
  platformRedirect?: boolean;
}

/**
 * 第三方平台登录配置表单参数
 */
export interface SocialLoginConfigParam extends Partial<SocialLoginConfigResult> {}

/**
 * 社交登录授权码兑换结果
 */
export interface SocialExchangeResult {
  /** 登录 token(登录成功时返回) */
  token?: string;
  /** 操作结果(bind_success=绑定成功) */
  result?: string;
  /** 错误码(unbind=未绑定, state_invalid=state过期, oauth_failed=授权失败) */
  error?: string;
  /** 需二次验证时的临时凭证(业务码 40101 时返回) */
  preAuthToken?: string;
}

/**
 * 已启用的第三方登录平台(登录页公开返回, 仅含平台编码)
 */
export interface SocialEnabledPlatform {
  /** 平台编码(weChat/weCom/qq/github/gitee/feishu/dingTalk/douyin/alipay) */
  source: string;
  /** 是否仅微信客户端内可完成授权(公众号), PC 端发起绑定时须改走扫码流程 */
  scanBind?: boolean;
}

/**
 * 扫码绑定二维码(公众号跨设备绑定)
 */
export interface SocialBindScanQrResult {
  /** 扫码绑定票据(轮询绑定结果的凭证, 5 分钟过期) */
  ticket: string;
  /** 手机微信扫码打开的 H5 发起页地址(前端转二维码) */
  qrUrl: string;
}

/**
 * 扫码绑定状态(waiting=等待扫码授权 / success=绑定完成 / cancelled=手机端已取消 / not_exist=票据不存在或已过期)
 */
export interface SocialBindScanStatusResult {
  status: 'cancelled' | 'not_exist' | 'success' | 'waiting';
}

/**
 * 扫码登录二维码(公众号跨设备登录)
 */
export interface SocialLoginScanQrResult {
  /** 扫码登录票据(轮询登录结果的凭证, 5 分钟过期) */
  ticket: string;
  /** 手机微信扫码打开的 H5 发起页地址(前端转二维码) */
  qrUrl: string;
}

/**
 * 扫码登录状态(waiting=等待扫码授权 / not_bound=微信未绑定账号 / cancelled=手机端已取消 / success=登录完成 / not_exist=票据不存在或已过期)
 */
export interface SocialLoginScanStatusResult {
  status: 'cancelled' | 'not_bound' | 'not_exist' | 'success' | 'waiting';
  /** 登录 token(status=success 时返回) */
  token?: string;
  /** 需二次验证时的临时凭证(业务码 40101 时返回, 与 exchange-login 同协议) */
  preAuthToken?: string;
}
