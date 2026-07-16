import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 平台敏感词策略配置 API（平台配置 Tab）
 */
export const SensitiveWordConfigApi = {
  /** 获取策略 */
  get(): Promise<Result<SensitiveWordConfig>> {
    return defHttp.get({ url: '/platform/config/sensitive-word/get' });
  },

  /** 更新策略 */
  update(data: SensitiveWordConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/platform/config/sensitive-word/update', data });
  },
};

/** 敏感词策略 */
export interface SensitiveWordConfig {
  /** 是否启用过滤 */
  enabled?: boolean;
  /** 是否回显命中词 */
  revealWord?: boolean;
  /** 是否写命中审计 */
  recordHit?: boolean;
  /** 原文摘要最大长度 */
  contentPreviewMaxLen?: number;
}
