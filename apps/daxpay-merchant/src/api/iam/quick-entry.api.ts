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
 * 分桶维度均由请求头自动携带: x-client-code(身份域, 拦截器注入) + x-terminal(壳维度,
 * 拦截器统一注入 web), 后端从上下文读取, 接口无需显式传参; 与移动管理端 App(app) 各存一份, 互不覆盖
 */
export const QuickEntryApi = {
  /** 查询当前用户的快捷入口序列 */
  get(): Promise<Result<QuickEntryResult>> {
    return defHttp.get({ url: '/iam/dashboard/quick-entry' });
  },
  /** 保存当前用户的快捷入口序列(整体覆盖) */
  save(data: QuickEntrySaveParam): Promise<Result<void>> {
    return defHttp.post({ url: '/iam/dashboard/quick-entry', data });
  },
};
