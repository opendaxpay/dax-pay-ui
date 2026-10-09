import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 支付环境配置 API（商户端, 全局沙箱开关）
 */
export const PayEnvApi = {
  /**
   * 查询沙箱环境全局开关状态
   */
  sandboxEnabled(): Promise<Result<boolean>> {
    return defHttp.get({ url: '/mch/pay-env/sandbox-enabled' });
  },
};
