import { ChannelEnum } from './channelEnum';

/**
 * 支付产品枚举
 */
export enum ProductEnum {
  /** 汇付天下 */
  ADA_PAY = 'ada_pay',
  /** 支付宝(直连) */
  ALIPAY = 'alipay',
  /** 支付宝(服务商) */
  ALIPAY_ISV = 'alipay_isv',
  /** 斗拱(汇付天下) */
  DOUGONG_PAY = 'dougong_pay',
  /** 抖音支付(直连) */
  DOUYIN_PAY = 'douyin_pay',
  /** 富友支付 */
  FUYOU_PAY = 'fuyou_pay',
  /** 海科融通支付 */
  HKRT_PAY = 'hkrt_pay',
  /** 河马付(杉德旗下产品) */
  HM_PAY = 'hm_pay',
  /** 拉卡拉支付 */
  LAKALA_PAY = 'lakala_pay',
  /** 乐刷支付 */
  LESHUA_PAY = 'leshua_pay',
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
  /** 随行付 */
  VBILL_PAY = 'vbill_pay',
  /** 微信支付(服务商) */
  WECHAT_ISV = 'wechat_isv',
  /** 微信支付(直连) */
  WECHAT_PAY = 'wechat_pay',
}

/**
 * 支付产品国际化Key映射
 */
export const productI18nMap: Record<string, string> = {
  [ProductEnum.ALIPAY_ISV]: 'payment.product.enum.alipayIsv',
  // 国际化：支付宝(直连)产品
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
  [ProductEnum.LAKALA_PAY]: 'payment.product.enum.lakalaPay',
  [ProductEnum.LESHUA_PAY]: 'payment.product.enum.leshuaPay',
  [ProductEnum.ADA_PAY]: 'payment.product.enum.adaPay',
  [ProductEnum.DOUGONG_PAY]: 'payment.product.enum.dougongPay',
  // 国际化：海科融通支付产品
  [ProductEnum.HKRT_PAY]: 'payment.product.enum.hkrtPay',
  // 国际化：随行付支付产品
  [ProductEnum.VBILL_PAY]: 'payment.product.enum.vbillPay',
  // 国际化：河马付(杉德旗下产品)
  [ProductEnum.HM_PAY]: 'payment.product.enum.hmPay',
  // 国际化：富友支付产品
  [ProductEnum.FUYOU_PAY]: 'payment.product.enum.fuyouPay',
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
  [ProductEnum.LAKALA_PAY]: '拉卡拉支付',
  [ProductEnum.LESHUA_PAY]: '乐刷支付',
  [ProductEnum.ADA_PAY]: '汇付天下',
  [ProductEnum.DOUGONG_PAY]: '斗拱',
  [ProductEnum.HKRT_PAY]: '海科融通支付',
  [ProductEnum.VBILL_PAY]: '随行付',
  // 河马付(杉德旗下聚合支付产品)
  [ProductEnum.HM_PAY]: '河马付',
  // 富友支付
  [ProductEnum.FUYOU_PAY]: '富友支付',
};

/**
 * 产品关联通道映射
 */
export const productChannelMap: Record<string, string> = {
  [ProductEnum.ALIPAY_ISV]: ChannelEnum.ALIPAY,
  [ProductEnum.ALIPAY]: ChannelEnum.ALIPAY,
  [ProductEnum.WECHAT_ISV]: ChannelEnum.WECHAT,
  [ProductEnum.WECHAT_PAY]: ChannelEnum.WECHAT,
  [ProductEnum.DOUYIN_PAY]: ChannelEnum.DOUYIN_PAY,
  [ProductEnum.UMS_QRCODE]: ChannelEnum.UMS_PAY,
  [ProductEnum.UMS_JSAPI]: ChannelEnum.UMS_PAY,
  [ProductEnum.UMS_APP]: ChannelEnum.UMS_PAY,
  [ProductEnum.UMS_MINI]: ChannelEnum.UMS_PAY,
  [ProductEnum.UMS_H5]: ChannelEnum.UMS_PAY,
  [ProductEnum.UMS_BARCODE]: ChannelEnum.UMS_PAY,
  [ProductEnum.LAKALA_PAY]: ChannelEnum.LAKALA_PAY,
  [ProductEnum.LESHUA_PAY]: ChannelEnum.LESHUA_PAY,
  [ProductEnum.ADA_PAY]: ChannelEnum.ADA_PAY,
  [ProductEnum.DOUGONG_PAY]: ChannelEnum.DOUGONG_PAY,
  [ProductEnum.HKRT_PAY]: ChannelEnum.HKRT_PAY,
  [ProductEnum.VBILL_PAY]: ChannelEnum.VBILL_PAY,
  // 河马付归属杉德通道
  [ProductEnum.HM_PAY]: ChannelEnum.SAND_PAY,
  // 富友支付
  [ProductEnum.FUYOU_PAY]: ChannelEnum.FUYOU_PAY,
};

/**
 * 支付产品独立Logo文件映射（覆盖所属通道Logo）
 * key为产品编码，value为assets/channel/目录下的SVG文件名（不含扩展名）
 * 未在此映射中的产品，回退使用所属通道的Logo（见 channelLogoMap）
 */
export const productLogoMap: Record<string, string> = {
  // 河马付(杉德旗下聚合支付产品)有独立品牌Logo
  [ProductEnum.HM_PAY]: 'hm_pay',
};
