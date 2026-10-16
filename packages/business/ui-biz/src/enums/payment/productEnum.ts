import { ChannelEnum } from './channelEnum';

/**
 * 支付产品枚举
 */
export enum ProductEnum {
  /** Adapay(直连) */
  ADA_PAY = 'ada_pay',
  /** 支付宝(直连) */
  ALIPAY = 'alipay',
  /** 支付宝(服务商) */
  ALIPAY_ISV = 'alipay_isv',
  /** 斗拱(归属汇付天下 huifu 通道) */
  DOUGONG_PAY = 'dougong_pay',
  /** 抖音支付(直连) */
  DOUYIN_PAY = 'douyin_pay',
  /** 富友商户前置(直连商户模式) */
  FUYOU_DIRECT = 'fuyou_direct',
  /** 富友(H5聚合收银台) */
  FUYOU_H5 = 'fuyou_h5',
  /** 富友(互联网直连) */
  FUYOU_INTERNET = 'fuyou_internet',
  /** 富友支付 */
  FUYOU_PAY = 'fuyou_pay',
  /** 海科融通支付 */
  HKRT_PAY = 'hkrt_pay',
  /** 河马付(杉德旗下产品) */
  HM_PAY = 'hm_pay',
  /** 汇付数字人民币(经斗拱) */
  HUIFU_ECNY = 'huifu_ecny',
  /** jeepay */
  JEE_PAY = 'jee_pay',
  /** 拉卡拉支付 */
  LAKALA_PAY = 'lakala_pay',
  /** 乐刷支付 */
  LESHUA_PAY = 'leshua_pay',
  /** 快钱 */
  QUICK_PAY = 'quick_pay',
  /** 杉德支付(杉德通道主产品) */
  SAND_PAY = 'sand_pay',
  /** 盛付通(服务商) */
  SHENG_ISV = 'sheng_isv',
  /** 盛付通(商户) */
  SHENG_PAY = 'sheng_pay',
  /** Stripe */
  STRIPE_PAY = 'stripe_pay',
  /** 银联商务(APP) */
  UMS_APP = 'ums_app',
  /** 银联商务(B扫C) */
  UMS_BARCODE = 'ums_barcode',
  /** 银联商务(H5) */
  UMS_H5 = 'ums_h5',
  /** 银联商务(公众号) */
  UMS_JSAPI = 'ums_jsapi',
  /** 银联商务(小程序) */
  UMS_MINI = 'ums_mini',
  /** 银联商务(C扫B) */
  UMS_QRCODE = 'ums_qrcode',
  /** 云闪付(含主扫/H5/被扫, 银联ACP) */
  UNION_PAY = 'union_pay',
  /** 随行付 */
  VBILL_PAY = 'vbill_pay',
  /** 微信支付(服务商) */
  WECHAT_ISV = 'wechat_isv',
  /** 微信支付(直连) */
  WECHAT_PAY = 'wechat_pay',
  /** 易宝 */
  YEE_PAY = 'yee_pay',
  /** 银盛 */
  YSEP_PAY = 'ysep_pay',
  /** 银盛e企通 */
  YSEQT_PAY = 'yseqt_pay',
  /** 易支付(三方聚合平台, 一期扫码两类) */
  EASY_PAY = 'easy_pay',
  /** 星驿付(新大陆旗下国通星驿, 一通道一产品) */
  XINGYI_PAY = 'xingyi_pay',
  /** 建行龙支付(建设银行聚合支付, 一通道一产品) */
  LONG_PAY = 'long_pay',
  /** 通联支付·云商通(综合支付, 归属通联通道 allin_pay) */
  ALLIN_CLOUD = 'allin_cloud',
  /** 通联支付·收银宝(收单, 统一下单 API) */
  ALLIN_CASHIER = 'allin_cashier',
  /** 通联支付·收付通(收款+付款) */
  ALLIN_PAYFUND = 'allin_payfund',
  /** 通联支付·金服宝(直联, AT 直连收单) */
  ALLIN_DIRECT = 'allin_direct',
  /** 收钱吧(聚合扫码收单, 一通道一产品) */
  SHOUQIANBA = 'shouqianba',
  /** 连连聚合支付(占位, 未对接) */
  LLIAN_PAY = 'llian_pay',
  /** 嘉联聚合支付(占位, 未对接) */
  JL_PAY = 'jl_pay',
  /** 合利宝支付(占位, 未对接) */
  HELI_PAY = 'heli_pay',
  /** 付呗聚合支付(占位, 未对接) */
  FUBEI_PAY = 'fubei_pay',
  /** 易票联支付(占位, 未对接) */
  EPAY_LINKS = 'epay_links',
  /** PayPal 支付(国际, 占位未对接) */
  PAY_PAL = 'paypal',
  /** Airwallex 支付(国际, 占位未对接) */
  AIRWALLEX = 'airwallex',
  /** 中金聚合支付(占位, 未对接) */
  CPCN_PAY = 'cpcn_pay',
  /** 宝付支付(占位, 未对接) */
  BAOFU_PAY = 'baofu_pay',
  /** 首信易支付(占位, 未对接) */
  YIZHIFU_PAY = 'yizhifubj_pay',
  /** 哆啦宝支付(占位, 未对接) */
  DUOLABAO_PAY = 'duolabao_pay',
  /** 有赞支付(占位, 未对接) */
  YOUZAN_PAY = 'youzan_pay',
  /** Payssion(占位, 未对接) */
  PAYSSION = 'payssion',
  /** 拉卡拉MOSS(拉卡拉 MOSS 开放平台产品线, 占位未对接) */
  LAKALA_MOSS = 'lakala_moss',
  /** 富友合作方(scanpay 合作方模式, 占位未对接) */
  FUYOU_PARTNER = 'fuyou_partner',
  /** 联动优势(占位, 未对接) */
  UMF_PAY = 'umf_pay',
  /** 易生支付(占位, 未对接) */
  YISHENG_PAY = 'yisheng_pay',
}

