/**
 * 终端类型枚举(身份域 code 常量)
 *
 * 下拉主数据请用 ClientApi.findAll / useClientOptions, 勿再散落硬编码 options.
 */
export enum ClientCode {
  /** 运营端 */
  ADMIN = 'admin',
  /** 支付网关 */
  GATEWAY = 'gateway',
  /** 商户端 */
  MERCHANT = 'merchant',
}

/**
 * @deprecated 请使用 useClientOptions() 从后端主数据加载; 仅作兜底/类型参考
 */
export const clientCodeOptions = [
  { label: 'common.clientGateway', value: ClientCode.GATEWAY },
  { label: 'common.clientAdmin', value: ClientCode.ADMIN },
  { label: 'common.clientMerchant', value: ClientCode.MERCHANT },
];

/**
 * 终端类型标签颜色映射
 */
export const clientCodeColorMap: Record<string, string> = {
  [ClientCode.GATEWAY]: 'cyan',
  [ClientCode.ADMIN]: 'blue',
  [ClientCode.MERCHANT]: 'purple',
};

/**
 * 终端类型国际化Key映射(表格列等本地展示兜底)
 */
export const clientCodeI18nMap: Record<string, string> = {
  [ClientCode.GATEWAY]: 'common.clientGateway',
  [ClientCode.ADMIN]: 'common.clientAdmin',
  [ClientCode.MERCHANT]: 'common.clientMerchant',
};
