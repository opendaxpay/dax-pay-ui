import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 系统终端 API（商户端 /mch/device/terminal/system/*）
 *
 * 后端强制 mchNo=PaymentContext；绑定候选通道终端走同前缀 channel-terminal-list。
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
  /** 绑定通道终端 */
  bind(data: TerminalChannelBindParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/system/bind', data });
  },
  /** 解绑通道终端 */
  unbind(data: TerminalChannelBindParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/system/unbind', data });
  },
  /** 已绑定通道终端 */
  boundChannelList(terminalNo: string): Promise<Result<ChannelTerminalResult[]>> {
    return defHttp.get({
      url: '/mch/device/terminal/system/bound-channel-list',
      params: { terminalNo },
    });
  },
  /** 当前商户通道终端候选（绑定用） */
  channelTerminalList(): Promise<Result<ChannelTerminalResult[]>> {
    return defHttp.get({ url: '/mch/device/terminal/system/channel-terminal-list' });
  },
};

/** 系统终端查询 */
export interface TerminalDeviceQuery {
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

/** 通道终端结果（绑定抽屉展示） */
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
