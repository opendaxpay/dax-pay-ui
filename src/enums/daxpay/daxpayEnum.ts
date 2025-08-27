/**
 * 支付通道
 */
export enum ChannelEnum {
  ALI = 'ali_pay',
  ALI_ISV = 'alipay_isv',
  WECHAT = 'wechat_pay',
  WECHAT_ISV = 'wechat_pay_isv',
  UNION_PAY = 'union_pay',
  LESHUA_PAY = 'leshua_pay',
  VBILL_PAY = 'vbill_pay',
  ADA_PAY = 'ada_pay',
  HKRT_PAY = 'hkrt_pay',
}

/**
 * 支付方式
 */
export enum PayMethodEnum {
  /** wap支付 */
  WAP = 'wap',
  /** 应用支付 */
  APP = 'app',
  /** web支付 */
  WEB = 'web',
  /** 扫码支付 */
  QRCODE = 'qrcode',
  /** 付款码 */
  BARCODE = 'barcode',
  /** 小程序支付 */
  JSAPI = 'jsapi',
  /** 其他支付 */
  OTHER = 'other',
}

/**
 * 交易类型
 */
export enum TradeTypeEnum {
  /**
   * 支付
   */
  PAY = 'pay',
  /**
   * 退款
   */
  REFUND = 'refund',
  /**
   * 转账
   */
  TRANSFER = 'transfer',
}

/**
 * 客户通知内容类型
 */
export enum NotifyContentTypeEnum {
  /** 支付订单变动通知 */
  PAY = 'pay',

  /** 退款订单变动通知 */
  REFUND = 'refund',

  /** 支付订单变动通知 */
  TRANSFER = 'transfer',
}

/**
 * 通道认证状态
 */
export enum ChannelAuthStatusEnum {
  /** 获取中 */
  WAITING = 'waiting',
  /** 获取成功 */
  SUCCESS = 'success',
  /** 数据不存在 */
  NOT_EXIST = 'not_exist',
}

/**
 * 收银台类型
 */
export enum CashierTypeEnum {
  WECHAT_PAY = 'wechat_pay',
  ALIPAY = 'alipay',
}

/**
 * 服务商状态枚举
 */
export enum IsvStatusEnum {
  /** 停用 */
  DISABLED = 'disabled',
  /** 启用 */
  ENABLED = 'enable',
}

/**
 * 商户状态枚举
 */
export enum MerchantStatusEnum {
  /** 禁用 */
  DISABLED = 'disabled',
  /** 启用 */
  ENABLED = 'enable',
}

/**
 * 代理商状态枚举
 */
export enum AgentStatusEnum {
  /** 启用 */
  DISABLED = 'disabled',
  /** 禁用 */
  ENABLED = 'enable',
}

/**
 * 乐刷分账能力开通状态枚举
 */
export enum LsAllocApplyStatusEnum {
  /** 草稿 */
  DRAFT = 'draft',
  /** 未开通 */
  NOT_OPENED = '0',
  /** 已开通 */
  OPENED = '1',
  /** 商户主动关闭 */
  MERCHANT_CLOSED = '2',
  /** 待审核 */
  PENDING_REVIEW = '3',
  /** 冻结 */
  FROZEN = '4',
  /** 注销 */
  CANCELLED = '5',
  /** 待签合同 */
  PENDING_CONTRACT = '6',
}

/**
 * 随行付分账能力开通状态枚举
 */
export enum VbillAllocApplyEnum {
  /** 草稿 */
  DRAFT = 'draft',
  /** 已发送链接, 未签约 */
  SEND_LINK = '00',
  /** 签约失败 */
  SIGN_FAIL = '01',
  /** 签约成功 */
  SIGN_SUCCESS = '02',
  /** 未签约 */
  NOT_SIGN = '03',
  /** 审批中 */
  APPROVAL = '04',
}

/**
 * 随行付分账能力开通类型枚举
 */
export enum VbillAllocSignTypeEnum {
  /** 接口签约 */
  INTERFACE_SIGN = '00',
  /** 短信签约 */
  SMS_SIGN = '01',
  /** 线下签约 */
  OFFLINE_SIGN = '02',
}

/**
 * 分账关系类型
 */
export enum AllocRelationTypeEnum {
  /** 服务商 */
  SERVICE_PROVIDER = 'service_provider',
  /** 门店 */
  STORE = 'store',
  /** 员工 */
  STAFF = 'staff',
  /** 店主 */
  STORE_OWNER = 'store_owner',
  /** 合作伙伴 */
  PARTNER = 'partner',
  /** 总部 */
  HEADQUARTER = 'headquarter',
  /** 品牌方 */
  BRAND = 'brand',
  /** 分销商 */
  DISTRIBUTOR = 'distributor',
  /** 用户 */
  USER = 'user',
  /** 供应商 */
  SUPPLIER = 'supplier',
  /** 自定义 */
  CUSTOM = 'custom',
}

/**
 * 分账接收方类型
 */
export enum AllocReceiverTypeEnum {
  /** 商户号 */
  MERCHANT_NO = 'merchant_no',
  /** userId */
  USER_ID = 'user_id',
  /** openId  */
  OPEN_ID = 'open_id',
  /** 账号 */
  LOGIN_NAME = 'login_name',
}

/**
 * 进件申请状态
 */
export enum IsvApplyStatusEnum {
  /** 草稿 */
  DRAFT = 'draft',
  /** 预审 = 暂时不用) */
  PRE_TRIAL = 'pre_trial',
  /** 预审拒绝 = 暂时不用) */
  PRE_TRIAL_REJECT = 'pre_trial_reject',
  /** 申请中 */
  APPLY = 'apply',
  /** 驳回 */
  REJECT = 'reject',
  /** 待签署 */
  SIGN = 'sign',
  /** 开通中 */
  OPENING = 'opening',
  /** 通过 */
  PASS = 'pass',
  /** 已生成进件商户 */
  GENERATED = 'generated',
  /** 关闭 */
  CLOSED = 'closed',
}
