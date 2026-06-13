/**
 * 终端类型枚举
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
 * 终端类型选项配置
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
 * 终端类型国际化Key映射
 */
export const clientCodeI18nMap: Record<string, string> = {
  [ClientCode.GATEWAY]: 'common.clientGateway',
  [ClientCode.ADMIN]: 'common.clientAdmin',
  [ClientCode.MERCHANT]: 'common.clientMerchant',
};
