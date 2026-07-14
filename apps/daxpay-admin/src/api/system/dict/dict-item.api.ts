import type { PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 字典项管理 API
 */
export const DictItemApi = {
  /**
   * 分页查询指定字典下的字典项
   */
  pageByDictionaryId(dictId: string, params: any): Promise<Result<PageResult<DictItem>>> {
    return defHttp.get({ url: '/dict/item/page-by-dictionary-id', params: { dictId, ...params } });
  },
  /**
   * 获取字典项详情
   */
  findById(id: string): Promise<Result<DictItem>> {
    return defHttp.get({ url: '/dict/item/get', params: { id } });
  },
  /**
   * 添加字典项
   */
  add(data: DictItem): Promise<Result<void>> {
    return defHttp.post({ url: '/dict/item/add', data });
  },
  /**
   * 更新字典项
   */
  update(data: DictItem): Promise<Result<void>> {
    return defHttp.post({ url: '/dict/item/update', data });
  },
  /**
   * 删除字典项
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/dict/item/delete', params: { id } });
  },
  /**
   * 查询指定字典下的所有字典项
   */
  findByDictionaryId(dictId: string): Promise<Result<DictItem[]>> {
    return defHttp.get({ url: '/dict/item/get-by-dictionary-id', params: { dictId } });
  },
  /**
   * 获取全部字典项
   */
  findAll(): Promise<Result<DictItem[]>> {
    return defHttp.get({ url: '/dict/item/all' });
  },
  /**
   * 获取启用的字典项列表
   */
  findAllByEnable(): Promise<Result<DictItem[]>> {
    return defHttp.get({ url: '/dict/item/all-by-enable' });
  },
  /**
   * 判断字典项编码是否存在
   */
  existsByCode(code: string, dictId: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/dict/item/exists-by-code', params: { code, dictId } });
  },
  /**
   * 判断字典项编码是否存在(排除指定ID)
   */
  existsByCodeNotId(code: string, dictId: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/dict/item/exists-by-code-not-id', params: { code, dictId, id } });
  },
};

/**
 * 字典项
 */
export interface DictItem {
  /** 主键ID */
  id?: string;
  /** 字典ID */
  dictId?: string;
  /** 字典编码 */
  dictCode?: string;
  /** 字典项编码 */
  code?: string;
  /** 国际化key */
  i18nKey?: string;
  /** 启用状态 */
  enable?: boolean;
  /** 排序号 */
  sortNo?: number;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime?: string;
}
