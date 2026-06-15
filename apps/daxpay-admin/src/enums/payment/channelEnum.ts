/**
 * 支付通道枚举
 */
export enum ChannelEnum {
  /** 汇付天下 */
  ADA_PAY = 'ada_pay',
  /** 支付宝 */
  ALIPAY = 'alipay',
  /** 斗拱 */
  DOUGONG_PAY = 'dougong_pay',
  /** 抖音支付 */
  DOUYIN_PAY = 'douyin_pay',
  /** 富友 */
  FUYOU_PAY = 'fuyou_pay',
  /** 海科融通 */
  HKRT_PAY = 'hkrt_pay',
  /** jeepay */
  JEE_PAY = 'jee_pay',
  /** 拉卡拉 */
  LAKALA_PAY = 'lakala_pay',
  /** 乐刷 */
  LESHUA_PAY = 'leshua_pay',
  /** 快钱 */
  QUICK_PAY = 'quick_pay',
  /** 杉德 */
  SAND_PAY = 'sand_pay',
  /** 盛付通 */
  SHENG_PAY = 'sheng_pay',
  /** 银联商务 */
  UMS_PAY = 'ums_pay',
  /** 云闪付 */
  UNION_PAY = 'union_pay',
  /** 随行付 */
  VBILL_PAY = 'vbill_pay',
  /** 微信支付 */
  WECHAT = 'wechat',
  /** 易宝 */
  YEE_PAY = 'yee_pay',
  /** 银盛 */
  YSEP_PAY = 'ysep_pay',
}

/**
 * 支付通道国际化Key映射
 */
export const channelI18nMap: Record<string, string> = {
  [ChannelEnum.ALIPAY]: 'payment.channel.common.alipay',
  [ChannelEnum.WECHAT]: 'payment.channel.common.wechat',
  [ChannelEnum.UNION_PAY]: 'payment.channel.common.unionPay',
  [ChannelEnum.LESHUA_PAY]: 'payment.channel.common.leshuaPay',
  [ChannelEnum.VBILL_PAY]: 'payment.channel.common.vbillPay',
  [ChannelEnum.ADA_PAY]: 'payment.channel.common.adaPay',
  [ChannelEnum.DOUGONG_PAY]: 'payment.channel.common.dougongPay',
  [ChannelEnum.DOUYIN_PAY]: 'payment.channel.common.douyinPay',
  [ChannelEnum.HKRT_PAY]: 'payment.channel.common.hkrtPay',
  [ChannelEnum.LAKALA_PAY]: 'payment.channel.common.lakalaPay',
  [ChannelEnum.FUYOU_PAY]: 'payment.channel.common.fuyouPay',
  [ChannelEnum.SHENG_PAY]: 'payment.channel.common.shengPay',
  [ChannelEnum.YSEP_PAY]: 'payment.channel.common.ysepPay',
  [ChannelEnum.QUICK_PAY]: 'payment.channel.common.quickPay',
  [ChannelEnum.SAND_PAY]: 'payment.channel.common.sandPay',
  [ChannelEnum.YEE_PAY]: 'payment.channel.common.yeePay',
  [ChannelEnum.UMS_PAY]: 'payment.channel.common.umsPay',
  [ChannelEnum.JEE_PAY]: 'payment.channel.common.jeePay',
};

/**
 * 支付通道默认名称映射
 */
export const channelNameMap: Record<string, string> = {
  [ChannelEnum.ALIPAY]: '支付宝',
  [ChannelEnum.WECHAT]: '微信支付',
  [ChannelEnum.UNION_PAY]: '云闪付',
  [ChannelEnum.LESHUA_PAY]: '乐刷',
  [ChannelEnum.VBILL_PAY]: '随行付',
  [ChannelEnum.ADA_PAY]: '汇付天下',
  [ChannelEnum.DOUGONG_PAY]: '斗拱',
  [ChannelEnum.DOUYIN_PAY]: '抖音支付',
  [ChannelEnum.HKRT_PAY]: '海科融通',
  [ChannelEnum.LAKALA_PAY]: '拉卡拉',
  [ChannelEnum.FUYOU_PAY]: '富友',
  [ChannelEnum.SHENG_PAY]: '盛付通',
  [ChannelEnum.YSEP_PAY]: '银盛',
  [ChannelEnum.QUICK_PAY]: '快钱',
  [ChannelEnum.SAND_PAY]: '杉德',
  [ChannelEnum.YEE_PAY]: '易宝',
  [ChannelEnum.UMS_PAY]: '银联商务',
  [ChannelEnum.JEE_PAY]: 'jeepay',
};

/**
 * 支付通道Logo文件映射
 * key为通道编码，value为assets/channel/目录下的SVG文件名（不含扩展名）
 */
export const channelLogoMap: Record<string, string> = {
  [ChannelEnum.ALIPAY]: 'ali_pay',
  [ChannelEnum.WECHAT]: 'wechat',
  [ChannelEnum.UNION_PAY]: 'union_pay',
  [ChannelEnum.LESHUA_PAY]: 'leshua',
  [ChannelEnum.VBILL_PAY]: 'vbill_pay',
  [ChannelEnum.ADA_PAY]: 'ada_pay',
  [ChannelEnum.DOUGONG_PAY]: 'dougong',
  [ChannelEnum.DOUYIN_PAY]: 'douyin_pay',
  [ChannelEnum.HKRT_PAY]: 'hkrt_pay',
  [ChannelEnum.LAKALA_PAY]: 'lakala',
  [ChannelEnum.FUYOU_PAY]: 'fuyou',
  [ChannelEnum.SHENG_PAY]: 'sheng_pay',
  [ChannelEnum.YSEP_PAY]: 'ysep_pay',
  [ChannelEnum.QUICK_PAY]: 'quick_pay',
  [ChannelEnum.SAND_PAY]: 'sand_pay',
  [ChannelEnum.YEE_PAY]: 'yee_pay',
  [ChannelEnum.UMS_PAY]: 'ums_pay',
  [ChannelEnum.JEE_PAY]: 'jee_pay',
};
