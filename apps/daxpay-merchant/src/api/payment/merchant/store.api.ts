import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 门店信息 API（商户端 /mch/store/*）
 */
export const MchStoreInfoApi = {
  /**
   * 分页查询门店
   */
  page(
    params: MchStoreInfoQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<MchStoreInfoResult>>> {
    return defHttp.get({ url: '/mch/store/page', params });
  },

  /**
   * 根据 id 查询门店
   */
  get(id: string): Promise<Result<MchStoreInfoResult>> {
    return defHttp.get({ url: '/mch/store/get', params: { id } });
  },

  /**
   * 新增门店
   */
  add(data: MchStoreInfoParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/store/add', data });
  },

  /**
   * 修改门店
   */
  update(data: MchStoreInfoParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/store/update', data });
  },

  /**
   * 删除门店
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/store/delete', params: { id } });
  },

  /**
   * 设为默认门店
   */
  setDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/store/set-default', params: { id } });
  },

  /**
   * 取消默认门店
   */
  clearDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/store/clear-default', params: { id } });
  },
};

/** 门店查询参数 */
export interface MchStoreInfoQuery {
  /** 商户号 */
  mchNo?: string;
  /** 门店号 */
  storeNo?: string;
  /** 门店名称 */
  storeName?: string;
  /** 联系人电话 */
  contactPhone?: string;
  /** 状态 enable / disabled */
  status?: string;
}

/** 门店参数 */
export interface MchStoreInfoParam {
  /** 主键 */
  id?: string;
  /** 商户号 */
  mchNo?: string;
  /** 门店名称 */
  storeName?: string;
  /** 联系人电话 */
  contactPhone?: string;
  /** 门店 LOGO */
  logoUrl?: string;
  /** 门头照 */
  facadeUrl?: string;
  /** 门店内景照 */
  interiorUrl?: string;
  /** 行政区划代码 */
  regionCode?: string;
  /** 详细地址 */
  address?: string;
  /** 经度 */
  longitude?: number;
  /** 纬度 */
  latitude?: number;
  /** 状态 enable / disabled */
  status?: string;
  /** 是否默认门店 */
  defaultStore?: boolean;
  /** 备注 */
  remark?: string;
}

/** 门店结果 */
export interface MchStoreInfoResult extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 门店号 */
  storeNo?: string;
  /** 门店名称 */
  storeName?: string;
  /** 联系人电话 */
  contactPhone?: string;
  /** 门店 LOGO */
  logoUrl?: string;
  /** 门头照 */
  facadeUrl?: string;
  /** 门店内景照 */
  interiorUrl?: string;
  /** 行政区划代码 */
  regionCode?: string;
  /** 详细地址 */
  address?: string;
  /** 经度 */
  longitude?: number;
  /** 纬度 */
  latitude?: number;
  /** 状态 */
  status?: string;
  /** 是否默认门店 */
  defaultStore?: boolean;
  /** 备注 */
  remark?: string;
}