/**
 * 支付产品国际化Key映射
 */
export const productI18nMap: Record<string, string> = {
  [ProductEnum.ALIPAY_ISV]: 'payment.product.enum.alipayIsv',
  [ProductEnum.ALIPAY]: 'payment.product.enum.alipay',
  [ProductEnum.WECHAT_ISV]: 'payment.product.enum.wechatIsv',
  [ProductEnum.WECHAT_PAY]: 'payment.product.enum.wechatPay',
  [ProductEnum.DOUYIN_PAY]: 'payment.product.enum.douyinPay',
  [ProductEnum.UMS_QRCODE]: 'payment.product.enum.umsQrcode',
  [ProductEnum.UMS_JSAPI]: 'payment.product.enum.umsJsapi',
  [ProductEnum.UMS_APP]: 'payment.product.enum.umsApp',
  [ProductEnum.UMS_MINI]: 'payment.product.enum.umsMini',
  [ProductEnum.UMS_H5]: 'payment.product.enum.umsH5',
  [ProductEnum.UMS_BARCODE]: 'payment.product.enum.umsBarcode',
  [ProductEnum.UNION_PAY]: 'payment.product.enum.unionPay',
  [ProductEnum.LAKALA_PAY]: 'payment.product.enum.lakalaPay',
  [ProductEnum.LESHUA_PAY]: 'payment.product.enum.leshuaPay',
  [ProductEnum.ADA_PAY]: 'payment.product.enum.adaPay',
  [ProductEnum.DOUGONG_PAY]: 'payment.product.enum.dougongPay',
  // 汇付数字人民币(经斗拱)
  [ProductEnum.HUIFU_ECNY]: 'payment.product.enum.huifuEcny',
  [ProductEnum.HKRT_PAY]: 'payment.product.enum.hkrtPay',
  [ProductEnum.VBILL_PAY]: 'payment.product.enum.vbillPay',
  [ProductEnum.HM_PAY]: 'payment.product.enum.hmPay',
  // 杉德支付(杉德通道主产品)
  [ProductEnum.SAND_PAY]: 'payment.product.enum.sandPay',
  [ProductEnum.FUYOU_PAY]: 'payment.product.enum.fuyouPay',
  [ProductEnum.FUYOU_DIRECT]: 'payment.product.enum.fuyouDirect',
  // 富友(互联网直连)
  [ProductEnum.FUYOU_INTERNET]: 'payment.product.enum.fuyouInternet',
  // 富友(H5聚合收银台)
  [ProductEnum.FUYOU_H5]: 'payment.product.enum.fuyouH5',
  [ProductEnum.STRIPE_PAY]: 'payment.product.enum.stripePay',
  [ProductEnum.SHENG_ISV]: 'payment.product.enum.shengIsv',
  [ProductEnum.SHENG_PAY]: 'payment.product.enum.shengPay',
  [ProductEnum.YSEP_PAY]: 'payment.product.enum.ysepPay',
  // 银盛e企通
  [ProductEnum.YSEQT_PAY]: 'payment.product.enum.yseqtPay',
  [ProductEnum.QUICK_PAY]: 'payment.product.enum.quickPay',
  [ProductEnum.YEE_PAY]: 'payment.product.enum.yeePay',
  [ProductEnum.JEE_PAY]: 'payment.product.enum.jeePay',
  // 易支付
  [ProductEnum.EASY_PAY]: 'payment.product.enum.easyPay',
  // 星驿付
  [ProductEnum.XINGYI_PAY]: 'payment.product.enum.xingyiPay',
  // 建行龙支付
  [ProductEnum.LONG_PAY]: 'payment.product.enum.longPay',
  // 通联支付(一通道四产品)
  [ProductEnum.ALLIN_CLOUD]: 'payment.product.enum.allinCloud',
  [ProductEnum.ALLIN_CASHIER]: 'payment.product.enum.allinCashier',
  [ProductEnum.ALLIN_PAYFUND]: 'payment.product.enum.allinPayfund',
  [ProductEnum.ALLIN_DIRECT]: 'payment.product.enum.allinDirect',
  // 收钱吧
  [ProductEnum.SHOUQIANBA]: 'payment.product.enum.shouqianba',
  // 连连聚合支付(占位, 未对接)
  [ProductEnum.LLIAN_PAY]: 'payment.product.enum.llianPay',
  // 嘉联聚合支付(占位, 未对接)
  [ProductEnum.JL_PAY]: 'payment.product.enum.jlPay',
  // 合利宝支付(占位, 未对接)
  [ProductEnum.HELI_PAY]: 'payment.product.enum.heliPay',
  // 付呗聚合支付(占位, 未对接)
  [ProductEnum.FUBEI_PAY]: 'payment.product.enum.fubeiPay',
  // 易票联支付(占位, 未对接)
  [ProductEnum.EPAY_LINKS]: 'payment.product.enum.epayLinks',
  // PayPal 支付(国际, 占位未对接)
  [ProductEnum.PAY_PAL]: 'payment.product.enum.paypal',
  // Airwallex 支付(国际, 占位未对接)
  [ProductEnum.AIRWALLEX]: 'payment.product.enum.airwallex',
  // 中金聚合支付(占位, 未对接)
  [ProductEnum.CPCN_PAY]: 'payment.product.enum.cpcnPay',
  // 宝付支付(占位, 未对接)
  [ProductEnum.BAOFU_PAY]: 'payment.product.enum.baofuPay',
  // 首信易支付(占位, 未对接)
  [ProductEnum.YIZHIFU_PAY]: 'payment.product.enum.yizhifuPay',
  // 哆啦宝支付(占位, 未对接)
  [ProductEnum.DUOLABAO_PAY]: 'payment.product.enum.duolabaoPay',
  // 有赞支付(占位, 未对接)
  [ProductEnum.YOUZAN_PAY]: 'payment.product.enum.youzanPay',
  // Payssion(占位, 未对接)
  [ProductEnum.PAYSSION]: 'payment.product.enum.payssion',
  // 拉卡拉MOSS(占位, 未对接)
  [ProductEnum.LAKALA_MOSS]: 'payment.product.enum.lakalaMoss',
  // 富友合作方(占位, 未对接)
  [ProductEnum.FUYOU_PARTNER]: 'payment.product.enum.fuyouPartner',
  // 联动优势(占位, 未对接)
  [ProductEnum.UMF_PAY]: 'payment.product.enum.umfPay',
  // 易生支付(占位, 未对接)
  [ProductEnum.YISHENG_PAY]: 'payment.product.enum.yishengPay',
};

