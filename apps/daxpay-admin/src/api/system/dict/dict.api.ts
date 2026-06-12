import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 字典管理 API
 */
export const DictApi = {
  /**
   * 分页查询字典
   */
  page(params: any): Promise<Result<PageResult<Dict>>> {
    return defHttp.get({ url: '/dict/page', params });
  },
  /**
   * 获取字典详情
   */
  findById(id: string): Promise<Result<Dict>> {
    return defHttp.get({ url: '/dict/get', params: { id } });
  },
  /**
   * 添加字典
   */
  add(data: Dict): Promise<Result<void>> {
    return defHttp.post({ url: '/dict/add', data });
  },
  /**
   * 更新字典
   */
  update(data: Dict): Promise<Result<void>> {
    return defHttp.post({ url: '/dict/update', data });
  },
  /**
   * 删除字典
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/dict/delete', params: { id } });
  },
  /**
   * 查询全部字典
   */
  findAll(): Promise<Result<Dict[]>> {
    return defHttp.get({ url: '/dict/all' });
  },
  /**
   * 判断字典编码是否存在
   */
  existsByCode(code: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/dict/exists-by-code', params: { code } });
  },
  /**
   * 判断字典编码是否存在(排除指定ID)
   */
  existsByCodeNotId(code: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/dict/exists-by-code-not-id', params: { code, id } });
  },
};

/**
 * 字典
 */
export interface Dict extends BaseEntity {
  /** 字典编码 */
  code?: string;
  /** 字典名称 */
  name?: string;
  /** 中文名称 */
  nameCn?: string;
  /** 英文名称 */
  nameEn?: string;
  /** 是否启用 */
  enable?: boolean;
  /** 字典类型 */
  dictType?: string;
  /** 是否内置 */
  internal?: boolean;
  /** 备注 */
  remark?: string;
}
