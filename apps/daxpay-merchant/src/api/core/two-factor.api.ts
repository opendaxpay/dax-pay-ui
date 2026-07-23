import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 双因素认证 API
 */
export const TwoFactorApi = {
  /**
   * 查询当前用户双因素认证状态
   */
  status(): Promise<Result<TwoFactorStatus>> {
    return defHttp.get({ url: '/user/auth/two-factor/status' });
  },

  /**
   * 初始化绑定(生成密钥与二维码URI)
   */
  setup(): Promise<Result<TwoFactorSetup>> {
    return defHttp.post({ url: '/user/auth/two-factor/setup' });
  },

  /**
   * 确认绑定(校验动态码并启用)
   */
  confirm(data: TwoFactorConfirmParams): Promise<Result<BackupCodeResult>> {
    return defHttp.post({ url: '/user/auth/two-factor/confirm', data });
  },

  /**
   * 关闭双因素认证
   */
  disable(data: TwoFactorCodeParams): Promise<Result<void>> {
    return defHttp.post({ url: '/user/auth/two-factor/disable', data });
  },

  /**
   * 重新生成备用验证码
   */
  regenerateBackupCodes(data: TwoFactorCodeParams): Promise<Result<BackupCodeResult>> {
    return defHttp.post({ url: '/user/auth/two-factor/regenerate-backup-codes', data });
  },
};

/**
 * 双因素认证状态
 */
export interface TwoFactorStatus {
  /** 平台是否启用双因素认证 */
  platformEnabled?: boolean;
  /** 当前用户是否已绑定 */
  bound?: boolean;
  /** 剩余可用备用验证码数量 */
  backupCodesRemaining?: number;
}

/**
 * 绑定初始化数据
 */
export interface TwoFactorSetup {
  /** TOTP 密钥(Base32) */
  secret: string;
  /** otpauth URI */
  otpAuthUri: string;
}

/**
 * 动态码参数(确认/关闭/重置备用码)
 */
export interface TwoFactorCodeParams {
  /** 验证码(TOTP 动态码或备用码) */
  code: string;
  /** 验证码类型: TOTP(动态码) | BACKUP(备用码) */
  codeType?: 'BACKUP' | 'TOTP';
}

/**
 * 确认绑定参数
 */
export interface TwoFactorConfirmParams extends TwoFactorCodeParams {
  /** 绑定初始化返回的密钥 */
  secret: string;
}

/**
 * 备用验证码结果
 */
export interface BackupCodeResult {
  /** 备用验证码明文列表(一次性) */
  codes: string[];
  /** 备用验证码总数 */
  total: number;
}