/**
 * 支付产品默认名称映射
 */
export const productNameMap: Record<string, string> = {
  [ProductEnum.ALIPAY_ISV]: '支付宝(服务商)',
  [ProductEnum.ALIPAY]: '支付宝(直连)',
  [ProductEnum.WECHAT_ISV]: '微信支付(服务商)',
  [ProductEnum.WECHAT_PAY]: '微信支付(直连)',
  [ProductEnum.DOUYIN_PAY]: '抖音支付(直连)',
  [ProductEnum.UMS_QRCODE]: '银联商务(C扫B)',
  [ProductEnum.UMS_JSAPI]: '银联商务(公众号)',
  [ProductEnum.UMS_APP]: '银联商务(APP)',
  [ProductEnum.UMS_MINI]: '银联商务(小程序)',
  [ProductEnum.UMS_H5]: '银联商务(H5)',
  [ProductEnum.UMS_BARCODE]: '银联商务(B扫C)',
  [ProductEnum.UNION_PAY]: '银联支付',
  [ProductEnum.LAKALA_PAY]: '拉卡拉支付',
  [ProductEnum.LESHUA_PAY]: '乐刷支付',
  // Adapay(直连): 中文环境显示汇付天下, 国际化环境经 i18n(enum.adaPay) 显示 Adapay
  [ProductEnum.ADA_PAY]: '汇付天下',
  [ProductEnum.DOUGONG_PAY]: '斗拱',
  // 汇付数字人民币(经斗拱)
  [ProductEnum.HUIFU_ECNY]: '汇付数字人民币',
  [ProductEnum.HKRT_PAY]: '海科融通支付',
  [ProductEnum.VBILL_PAY]: '随行付',
  // 河马付(杉德旗下聚合支付产品)
  [ProductEnum.HM_PAY]: '河马付',
  // 杉德支付(杉德通道主产品)
  [ProductEnum.SAND_PAY]: '杉德支付',
  // 富友支付
  [ProductEnum.FUYOU_PAY]: '富友支付',
  // 富友商户前置(直连商户模式)
  [ProductEnum.FUYOU_DIRECT]: '富友商户前置',
  // 富友(互联网直连)
  [ProductEnum.FUYOU_INTERNET]: '富友(互联网直连)',
  // 富友(H5聚合收银台)
  [ProductEnum.FUYOU_H5]: '富友(H5聚合收银台)',
  // Stripe
  [ProductEnum.STRIPE_PAY]: 'Stripe',
  // 盛付通(服务商)
  [ProductEnum.SHENG_ISV]: '盛付通(服务商)',
  // 盛付通(商户)
  [ProductEnum.SHENG_PAY]: '盛付通(商户)',
  // 银盛支付
  [ProductEnum.YSEP_PAY]: '银盛支付',
  // 银盛e企通
  [ProductEnum.YSEQT_PAY]: '银盛e企通',
  // 快钱支付
  [ProductEnum.QUICK_PAY]: '快钱支付',
  // 易宝支付
  [ProductEnum.YEE_PAY]: '易宝支付',
  // Jeepay
  [ProductEnum.JEE_PAY]: 'Jeepay',
  // 易支付
  [ProductEnum.EASY_PAY]: '易支付',
  // 星驿付
  [ProductEnum.XINGYI_PAY]: '星驿付',
  // 建行龙支付
  [ProductEnum.LONG_PAY]: '建行龙支付',
  // 通联支付·云商通
  [ProductEnum.ALLIN_CLOUD]: '云商通',
  // 通联支付·收银宝
  [ProductEnum.ALLIN_CASHIER]: '收银宝',
  // 通联支付·收付通
  [ProductEnum.ALLIN_PAYFUND]: '收付通',
  // 通联支付·金服宝
  [ProductEnum.ALLIN_DIRECT]: '金服宝',
  // 收钱吧
  [ProductEnum.SHOUQIANBA]: '收钱吧',
  // 连连聚合支付(占位, 未对接)
  [ProductEnum.LLIAN_PAY]: '连连聚合支付',
  // 嘉联聚合支付(占位, 未对接)
  [ProductEnum.JL_PAY]: '嘉联聚合支付',
  // 合利宝支付(占位, 未对接)
  [ProductEnum.HELI_PAY]: '合利宝支付',
  // 付呗聚合支付(占位, 未对接)
  [ProductEnum.FUBEI_PAY]: '付呗聚合支付',
  // 易票联支付(占位, 未对接)
  [ProductEnum.EPAY_LINKS]: '易票联支付',
  // PayPal 支付(国际, 占位未对接)
  [ProductEnum.PAY_PAL]: 'PayPal支付',
  // Airwallex 支付(国际, 占位未对接)
  [ProductEnum.AIRWALLEX]: 'Airwallex支付',
  // 中金聚合支付(占位, 未对接)
  [ProductEnum.CPCN_PAY]: '中金聚合支付',
  // 宝付支付(占位, 未对接)
  [ProductEnum.BAOFU_PAY]: '宝付支付',
  // 首信易支付(占位, 未对接)
  [ProductEnum.YIZHIFU_PAY]: '首信易支付',
  // 哆啦宝支付(占位, 未对接)
  [ProductEnum.DUOLABAO_PAY]: '哆啦宝支付',
  // 有赞支付(占位, 未对接)
  [ProductEnum.YOUZAN_PAY]: '有赞支付',
  // Payssion(占位, 未对接)
  [ProductEnum.PAYSSION]: 'Payssion',
  // 拉卡拉MOSS(占位, 未对接)
  [ProductEnum.LAKALA_MOSS]: '拉卡拉MOSS',
  // 富友合作方(占位, 未对接)
  [ProductEnum.FUYOU_PARTNER]: '富友(合作方)',
  // 联动优势(占位, 未对接)
  [ProductEnum.UMF_PAY]: '联动优势',
  // 易生支付(占位, 未对接)
  [ProductEnum.YISHENG_PAY]: '易生支付',
};

