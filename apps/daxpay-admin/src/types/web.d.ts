/**
 * 分页参数
 */
export interface PageParam {
  /** 每页数量 */
  size: number;
  /** 当前页数 */
  current: number;
}

/**
 * 通用响应类
 */
export interface Result<T = any> {
  /** 响应码 */
  code: number;
  /** 响应消息 */
  msg: string;
  /** 追踪ID */
  traceId: null | string | undefined;
  /** 响应数据 */
  data: T;
}

/**
 * 分页响应类
 */
export interface PageResult<T = any> {
  /** 当前页数 */
  current: number;
  /** 数据列表 */
  records: Array<T>;
  /** 每页数量 */
  size: number;
  /** 总数 */
  total: number;
}

/**
 * 基础实体对象
 */
export interface BaseEntity {
  /** 主键ID */
  id?: null | string;
  /** 创建时间 */
  createTime?: null | string;
}

/**
 * 商户应用基础实体对象
 */
export interface MchEntity extends BaseEntity {
  /** 服务商号 */
  isvNo?: string;
  /** 服务商名称 */
  isvName?: string;
  /** 商户号 */
  mchNo?: string;
  /** 商户名称 */
  mchName?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 通道商户名称 */
  channelMchName?: string;
  /** 应用号 */
  appId?: string;
  /** 应用名称 */
  appName?: string;
}

/**
 * 键值对对象
 */
export interface KeyValue {
  /** 键 */
  key: string;
  /** 值 */
  value: string;
}
/**
 * 下拉列表对象
 */
export interface LabelValue {
  /** 标签 */
  label: string;
  /** 值 */
  value: string;
}

/**
 * 分页表格列表对象
 */
export interface TablePageModel<T = any> {
  /** 分页参数 */
  pages: PageParam;
  /** 查询参数 */
  queryParam: Record<string, any>;
  /** 分页结果 */
  pagination: PageResult<T>;
}
