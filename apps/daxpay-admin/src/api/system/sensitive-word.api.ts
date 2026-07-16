import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 敏感词词库 API（运营端 /admin/system/sensitive-word）
 */
export const SensitiveWordApi = {
  /** 分页查询 */
  page(
    params: SensitiveWordQuery & { current: number; size: number },
  ): Promise<Result<PageResult<SensitiveWordVo>>> {
    return defHttp.get({ url: '/admin/system/sensitive-word/page', params });
  },

  /** 详情 */
  getById(id: string): Promise<Result<SensitiveWordVo>> {
    return defHttp.get({ url: '/admin/system/sensitive-word/get-by-id', params: { id } });
  },

  /** 新增 */
  add(data: SensitiveWordParam): Promise<Result<SensitiveWordVo>> {
    return defHttp.post({ url: '/admin/system/sensitive-word/add', data });
  },

  /** 修改 */
  update(data: SensitiveWordParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/system/sensitive-word/update', data });
  },

  /** 删除 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/system/sensitive-word/delete', params: { id } });
  },

  /** 词面是否存在 */
  existsByWord(word: string, id?: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/admin/system/sensitive-word/exists-by-word', params: { word, id } });
  },

  /** 试检文本 */
  checkText(data: { text: string; recordHit?: boolean }): Promise<
    Result<{ hits: string[]; hit: boolean }>
  > {
    return defHttp.post({ url: '/admin/system/sensitive-word/check-text', data });
  },
};

/** 查询参数 */
export interface SensitiveWordQuery {
  word?: string;
  category?: string;
  status?: string;
  matchMode?: string;
}

/** 表单参数 */
export interface SensitiveWordParam {
  id?: string;
  word?: string;
  category?: string;
  matchMode?: string;
  status?: string;
  remark?: string;
}

/** 列表/详情 VO */
export interface SensitiveWordVo extends BaseEntity {
  word?: string;
  category?: string;
  matchMode?: string;
  level?: string;
  status?: string;
  remark?: string;
}
