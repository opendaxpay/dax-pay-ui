/**
 * 支付通道枚举
 */
export enum ChannelEnum {
  /** 汇付天下(下挂 ada_pay / dougong_pay / huifu_ecny 三个产品) */
  HUIFU = 'huifu',
  /** 支付宝 */
  ALIPAY = 'alipay',
  /** 抖音支付 */
  DOUYIN = 'douyin',
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
  /** Stripe */
  STRIPE = 'stripe',
  /** 银联商务 */
  UMS_PAY = 'ums_pay',
  /** 银联 */
  UNION_PAY = 'union_pay',
  /** 随行付 */
  VBILL_PAY = 'vbill_pay',
  /** 微信支付 */
  WECHAT = 'wechat',
  /** 易宝 */
  YEE_PAY = 'yee_pay',
  /** 银盛 */
  YSEP_PAY = 'ysep_pay',
  /** 易支付(三方聚合平台) */
  EASY_PAY = 'easy_pay',
  /** 星驿付(新大陆旗下国通星驿) */
  XINGYI_PAY = 'xingyi_pay',
  /** 建行龙支付(建设银行聚合支付) */
  LONG_PAY = 'long_pay',
  /** 通联支付(聚合收单) */
  ALLIN_PAY = 'allin_pay',
  /** 收钱吧(聚合扫码收单) */
  SHOUQIANBA = 'shouqianba',
  /** 连连支付(占位通道, 未对接) */
  LLIAN_PAY = 'llianpay',
  /** 嘉联支付(占位通道, 未对接) */
  JL_PAY = 'jlpay',
  /** 合利宝(占位通道, 未对接) */
  HELI_PAY = 'helipay',
  /** 付呗(占位通道, 未对接) */
  FUBEI_PAY = 'fubei',
  /** 易票联(占位通道, 未对接) */
  EPAY_LINKS = 'epaylinks',
  /** PayPal(国际支付通道, 占位未对接) */
  PAY_PAL = 'paypal',
  /** Airwallex(国际支付通道, 占位未对接) */
  AIRWALLEX = 'airwallex',
  /** 中金支付(占位通道, 未对接) */
  CPCN_PAY = 'cpcn',
  /** 宝付支付(占位通道, 未对接) */
  BAOFU_PAY = 'baofu',
  /** 首信易支付(占位通道, 未对接) */
  YIZHIFU_PAY = 'yizhifubj',
  /** 哆啦宝(占位通道, 未对接) */
  DUOLABAO_PAY = 'duolabao',
  /** 有赞支付(占位通道, 未对接) */
  YOUZAN_PAY = 'youzan',
  /** Payssion(占位通道, 未对接) */
  PAYSSION = 'payssion',
  /** 联动优势(占位通道, 未对接) */
  UMF_PAY = 'umfpay',
  /** 易生支付(占位通道, 未对接) */
  YISHENG_PAY = 'yisheng_pay',
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
  [ChannelEnum.HUIFU]: 'payment.channel.common.huifu',
  [ChannelEnum.DOUYIN]: 'payment.channel.common.douyin',
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
  [ChannelEnum.STRIPE]: 'payment.channel.common.stripe',
  // 易支付
  [ChannelEnum.EASY_PAY]: 'payment.channel.common.easyPay',
  // 星驿付
  [ChannelEnum.XINGYI_PAY]: 'payment.channel.common.xingyiPay',
  // 建行龙支付
  [ChannelEnum.LONG_PAY]: 'payment.channel.common.longPay',
  // 通联支付
  [ChannelEnum.ALLIN_PAY]: 'payment.channel.common.allinPay',
  // 收钱吧
  [ChannelEnum.SHOUQIANBA]: 'payment.channel.common.shouqianba',
  // 连连支付(占位通道, 未对接)
  [ChannelEnum.LLIAN_PAY]: 'payment.channel.common.llianPay',
  // 嘉联支付(占位通道, 未对接)
  [ChannelEnum.JL_PAY]: 'payment.channel.common.jlPay',
  // 合利宝(占位通道, 未对接)
  [ChannelEnum.HELI_PAY]: 'payment.channel.common.heliPay',
  // 付呗(占位通道, 未对接)
  [ChannelEnum.FUBEI_PAY]: 'payment.channel.common.fubei',
  // 易票联(占位通道, 未对接)
  [ChannelEnum.EPAY_LINKS]: 'payment.channel.common.epayLinks',
  // PayPal(国际通道, 占位未对接)
  [ChannelEnum.PAY_PAL]: 'payment.channel.common.paypal',
  // Airwallex(国际通道, 占位未对接)
  [ChannelEnum.AIRWALLEX]: 'payment.channel.common.airwallex',
  // 中金支付(占位通道, 未对接)
  [ChannelEnum.CPCN_PAY]: 'payment.channel.common.cpcn',
  // 宝付支付(占位通道, 未对接)
  [ChannelEnum.BAOFU_PAY]: 'payment.channel.common.baofu',
  // 首信易支付(占位通道, 未对接)
  [ChannelEnum.YIZHIFU_PAY]: 'payment.channel.common.yizhifuPay',
  // 哆啦宝(占位通道, 未对接)
  [ChannelEnum.DUOLABAO_PAY]: 'payment.channel.common.duolabao',
  // 有赞支付(占位通道, 未对接)
  [ChannelEnum.YOUZAN_PAY]: 'payment.channel.common.youzan',
  // Payssion(占位通道, 未对接)
  [ChannelEnum.PAYSSION]: 'payment.channel.common.payssion',
  // 联动优势(占位通道, 未对接)
  [ChannelEnum.UMF_PAY]: 'payment.channel.common.umfpay',
  // 易生支付(占位通道, 未对接)
  [ChannelEnum.YISHENG_PAY]: 'payment.channel.common.yishengPay',
};

