import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 系统终端 API（商户端 /mch/device/terminal/system/*）
 *
 * 后端强制 mchNo=PaymentContext；绑定关系在通道终端登记(运营端)时建立与维护，
 * 商户端仅保留通道终端的只读查询（台账分页 + 按系统终端反查已绑定通道终端）。
 */
export const TerminalDeviceApi = {
  /** 分页 */
  page(
    params: TerminalDeviceQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<TerminalDeviceResult>>> {
    return defHttp.get({ url: '/mch/device/terminal/system/page', params });
  },
  /** 详情 */
  get(id: string): Promise<Result<TerminalDeviceResult>> {
    return defHttp.get({ url: '/mch/device/terminal/system/get', params: { id } });
  },
  /** 当前商户列表 */
  list(): Promise<Result<TerminalDeviceResult[]>> {
    return defHttp.get({ url: '/mch/device/terminal/system/list' });
  },
  /** 新增 */
  add(data: TerminalDeviceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/system/add', data });
  },
  /** 修改 */
  update(data: TerminalDeviceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/system/update', data });
  },
  /** 删除 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/system/delete', params: { id } });
  },
  /** 已绑定通道终端(只读) */
  boundChannelList(terminalNo: string): Promise<Result<ChannelTerminalResult[]>> {
    return defHttp.get({
      url: '/mch/device/terminal/system/bound-channel-list',
      params: { terminalNo },
    });
  },
  /** 设为门店默认终端(同门店唯一, 后端先清后设) */
  setDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/system/set-default', params: { id } });
  },
  /** 取消门店默认终端 */
  clearDefault(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/system/clear-default', params: { id } });
  },
  /** 批量绑定门店(本商户未分配门店的系统终端绑到目标门店) */
  bindStoreBatch(data: TerminalBindStoreBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/system/bind-store-batch', data });
  },
};

/** 通道终端台账 API（商户端 /mch/device/terminal/channel/*，只读） */
export const ChannelTerminalApi = {
  /** 通道终端分页(商户号由后端取上下文, 前端只限定通道商户号与筛选条件) */
  page(
    params: ChannelTerminalQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<ChannelTerminalResult>>> {
    return defHttp.get({ url: '/mch/device/terminal/channel/page', params });
  },
};

/** 系统终端查询 */
export interface TerminalDeviceQuery {
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

/** 通道终端结果（台账列表 / 绑定抽屉展示） */
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
  /** 已绑定的系统终端列表(查询时后端填充, 不落库) */
  systemTerminals?: TerminalDeviceResult[];
}

/** 通道终端查询（商户端只读台账筛选用） */
export interface ChannelTerminalQuery {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属通道 */
  channel?: string;
  /** 所属支付产品 */
  product?: string;
  /** 报送类型 */
  type?: string;
  /** 终端名称 */
  name?: string;
  /** 通道侧终端号 */
  outTerminalNo?: string;
  /** 登记状态 */
  status?: string;
}
