/** 实体资源卡片底栏状态(状态点样式类 + 文案), 与 resolveIsvCardStatus 等状态解析函数返回值对齐 */
export interface ResourceCardStatus {
  /** 状态点 Tailwind 样式类, 如 bg-primary / bg-green-500 / bg-yellow-500 / bg-muted-foreground/50 */
  dotClass?: string;
  /** 状态文案, 如「启用」「正常」「支付已停用」 */
  text?: string;
}
