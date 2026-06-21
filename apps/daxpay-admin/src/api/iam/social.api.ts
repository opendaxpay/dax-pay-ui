import { defHttp } from '#/api/request';
import type { Result } from '#/types/web';

/**
 * 第三方社交登录 API
 */
export const SocialApi = {
  /**
   * 生成授权地址(前端拿到后跳转到第三方)
   * @param source 平台来源(wechat/qq/github 等)
   * @param mode 授权场景: BIND(已登录绑定) | LOGIN(未登录登录), 不传按登录态判断
   * @param redirect 成功后前端跳转路径
   */
  render(source: string, mode?: string, redirect?: string): Promise<Result<string>> {
    return defHttp.get({
      url: `/social/render/${source}`,
      params: { client: 'admin', mode, redirect },
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
   * OAuth 授权码兑换(前端回调模式)
   * 前端回调页收到第三方平台的 code+state 后调用, 后端换 token 并返回结果
   */
  exchange(code: string, state: string): Promise<Result<SocialExchangeResult>> {
    return defHttp.post({ url: '/social/exchange', params: { code, state } });
  },

  /**
   * 查询已启用的第三方登录平台(登录页公开接口)
   * 仅返回平台编码(source), 不含敏感字段
   */
  enabledList(): Promise<Result<SocialEnabledPlatform[]>> {
    return defHttp.get({ url: '/social/enabled-list' });
  },
};

/**
 * 第三方平台登录配置管理 API
 */
export const SocialConfigApi = {
  /**
   * 全量查询平台配置(枚举驱动, 首次访问读时初始化缺失平台)
   * 未配置平台返回 configured=false 的占位记录(已落库, 含 id)
   */
  findAll(): Promise<Result<SocialConfigResult[]>> {
    return defHttp.get({ url: '/social/config/find-all' });
  },

  /**
   * 根据平台编码查询(不存在则初始化占位记录, 返回含 id 的记录)
   */
  findBySource(source: string): Promise<Result<SocialConfigResult>> {
    return defHttp.get({ url: '/social/config/get-by-source', params: { source } });
  },

  /**
   * 修改平台配置(保存即标记为已配置)
   */
  update(data: SocialConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/social/config/update', data });
  },

  /**
   * 切换平台启用状态(仅已配置平台可启停)
   */
  updateEnabled(source: string, enabled: boolean): Promise<Result<void>> {
    return defHttp.post({ url: '/social/config/update-enabled', params: { source, enabled } });
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
 * 第三方平台登录配置
 */
export interface SocialConfigResult {
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
}

/**
 * 第三方平台登录配置表单参数
 */
export interface SocialConfigParam extends Partial<SocialConfigResult> {}

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
}

/**
 * 已启用的第三方登录平台(登录页公开返回, 仅含平台编码)
 */
export interface SocialEnabledPlatform {
  /** 平台编码(weChat/weCom/qq/github/gitee/feishu/dingTalk/douyin) */
  source: string;
}
