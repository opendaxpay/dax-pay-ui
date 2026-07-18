import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 系统终端 API
 */
export const TerminalDeviceApi = {
  /** 分页 */
  page(
    params: TerminalDeviceQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<TerminalDeviceResult>>> {
    return defHttp.get({ url: '/admin/device/terminal/system/page', params });
  },
  /** 详情 */
  get(id: string): Promise<Result<TerminalDeviceResult>> {
    return defHttp.get({ url: '/admin/device/terminal/system/get', params: { id } });
  },
  /** 按商户列表 */
  listByMchNo(mchNo: string): Promise<Result<TerminalDeviceResult[]>> {
    return defHttp.get({ url: '/admin/device/terminal/system/list-by-mch-no', params: { mchNo } });
  },
  /** 新增 */
  add(data: TerminalDeviceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/system/add', data });
  },
  /** 修改 */
  update(data: TerminalDeviceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/system/update', data });
  },
  /** 删除 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/system/delete', params: { id } });
  },
  /** 绑定通道终端 */
  bind(data: TerminalChannelBindParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/system/bind', data });
  },
  /** 解绑通道终端 */
  unbind(data: TerminalChannelBindParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/system/unbind', data });
  },
  /** 已绑定通道终端 */
  boundChannelList(terminalNo: string): Promise<Result<ChannelTerminalResult[]>> {
    return defHttp.get({
      url: '/admin/device/terminal/system/bound-channel-list',
      params: { terminalNo },
    });
  },
};

/**
 * 通道终端 API
 */
export const ChannelTerminalApi = {
  /** 分页 */
  page(
    params: ChannelTerminalQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<ChannelTerminalResult>>> {
    return defHttp.get({ url: '/admin/device/terminal/channel/page', params });
  },
  /** 详情 */
  get(id: string): Promise<Result<ChannelTerminalResult>> {
    return defHttp.get({ url: '/admin/device/terminal/channel/get', params: { id } });
  },
  /** 按商户列表 */
  listByMchNo(mchNo: string): Promise<Result<ChannelTerminalResult[]>> {
    return defHttp.get({ url: '/admin/device/terminal/channel/list-by-mch-no', params: { mchNo } });
  },
  /** 新增 */
  add(data: ChannelTerminalParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/channel/add', data });
  },
  /** 修改 */
  update(data: ChannelTerminalParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/channel/update', data });
  },
  /** 删除 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/channel/delete', params: { id } });
  },
  /** 绑定系统终端 */
  bind(data: TerminalChannelBindParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/channel/bind', data });
  },
  /** 解绑系统终端 */
  unbind(data: TerminalChannelBindParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/channel/unbind', data });
  },
  /** 已绑定系统终端 */
  boundSystemList(channelTerminalId: string): Promise<Result<TerminalDeviceResult[]>> {
    return defHttp.get({
      url: '/admin/device/terminal/channel/bound-system-list',
      params: { channelTerminalId },
    });
  },
};

/** 系统终端查询 */
export interface TerminalDeviceQuery {
  mchNo?: string;
  terminalNo?: string;
  name?: string;
  storeNo?: string;
  enable?: boolean;
}

/** 系统终端参数 */
export interface TerminalDeviceParam {
  id?: string;
  mchNo?: string;
  name?: string;
  storeNo?: string;
  enable?: boolean;
  remark?: string;
}

/** 系统终端结果 */
export interface TerminalDeviceResult extends BaseEntity {
  terminalNo?: string;
  name?: string;
  mchNo?: string;
  mchName?: string;
  storeNo?: string;
  storeName?: string;
  enable?: boolean;
  remark?: string;
}

/** 通道终端查询 */
export interface ChannelTerminalQuery {
  mchNo?: string;
  channelMchNo?: string;
  channel?: string;
  product?: string;
  type?: string;
  name?: string;
  outTerminalNo?: string;
  status?: string;
}

/** 通道终端参数 */
export interface ChannelTerminalParam {
  id?: string;
  mchNo?: string;
  channelMchNo?: string;
  type?: string;
  name?: string;
  outTerminalNo?: string;
  status?: string;
  errorMsg?: string;
  remark?: string;
}

/** 通道终端结果 */
export interface ChannelTerminalResult extends BaseEntity {
  channelMchNo?: string;
  product?: string;
  channel?: string;
  type?: string;
  name?: string;
  outTerminalNo?: string;
  status?: string;
  errorMsg?: string;
  remark?: string;
  mchNo?: string;
  mchName?: string;
}

/** 绑定参数 */
export interface TerminalChannelBindParam {
  systemTerminalNo: string;
  channelTerminalId: string;
}
