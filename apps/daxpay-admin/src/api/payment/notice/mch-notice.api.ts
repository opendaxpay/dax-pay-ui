import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户出站通知管理 API
 */
export const MchNoticeApi = {
  /** 通知任务分页 */
  pageTask(params: MchNoticeTaskQuery & { current?: number; size?: number }): Promise<Result<PageResult<MchNoticeTaskResult>>> {
    return defHttp.get({ url: '/admin/merchant-notice/task/page', params });
  },

  /** 通知任务详情 */
  getTaskById(id: string): Promise<Result<MchNoticeTaskResult>> {
    return defHttp.get({ url: '/admin/merchant-notice/task/get-by-id', params: { id } });
  },

  /** 手动重发 */
  resend(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant-notice/task/resend', params: { id } });
  },

  /** 发送记录分页 */
  pageRecord(params: MchNoticeRecordQuery & { current?: number; size?: number }): Promise<Result<PageResult<MchNoticeRecordResult>>> {
    return defHttp.get({ url: '/admin/merchant-notice/record/page', params });
  },
};

/** 通知任务查询 */
export interface MchNoticeTaskQuery {
  mchNo?: string;
  appId?: string;
  bizNo?: string;
  event?: string;
  protocol?: string;
  source?: string;
  success?: boolean;
}

/** 通知任务结果 */
export interface MchNoticeTaskResult extends MchEntity {
  appId?: string;
  bizId?: string;
  bizNo?: string;
  event?: string;
  protocol?: string;
  source?: string;
  contentMode?: string;
  content?: string;
  url?: string;
  success?: boolean;
  sendCount?: number;
  delayCount?: number;
  nextTime?: string;
  latestTime?: string;
  errorMsg?: string;
}

/** 发送记录查询 */
export interface MchNoticeRecordQuery {
  taskId?: string;
  mchNo?: string;
  success?: boolean;
}

/** 发送记录结果 */
export interface MchNoticeRecordResult extends MchEntity {
  taskId?: string;
  reqCount?: number;
  sendType?: string;
  success?: boolean;
  httpStatus?: number;
  errorMsg?: string;
  requestDigest?: string;
}
