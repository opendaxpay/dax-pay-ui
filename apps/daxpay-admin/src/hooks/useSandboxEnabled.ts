import { useSandboxEnabled as useSandboxEnabledBase } from '@daxpay/ui-biz/hooks/useSandboxEnabled';

import { PayEnvApi } from '#/api/payment/masterdata/pay-env.api';

/**
 * 平台沙箱总闸开关(运营端适配)
 * 绑定 /admin/pay-env/sandbox-enabled 查询, 共享模块级缓存
 */
export function useSandboxEnabled() {
  return useSandboxEnabledBase(async () => {
    const { data } = await PayEnvApi.sandboxEnabled();
    return data === true;
  });
}