/**
 * 支付通道默认名称映射
 */
export const channelNameMap: Record<string, string> = {
  [ChannelEnum.ALIPAY]: '支付宝',
  [ChannelEnum.WECHAT]: '微信支付',
  [ChannelEnum.UNION_PAY]: '银联支付',
  [ChannelEnum.LESHUA_PAY]: '乐刷',
  [ChannelEnum.VBILL_PAY]: '随行付',
  [ChannelEnum.HUIFU]: '汇付天下',
  [ChannelEnum.DOUYIN]: '抖音支付',
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
  [ChannelEnum.STRIPE]: 'Stripe',
  // 易支付
  [ChannelEnum.EASY_PAY]: '易支付',
  // 星驿付
  [ChannelEnum.XINGYI_PAY]: '星驿付',
  // 建行龙支付
  [ChannelEnum.LONG_PAY]: '建行龙支付',
  // 通联支付
  [ChannelEnum.ALLIN_PAY]: '通联支付',
  // 收钱吧
  [ChannelEnum.SHOUQIANBA]: '收钱吧',
  // 连连支付(占位通道, 未对接)
  [ChannelEnum.LLIAN_PAY]: '连连支付',
  // 嘉联支付(占位通道, 未对接)
  [ChannelEnum.JL_PAY]: '嘉联支付',
  // 合利宝(占位通道, 未对接)
  [ChannelEnum.HELI_PAY]: '合利宝',
  // 付呗(占位通道, 未对接)
  [ChannelEnum.FUBEI_PAY]: '付呗',
  // 易票联(占位通道, 未对接)
  [ChannelEnum.EPAY_LINKS]: '易票联',
  // PayPal(国际通道, 占位未对接)
  [ChannelEnum.PAY_PAL]: 'PayPal',
  // Airwallex(国际通道, 占位未对接)
  [ChannelEnum.AIRWALLEX]: 'Airwallex',
  // 中金支付(占位通道, 未对接)
  [ChannelEnum.CPCN_PAY]: '中金支付',
  // 宝付支付(占位通道, 未对接)
  [ChannelEnum.BAOFU_PAY]: '宝付支付',
  // 首信易支付(占位通道, 未对接)
  [ChannelEnum.YIZHIFU_PAY]: '首信易支付',
  // 哆啦宝(占位通道, 未对接)
  [ChannelEnum.DUOLABAO_PAY]: '哆啦宝',
  // 有赞支付(占位通道, 未对接)
  [ChannelEnum.YOUZAN_PAY]: '有赞支付',
  // Payssion(占位通道, 未对接)
  [ChannelEnum.PAYSSION]: 'Payssion',
  // 联动优势(占位通道, 未对接)
  [ChannelEnum.UMF_PAY]: '联动优势',
  // 易生支付(占位通道, 未对接)
  [ChannelEnum.YISHENG_PAY]: '易生支付',
};

