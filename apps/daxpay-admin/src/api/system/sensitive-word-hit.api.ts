import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 敏感词命中记录 API（运营端 /admin/system/sensitive-word-hit）
 */
export const SensitiveWordHitApi = {
  /** 分页查询 */
  page(
    params: SensitiveWordHitQuery & { current: number; size: number },
  ): Promise<Result<PageResult<SensitiveWordHitVo>>> {
    return defHttp.get({ url: '/admin/system/sensitive-word-hit/page', params });
  },

  /** 详情 */
  getById(id: string): Promise<Result<SensitiveWordHitVo>> {
    return defHttp.get({ url: '/admin/system/sensitive-word-hit/get-by-id', params: { id } });
  },
};

/** 查询参数 */
export interface SensitiveWordHitQuery {
  hitWord?: string;
  scene?: string;
  source?: string;
  mchNo?: string;
}

/** 列表/详情 VO */
export interface SensitiveWordHitVo extends BaseEntity {
  wordId?: string;
  hitWord?: string;
  contentPreview?: string;
  scene?: string;
  source?: string;
  mchNo?: string;
  /** 商户名称(本轮后端可能为空) */
  mchName?: string;
  appId?: string;
  operatorId?: string;
  clientIp?: string;
  requestPath?: string;
  remark?: string;
}
