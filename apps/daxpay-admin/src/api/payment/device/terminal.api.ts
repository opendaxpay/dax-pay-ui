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
  /** 设为门店默认终端(同门店唯一, 后端先清后设) */
  setDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/system/set-default', params: { id } });
  },
  /** 取消门店默认终端 */
  clearDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/system/clear-default', params: { id } });
  },
  /** 批量绑定门店(本商户未分配门店的系统终端绑到目标门店) */
  bindStoreBatch(data: TerminalBindStoreBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/system/bind-store-batch', data });
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
  /** 手动调整(手工订正通道侧终端号与登记状态, 不调通道) */
  register(data: ChannelTerminalRegisterParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/device/terminal/channel/register', data });
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
  /** 仅未分配门店的终端(由后端转 store_no IS NULL, 门店工作台快捷绑定筛选用) */
  storeUnassigned?: boolean;
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
  /** 是否所属门店的默认终端(设置/取消默认入口在门店工作台) */
  defaultTerminal?: boolean;
}

/** 系统终端批量绑定门店参数 */
export interface TerminalBindStoreBatchParam {
  /** 系统终端主键列表 */
  terminalIds: string[];
  /** 目标门店号 */
  storeNo: string;
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
  // 绑定的系统终端编码(新增必填, 建档即绑定; 编辑不传)
  systemTerminalNo?: string;
  name?: string;
  outTerminalNo?: string;
  status?: string;
  errorMsg?: string;
  remark?: string;
}

/** 通道终端手动调整参数(手工订正通道侧终端号与登记状态, 不调通道) */
export interface ChannelTerminalRegisterParam {
  id: string;
  // 通道侧终端号(可空)
  outTerminalNo?: string;
  // 登记状态(字典 channel_terminal_status)
  status: string;
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
  // 已绑定的系统终端列表
  systemTerminals?: TerminalDeviceResult[];
  mchNo?: string;
  mchName?: string;
}

/** 绑定参数 */
export interface TerminalChannelBindParam {
  systemTerminalNo: string;
  channelTerminalId: string;
}
