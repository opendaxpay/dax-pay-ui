import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 门店信息 API
 */
export const MchStoreInfoApi = {
  /**
   * 分页查询门店
   */
  page(
    params: MchStoreInfoQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<MchStoreInfoResult>>> {
    return defHttp.get({ url: '/admin/merchant/store/page', params });
  },

  /**
   * 按商户号查询全部门店(门店管理卡片墙, 不分页)
   */
  listAllByMch(mchNo: string): Promise<Result<MchStoreInfoResult[]>> {
    return defHttp.get({ url: '/admin/merchant/store/list-all', params: { mchNo } });
  },

  /**
   * 根据 id 查询门店
   */
  get(id: string): Promise<Result<MchStoreInfoResult>> {
    return defHttp.get({ url: '/admin/merchant/store/get', params: { id } });
  },

  /**
   * 新增门店
   */
  add(data: MchStoreInfoParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/store/add', data });
  },

  /**
   * 修改门店
   */
  update(data: MchStoreInfoParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/store/update', data });
  },

  /**
   * 删除门店
   */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/store/delete', params: { id } });
  },

  /**
   * 设为默认门店
   */
  setDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/store/set-default', params: { id } });
  },

  /**
   * 取消默认门店
   */
  clearDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/store/clear-default', params: { id } });
  },

  /**
   * 门店概况聚合(门店详情工作台: 默认应用/商户默认应用 + 码牌绑定计数)
   */
  overview(id: string): Promise<Result<StoreOverviewResult>> {
    return defHttp.get({ url: '/admin/merchant/store/overview', params: { id } });
  },

  /**
   * 设置/清空门店默认应用(appId 传空串表示清空, 跟随商户默认应用)
   */
  setApp(id: string, appId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/store/set-app', params: { id, appId } });
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
  /** 门店默认支付应用号(空则使用商户默认应用; 更新时空串=清空) */
  appId?: string;
  /** 门店名称 */
  storeName?: string;
  /** 联系人电话 */
  contactPhone?: string;
  /** 门店LOGO */
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
  /** 门店默认支付应用号(空则使用商户默认应用) */
  appId?: string;
  /** 门店默认支付应用名称(只读展示字段) */
  appName?: string;
  /** 门店名称 */
  storeName?: string;
  /** 联系人电话 */
  contactPhone?: string;
  /** 门店LOGO */
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

/** 门店概况聚合结果(门店详情工作台) */
export interface StoreOverviewResult {
  /** 门店配置的默认应用号(未配置为 null) */
  storeAppId?: null | string;
  /** 门店配置的默认应用名(未配置为 null) */
  storeAppName?: null | string;
  /** 商户默认应用号 */
  mchDefaultAppId?: null | string;
  /** 商户默认应用名 */
  mchDefaultAppName?: null | string;
  /** 绑定本店的码牌数 */
  qrCodeCount?: number;
  /** 绑定本店的系统终端数 */
  terminalCount?: number;
  /** 本店默认终端号(未设置为 null) */
  defaultTerminalNo?: null | string;
  /** 本店默认终端名称(未设置为 null) */
  defaultTerminalName?: null | string;
  /** 本店默认终端是否启用(未设置为 null) */
  defaultTerminalEnable?: boolean | null;
}