/**
 * 支付通道Logo文件映射
 * key为通道编码，value为assets/channel/目录下的SVG文件名（不含扩展名）
 */
export const channelLogoMap: Record<string, string> = {
  [ChannelEnum.ALIPAY]: 'alipay',
  [ChannelEnum.WECHAT]: 'wechat',
  [ChannelEnum.UNION_PAY]: 'union_pay',
  [ChannelEnum.LESHUA_PAY]: 'leshua',
  [ChannelEnum.VBILL_PAY]: 'vbill_pay',
  // 汇付暂复用 ada_pay.svg；抖音复用 douyin_pay.svg
  [ChannelEnum.HUIFU]: 'ada_pay',
  [ChannelEnum.DOUYIN]: 'douyin_pay',
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
  // Stripe 通道
  [ChannelEnum.STRIPE]: 'stripe',
  // 易支付(easy_pay.svg 已存在, 直接登记)
  [ChannelEnum.EASY_PAY]: 'easy_pay',
  // 星驿付
  [ChannelEnum.XINGYI_PAY]: 'xingyi_pay',
  // 建行龙支付
  [ChannelEnum.LONG_PAY]: 'long_pay',
  // 通联支付(allin_pay.svg 已存在, 直接登记)
  [ChannelEnum.ALLIN_PAY]: 'allin_pay',
  // 收钱吧(shouqianba.svg 已存在, 直接登记)
  [ChannelEnum.SHOUQIANBA]: 'shouqianba',
  // 连连支付(占位通道, 未对接)
  [ChannelEnum.LLIAN_PAY]: 'llianpay',
  // 嘉联支付(占位通道, 未对接)
  [ChannelEnum.JL_PAY]: 'jlpay',
  // 合利宝(占位通道, 未对接)
  [ChannelEnum.HELI_PAY]: 'helipay',
  // 付呗(占位通道, 未对接)
  [ChannelEnum.FUBEI_PAY]: 'fubei',
  // 易票联(占位通道, 未对接)
  [ChannelEnum.EPAY_LINKS]: 'epaylinks',
  // PayPal(国际通道, 占位未对接)
  [ChannelEnum.PAY_PAL]: 'paypal',
  // Airwallex(国际通道, 占位未对接)
  [ChannelEnum.AIRWALLEX]: 'airwallex',
  // 中金支付(占位通道, 未对接)
  [ChannelEnum.CPCN_PAY]: 'cpcn',
  // 宝付支付(占位通道, 未对接)
  [ChannelEnum.BAOFU_PAY]: 'baofu',
  // 首信易支付(占位通道, 未对接)
  [ChannelEnum.YIZHIFU_PAY]: 'yizhifubj',
  // 哆啦宝(占位通道, 未对接)
  [ChannelEnum.DUOLABAO_PAY]: 'duolabao',
  // 有赞支付(占位通道, 未对接)
  [ChannelEnum.YOUZAN_PAY]: 'youzan',
  // Payssion(占位通道, 未对接)
  [ChannelEnum.PAYSSION]: 'payssion',
  // 联动优势(占位通道, 未对接)
  [ChannelEnum.UMF_PAY]: 'umfpay',
  // 易生支付(占位通道, 未对接)
  [ChannelEnum.YISHENG_PAY]: 'yisheng_pay',
};
