import type { Result } from '#/types/web';

import { requestClient } from '#/api/request';

/**
 * 通行密钥(WebAuthn) API
 *
 * options 结构与 @simplewebauthn/browser 的标准 WebAuthn JSON 类型对齐,
 * 注册/认证响应整体 JSON 序列化后以字符串回传后端验证。
 */

/** 凭据描述(排除/允许凭据列表元素) */
export interface PasskeyCredentialDescriptor {
  /** 凭据ID(base64url) */
  id: string;
  /** 凭证类型(固定 public-key) */
  type: 'public-key';
}

/** 公钥算法参数 */
export interface PasskeyPubKeyCredParam {
  /** 凭证类型(固定 public-key) */
  type: 'public-key';
  /** COSE 算法标识(ES256=-7, RS256=-257) */
  alg: number;
}

/** 认证器选择条件 */
export interface PasskeyAuthenticatorSelection {
  /** 客户端可发现凭据要求(required=passkey 免输账号) */
  residentKey?: 'discouraged' | 'preferred' | 'required';
  /** 用户验证要求(required=生物识别/PIN) */
  userVerification?: 'discouraged' | 'preferred' | 'required';
}

/** 注册选项(W3C PublicKeyCredentialCreationOptionsJSON 对齐) */
export interface PasskeyCreationOptions {
  /** 依赖方信息 */
  rp: { id?: string; name: string };
  /** 用户信息 */
  user: { displayName: string; id: string; name: string };
  /** 挑战值(base64url) */
  challenge: string;
  /** 公钥算法参数列表 */
  pubKeyCredParams: PasskeyPubKeyCredParam[];
  /** 超时时间(毫秒) */
  timeout?: number;
  /** 排除的已有凭据(防同一认证器重复注册) */
  excludeCredentials?: PasskeyCredentialDescriptor[];
  /** 认证器选择条件 */
  authenticatorSelection?: PasskeyAuthenticatorSelection;
  /** 证明收集偏好(none 不收集) */
  attestation?: 'direct' | 'enterprise' | 'indirect' | 'none';
}

/** 登录选项(W3C PublicKeyCredentialRequestOptionsJSON 对齐) */
export interface PasskeyRequestOptions {
  /** 挑战值(base64url) */
  challenge: string;
  /** 超时时间(毫秒) */
  timeout?: number;
  /** 依赖方ID(域名) */
  rpId?: string;
  /** 允许的凭据列表(空=discoverable 免输账号) */
  allowCredentials?: PasskeyCredentialDescriptor[];
  /** 用户验证要求 */
  userVerification?: 'discouraged' | 'preferred' | 'required';
}

/** 登录选项结果 */
export interface PasskeyLoginOptionsResult {
  /** 挑战上下文ID(登录验证时回传) */
  challengeId: string;
  /** 认证选项 */
  options: PasskeyRequestOptions;
}

/** 注册选项结果 */
export interface PasskeyRegisterOptionsResult {
  /** 挑战上下文ID(注册确认时回传) */
  challengeId: string;
  /** 注册选项 */
  options: PasskeyCreationOptions;
}

/** 用户通行密钥条目 */
export interface UserPasskeyItem {
  /** 凭据记录ID */
  id: string;
  /** 设备可辨识名 */
  deviceName: string;
  /** 凭据传输方式(逗号分隔) */
  transports: null | string;
  /** 是否多设备同步凭据 */
  backupEligible: boolean;
  /** 是否处于同步状态 */
  backupState: boolean;
  /** 创建时间 */
  createTime: string;
  /** 最后使用时间 */
  lastUsedTime: null | string;
}

export const PasskeyApi = {
  /**
   * 获取登录选项(匿名, discoverable 免输账号)
   */
  loginOptions(client: string): Promise<Result<PasskeyLoginOptionsResult>> {
    return requestClient.post('/passkey/login-options', { client });
  },
  /**
   * 登录验证(提交认证器断言, 返回 token; 与密码登录同标准走 nonce 防重放)
   */
  loginVerify(data: { challengeId: string; client: string; credentialJson: string }): Promise<Result<string>> {
    return requestClient.post('/passkey/login-verify', data, { requireNonce: true });
  },
  /**
   * 获取注册选项(需登录密码确认)
   */
  registerOptions(password: string): Promise<Result<PasskeyRegisterOptionsResult>> {
    return requestClient.post('/user/auth/passkey/register-options', { password });
  },
  /**
   * 确认注册(验证并绑定凭据)
   */
  register(data: {
    challengeId: string;
    credentialJson: string;
    deviceName: string;
    transports?: string[];
  }): Promise<Result<UserPasskeyItem>> {
    return requestClient.post('/user/auth/passkey/register', data);
  },
  /**
   * 已绑定的通行密钥列表
   */
  list(): Promise<Result<UserPasskeyItem[]>> {
    return requestClient.get('/user/auth/passkey/list');
  },
  /**
   * 重命名通行密钥
   */
  rename(data: { deviceName: string; id: string }): Promise<Result<void>> {
    return requestClient.post('/user/auth/passkey/rename', data);
  },
  /**
   * 删除通行密钥(需登录密码确认)
   */
  remove(data: { id: string; password: string }): Promise<Result<void>> {
    return requestClient.post('/user/auth/passkey/delete', data);
  },
};

/**
 * 当前浏览器是否支持通行密钥(需 WebAuthn API 且处于安全上下文)
 */
export function isPasskeySupported(): boolean {
  return typeof window !== 'undefined' && window.PublicKeyCredential !== undefined && window.isSecureContext === true;
}
