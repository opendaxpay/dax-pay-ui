import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/** 已选快捷入口有序序列(纯 key 数组), null 表示用户尚未自定义 */
export interface QuickEntryResult {
  entries: null | string[];
}

/** 快捷入口保存参数 */
export interface QuickEntrySaveParam {
  entries: string[];
}

/**
 * 工作台快捷入口偏好 API
 *
 * PC 与移动端由后端按请求终端(clientCode)自动区分，前端无需传 clientCode
 */
export const QuickEntryApi = {
  /** 查询当前用户的快捷入口序列 */
  get(): Promise<Result<QuickEntryResult>> {
    return defHttp.get({ url: '/iam/dashboard/quick-entry' });
  },
  /** 保存当前用户的快捷入口序列(整体覆盖) */
  save(data: QuickEntrySaveParam): Promise<Result<void>> {
    return defHttp.put({ url: '/iam/dashboard/quick-entry', data });
  },
};