/**
 * 产品关联通道映射
 */
export const productChannelMap: Record<string, string> = {
  [ProductEnum.ALIPAY_ISV]: ChannelEnum.ALIPAY,
  [ProductEnum.ALIPAY]: ChannelEnum.ALIPAY,
  [ProductEnum.WECHAT_ISV]: ChannelEnum.WECHAT,
  [ProductEnum.WECHAT_PAY]: ChannelEnum.WECHAT,
  [ProductEnum.DOUYIN_PAY]: ChannelEnum.DOUYIN,
  [ProductEnum.UMS_QRCODE]: ChannelEnum.UMS_PAY,
  [ProductEnum.UMS_JSAPI]: ChannelEnum.UMS_PAY,
  [ProductEnum.UMS_APP]: ChannelEnum.UMS_PAY,
  [ProductEnum.UMS_MINI]: ChannelEnum.UMS_PAY,
  [ProductEnum.UMS_H5]: ChannelEnum.UMS_PAY,
  [ProductEnum.UMS_BARCODE]: ChannelEnum.UMS_PAY,
  [ProductEnum.UNION_PAY]: ChannelEnum.UNION_PAY,
  [ProductEnum.LAKALA_PAY]: ChannelEnum.LAKALA_PAY,
  [ProductEnum.LESHUA_PAY]: ChannelEnum.LESHUA_PAY,
  [ProductEnum.ADA_PAY]: ChannelEnum.HUIFU,
  // 斗拱归属汇付天下(huifu)通道
  [ProductEnum.DOUGONG_PAY]: ChannelEnum.HUIFU,
  // 汇付数字人民币(经斗拱)归属汇付天下(huifu)通道
  [ProductEnum.HUIFU_ECNY]: ChannelEnum.HUIFU,
  [ProductEnum.HKRT_PAY]: ChannelEnum.HKRT_PAY,
  [ProductEnum.VBILL_PAY]: ChannelEnum.VBILL_PAY,
  // 河马付归属杉德通道
  [ProductEnum.HM_PAY]: ChannelEnum.SAND_PAY,
  // 杉德支付(杉德通道主产品)
  [ProductEnum.SAND_PAY]: ChannelEnum.SAND_PAY,
  // 富友支付(一通道四产品: 服务商/商户前置/互联网直连/H5聚合收银台共用 FUYOU_PAY 通道)
  [ProductEnum.FUYOU_PAY]: ChannelEnum.FUYOU_PAY,
  [ProductEnum.FUYOU_DIRECT]: ChannelEnum.FUYOU_PAY,
  [ProductEnum.FUYOU_INTERNET]: ChannelEnum.FUYOU_PAY,
  [ProductEnum.FUYOU_H5]: ChannelEnum.FUYOU_PAY,
  // Stripe
  [ProductEnum.STRIPE_PAY]: ChannelEnum.STRIPE,
  // 盛付通(一通道两产品: 商户模式/服务商模式共用 SHENG_PAY 通道)
  [ProductEnum.SHENG_ISV]: ChannelEnum.SHENG_PAY,
  [ProductEnum.SHENG_PAY]: ChannelEnum.SHENG_PAY,
  // 银盛(一通道一产品)
  [ProductEnum.YSEP_PAY]: ChannelEnum.YSEP_PAY,
  // 银盛e企通归属银盛通道
  [ProductEnum.YSEQT_PAY]: ChannelEnum.YSEP_PAY,
  // 快钱(一通道一产品)
  [ProductEnum.QUICK_PAY]: ChannelEnum.QUICK_PAY,
  // 易宝(一通道一产品)
  [ProductEnum.YEE_PAY]: ChannelEnum.YEE_PAY,
  // jeepay(一通道一产品)
  [ProductEnum.JEE_PAY]: ChannelEnum.JEE_PAY,
  // 易支付(一通道一产品)
  [ProductEnum.EASY_PAY]: ChannelEnum.EASY_PAY,
  // 星驿付(一通道一产品)
  [ProductEnum.XINGYI_PAY]: ChannelEnum.XINGYI_PAY,
  // 建行龙支付(一通道一产品)
  [ProductEnum.LONG_PAY]: ChannelEnum.LONG_PAY,
  // 通联支付(一通道四产品共用 allin_pay 通道)
  [ProductEnum.ALLIN_CLOUD]: ChannelEnum.ALLIN_PAY,
  [ProductEnum.ALLIN_CASHIER]: ChannelEnum.ALLIN_PAY,
  [ProductEnum.ALLIN_PAYFUND]: ChannelEnum.ALLIN_PAY,
  [ProductEnum.ALLIN_DIRECT]: ChannelEnum.ALLIN_PAY,
  // 收钱吧(一通道一产品)
  [ProductEnum.SHOUQIANBA]: ChannelEnum.SHOUQIANBA,
  // ===== 合规通道占位(一通道一产品, 未对接) =====
  // 连连支付(占位通道, 未对接)
  [ProductEnum.LLIAN_PAY]: ChannelEnum.LLIAN_PAY,
  // 嘉联支付(占位通道, 未对接)
  [ProductEnum.JL_PAY]: ChannelEnum.JL_PAY,
  // 合利宝(占位通道, 未对接)
  [ProductEnum.HELI_PAY]: ChannelEnum.HELI_PAY,
  // 付呗(占位通道, 未对接)
  [ProductEnum.FUBEI_PAY]: ChannelEnum.FUBEI_PAY,
  // 易票联(占位通道, 未对接)
  [ProductEnum.EPAY_LINKS]: ChannelEnum.EPAY_LINKS,
  // PayPal(国际通道, 占位未对接)
  [ProductEnum.PAY_PAL]: ChannelEnum.PAY_PAL,
  // Airwallex(国际通道, 占位未对接)
  [ProductEnum.AIRWALLEX]: ChannelEnum.AIRWALLEX,
  // ===== 合规通道占位 C 批(未对接) =====
  // 中金支付(占位通道, 未对接)
  [ProductEnum.CPCN_PAY]: ChannelEnum.CPCN_PAY,
  // 宝付支付(占位通道, 未对接)
  [ProductEnum.BAOFU_PAY]: ChannelEnum.BAOFU_PAY,
  // 首信易支付(占位通道, 未对接)
  [ProductEnum.YIZHIFU_PAY]: ChannelEnum.YIZHIFU_PAY,
  // 哆啦宝(占位通道, 未对接)
  [ProductEnum.DUOLABAO_PAY]: ChannelEnum.DUOLABAO_PAY,
  // 有赞支付(占位通道, 未对接)
  [ProductEnum.YOUZAN_PAY]: ChannelEnum.YOUZAN_PAY,
  // Payssion(占位通道, 未对接)
  [ProductEnum.PAYSSION]: ChannelEnum.PAYSSION,
  // 拉卡拉MOSS归属拉卡拉通道
  [ProductEnum.LAKALA_MOSS]: ChannelEnum.LAKALA_PAY,
  // 富友合作方归属富友通道
  [ProductEnum.FUYOU_PARTNER]: ChannelEnum.FUYOU_PAY,
  // 联动优势(占位通道, 未对接)
  [ProductEnum.UMF_PAY]: ChannelEnum.UMF_PAY,
  // 易生支付(占位通道, 未对接)
  [ProductEnum.YISHENG_PAY]: ChannelEnum.YISHENG_PAY,
};

