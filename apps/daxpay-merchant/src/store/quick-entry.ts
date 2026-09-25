import { createQuickEntryStore } from '@daxpay/ui-biz/components/quick-entry';

import { QuickEntryApi } from '#/api/iam/quick-entry.api';

/**
 * 工作台快捷入口偏好 Store
 *
 * 实现由 ui-biz 工厂提供, API 注入本端 defHttp 封装
 * (分桶维度 x-client-code + x-terminal 由请求拦截器自动携带)
 */
export const useQuickEntryStore = createQuickEntryStore(QuickEntryApi);
