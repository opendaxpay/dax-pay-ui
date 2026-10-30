/**
 * 虚拟设备试播/试打入参(简版, 与后端测试端点参数对齐)
 *
 * 试播(ANNOUNCE)与试打(PRINT_BOTH/PRINT_ONLY)共用一套参数;
 * 简版无模板表, 版式为代码内置枚举 templateCode(首期仅 standard=标准小票)。
 */
export interface DeviceTestParam {
  /** 金额(分), 空=1250 */
  amountFen?: number;
  /** 收款方式(PayProviderEnum code) */
  channel?: string;
  /** 设备主键 */
  id?: string;
  /** 输出模式: PRINT_BOTH=播报+打印 / PRINT_ONLY=仅打印(试播由入口区分, 无需传) */
  mode?: string;
  /** 商户订单号(可选, 票面变量展示) */
  outBizNo?: string;
  /** 打印版式代码(内置枚举, 首期仅 standard=标准小票) */
  templateCode?: string;
}

/**
 * 内置打印版式代码(后端代码内置常量, 无模板表无 CRUD; 首期仅标准小票)
 *
 * 文案 key 规则: `components.deviceTest.template.{code}`, 各端语言包按此补齐
 */
export const PRINT_TEMPLATE_CODES = ['standard'] as const;
