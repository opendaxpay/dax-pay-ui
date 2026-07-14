import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 公共字典 API
 */
export const DictCommonApi = {
  /**
   * 查询所有启用的字典项
   */
  findAllByEnable(): Promise<Result<DictItem[]>> {
    return defHttp.get({ url: '/dict/item/all-by-enable' });
  },
};

/**
 * 字典项(公共)
 */
export interface DictItem extends BaseEntity {
  /** 字典编码 */
  dictCode?: string;
  /** 字典项编码 */
  code?: string;
  /** 国际化key */
  i18nKey?: string;
  /** 排序号 */
  sortNo?: number;
}
