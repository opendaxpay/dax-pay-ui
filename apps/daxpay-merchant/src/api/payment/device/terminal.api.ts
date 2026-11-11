import type { BaseEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户终端 API（商户端 /mch/device/terminal/system/*）
 *
 * 后端强制 mchNo=PaymentContext；通道终端台账由商户自行维护（新增建档/报备/注销等），
 * 商户终端侧保留台账反查入口（按商户终端反查已绑定通道终端）。
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
  /** 批量绑定门店(本商户未分配门店的商户终端绑到目标门店) */
  bindStoreBatch(data: TerminalBindStoreBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/system/bind-store-batch', data });
  },
};

/** 通道终端台账 API（商户端 /mch/device/terminal/channel/*，商户可维护自己名下的通道终端） */
export const ChannelTerminalApi = {
  /** 通道终端分页(商户号由后端取上下文, 前端只限定通道商户号与筛选条件) */
  page(
    params: ChannelTerminalQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<ChannelTerminalResult>>> {
    return defHttp.get({ url: '/mch/device/terminal/channel/page', params });
  },
  /** 详情 */
  get(id: string): Promise<Result<ChannelTerminalResult>> {
    return defHttp.get({ url: '/mch/device/terminal/channel/get', params: { id } });
  },
  /** 新增(建档即绑定; 商户号由后端取上下文, 前端只传通道商户上下文与业务字段) */
  add(data: ChannelTerminalAddParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/channel/add', data });
  },
  /** 修改(名称/报备参数/备注) */
  update(data: ChannelTerminalUpdateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/channel/update', data });
  },
  /** 手动调整(手工订正通道终端号与登记状态, 不调通道) */
  register(data: ChannelTerminalRegisterParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/channel/register', data });
  },
  /** 报备(调通道API; 未绑定时须选择商户终端, 报备即绑定) */
  report(data: ChannelTerminalReportParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/channel/report', data });
  },
  /** 注销(调通道API; 人工通道直接置已注销) */
  cancel(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/channel/cancel', params: { id } });
  },
  /** 状态同步(调通道API回读实际状态) */
  sync(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/channel/sync', params: { id } });
  },
  /** 删除台账(后端级联解绑) */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/channel/delete', params: { id } });
  },
  /** 解绑当前绑定的商户终端(只传通道终端主键, 后端取绑定关系并校验归属) */
  unbind(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/device/terminal/channel/unbind', params: { id } });
  },
  /** 通道支持的终端报送类型(空列表=通道不支持自动报备) */
  terminalTypes(product: string): Promise<Result<string[]>> {
    return defHttp.get({ url: '/mch/device/terminal/channel/terminal-types', params: { product } });
  },
  /** 通道差异化报备参数字段定义(结构化表单渲染用, 无定义返回空数组) */
  extraFields(product: string): Promise<Result<TerminalExtraField[]>> {
    return defHttp.get({ url: '/mch/device/terminal/channel/extra-fields', params: { product } });
  },
  /** 通道终端维护能力(报备/同步/注销是否可用, 用于按钮置灰) */
  capabilities(product: string): Promise<Result<TerminalCapabilityResult>> {
    return defHttp.get({ url: '/mch/device/terminal/channel/capabilities', params: { product } });
  },
};

/** 商户终端查询 */
export interface TerminalDeviceQuery {
  terminalNo?: string;
  name?: string;
  storeNo?: string;
  enable?: boolean;
  /** 仅未分配门店的终端(由后端转 store_no IS NULL, 门店工作台快捷绑定筛选用) */
  storeUnassigned?: boolean;
}

/** 商户终端参数 */
export interface TerminalDeviceParam {
  id?: string;
  mchNo?: string;
  name?: string;
  storeNo?: string;
  enable?: boolean;
  remark?: string;
}

/** 商户终端结果 */
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
  /** 关联的通道终端(后端分页时批量填充, 只读聚合; 未下发时为 undefined) */
  channelTerminals?: ChannelTerminalResult[];
}

/** 商户终端批量绑定门店参数 */
export interface TerminalBindStoreBatchParam {
  /** 商户终端主键列表 */
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
  /** 通道差异化报备参数(JSON, 键=通道协议参数名) */
  extra?: string;
  /** 已绑定的商户终端列表(查询时后端填充, 不落库) */
  systemTerminals?: TerminalDeviceResult[];
}

/** 通道终端新增参数(通道商户上下文由抽屉带出, 商户号由后端取上下文) */
export interface ChannelTerminalAddParam {
  channelMchNo?: string;
  /** 报送类型(字典 terminal_type) */
  type?: string;
  /** 绑定的商户终端编码(新增必填, 建档即绑定) */
  systemTerminalNo?: string;
  name?: string;
  /** 登记状态(新增固定 init) */
  status?: string;
  remark?: string;
  /** 通道差异化报备参数(JSON, 键=通道协议参数名) */
  extra?: string;
}

/** 通道终端修改参数(仅维护基础信息, 通道侧终端号与登记状态走手动调整) */
export interface ChannelTerminalUpdateParam {
  id?: string;
  name?: string;
  extra?: string;
  remark?: string;
}

/** 通道终端手动调整参数(手工订正通道终端号与登记状态, 不调通道) */
export interface ChannelTerminalRegisterParam {
  id: string;
  /** 通道侧终端号(可空) */
  outTerminalNo?: string;
  /** 登记状态(字典 channel_terminal_status) */
  status: string;
}

/** 通道终端报备参数(报备即绑定; 已绑定时商户终端编码可空=沿用已绑定终端) */
export interface ChannelTerminalReportParam {
  id: string;
  /** 商户终端编码(首次报备必填) */
  systemTerminalNo?: string;
}

/** 通道差异化报备参数字段定义(后端策略下发, 商户端按此渲染结构化表单) */
export interface TerminalExtraField {
  /** 字段键(即 extra JSON 的 key) */
  key: string;
  /** 字段标签(通道协议字段名, 随策略下发) */
  label: string;
  /** 控件类型: input 单行 / textarea 多行 */
  type?: string;
  /** 是否必填 */
  required?: boolean;
  /** 占位提示 */
  placeholder?: string;
  /** 字段说明 */
  desc?: string;
}

/** 通道终端维护能力(报备/同步/注销是否可用) */
export interface TerminalCapabilityResult {
  /** 是否支持自动报备 */
  reportSupported?: boolean;
  /** 通道支持的报送类型 */
  terminalTypes?: string[];
  /** 是否支持注销 */
  supportsCancel?: boolean;
  /** 是否支持状态同步 */
  supportsSync?: boolean;
  /** 通道差异化报备字段定义 */
  extraFields?: TerminalExtraField[];
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