/**
 * 支付产品Logo文件映射
 * key为产品编码，value为assets/channel/目录下的SVG文件名（不含扩展名）
 * 产品图标统一由此映射维护，未命中的产品回退使用所属通道的Logo（见 channelLogoMap）
 */
export const productLogoMap: Record<string, string> = {
  // 支付宝
  [ProductEnum.ALIPAY]: 'alipay',
  [ProductEnum.ALIPAY_ISV]: 'alipay',
  // 微信
  [ProductEnum.WECHAT_PAY]: 'wechat',
  [ProductEnum.WECHAT_ISV]: 'wechat',
  // 抖音
  [ProductEnum.DOUYIN_PAY]: 'douyin_pay',
  // 银联商务(6个子产品共用通道Logo)
  [ProductEnum.UMS_QRCODE]: 'ums_pay',
  [ProductEnum.UMS_JSAPI]: 'ums_pay',
  [ProductEnum.UMS_APP]: 'ums_pay',
  [ProductEnum.UMS_MINI]: 'ums_pay',
  [ProductEnum.UMS_H5]: 'ums_pay',
  [ProductEnum.UMS_BARCODE]: 'ums_pay',
  // 云闪付
  [ProductEnum.UNION_PAY]: 'union_pay',
  // 拉卡拉
  [ProductEnum.LAKALA_PAY]: 'lakala',
  // 乐刷
  [ProductEnum.LESHUA_PAY]: 'leshua',
  // Adapay(直连)
  [ProductEnum.ADA_PAY]: 'ada_pay',
  // 斗拱(汇付天下旗下)
  [ProductEnum.DOUGONG_PAY]: 'dougong',
  // 海科融通
  [ProductEnum.HKRT_PAY]: 'hkrt_pay',
  // 随行付
  [ProductEnum.VBILL_PAY]: 'vbill_pay',
  // 富友
  [ProductEnum.FUYOU_PAY]: 'fuyou',
  // 河马付(杉德旗下聚合支付产品, 独立品牌Logo)
  [ProductEnum.HM_PAY]: 'hm_pay',
  // 星驿付
  [ProductEnum.XINGYI_PAY]: 'xingyi_pay',
  // 建行龙支付
  [ProductEnum.LONG_PAY]: 'long_pay',
  // 通联四产品共用通联 Logo
  [ProductEnum.ALLIN_CLOUD]: 'allin_pay',
  [ProductEnum.ALLIN_CASHIER]: 'allin_pay',
  [ProductEnum.ALLIN_PAYFUND]: 'allin_pay',
  [ProductEnum.ALLIN_DIRECT]: 'allin_pay',
  // 收钱吧
  [ProductEnum.SHOUQIANBA]: 'shouqianba',
};
