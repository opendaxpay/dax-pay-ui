/**
 * 权限码常量（与后端 @PermCode 扫描结果 menuCode:code 保持一致）
 *
 * ## 方案阅读
 *
 * | 要点 | 说明 |
 * |------|------|
 * | 与后端对齐 | 值 = `menuCode:action`；后端 `platform.core.code.PermCodes`（MENU + Action，非完整码） |
 * | 命名 | 码字符串 kebab-case（`a-z0-9:-`）；TS 键 SCREAMING_SNAKE |
 * | 粒度 | 标准 `VIEW` + `MANAGE`（MANAGE 含增删改与配置保存）；无全局 update |
 * | 特殊操作 | PUBLISH / KICKOUT / RESET_PASSWORD / ASSIGN_ROLE / STATUS / SIGN / RESEND / TEST |
 * | 顶级域 | merchant / channel / payment / **trade** / develop / device / iam / system |
 * | 通道相关 | 商户 `channel:merchant`；应用 `channel:app`；ISV `payment:isv`（均不按通道拆） |
 * | 使用 | `hasPermission(PermCodes....)` / `hasAnyPermission([...])` |
 */
export const PermCodes = {
  /** IAM 身份与访问 */
  Iam: {
    Menu: {
      VIEW: 'iam:menu:view',
      MANAGE: 'iam:menu:manage',
    },
    Role: {
      VIEW: 'iam:role:view',
      MANAGE: 'iam:role:manage',
    },
    User: {
      VIEW: 'iam:user:view',
      MANAGE: 'iam:user:manage',
      RESET_PASSWORD: 'iam:user:reset-password',
      ASSIGN_ROLE: 'iam:user:assign-role',
      STATUS: 'iam:user:status',
    },
    Online: {
      VIEW: 'iam:online:view',
      KICKOUT: 'iam:online:kickout',
    },
    Social: {
      VIEW: 'iam:social:view',
      MANAGE: 'iam:social:manage',
    },
  },

  /** 商户管理 */
  Merchant: {
    Info: {
      VIEW: 'merchant:info:view',
      MANAGE: 'merchant:info:manage',
    },
    Credential: {
      VIEW: 'merchant:credential:view',
      MANAGE: 'merchant:credential:manage',
    },
    NotifyConfig: {
      VIEW: 'merchant:notify-config:view',
      MANAGE: 'merchant:notify-config:manage',
    },
    App: {
      VIEW: 'merchant:app:view',
      MANAGE: 'merchant:app:manage',
    },
    AppRoute: {
      VIEW: 'merchant:app:route:view',
      MANAGE: 'merchant:app:route:manage',
    },
    GatewayAggregate: {
      VIEW: 'merchant:gateway-aggregate:view',
      MANAGE: 'merchant:gateway-aggregate:manage',
    },
    /** 码牌支付策略配置 menuCode=merchant:gateway-code */
    GatewayCode: {
      VIEW: 'merchant:gateway-code:view',
      MANAGE: 'merchant:gateway-code:manage',
    },
    GatewayCashier: {
      VIEW: 'merchant:gateway-cashier:view',
      MANAGE: 'merchant:gateway-cashier:manage',
    },
    /** 易支付协议配置 menuCode=merchant:easypay */
    EasyPay: {
      VIEW: 'merchant:easypay:view',
      MANAGE: 'merchant:easypay:manage',
    },
    Store: {
      VIEW: 'merchant:store:view',
      MANAGE: 'merchant:store:manage',
    },
    /** 预留 */
    User: {
      VIEW: 'merchant:user:view',
      MANAGE: 'merchant:user:manage',
    },
    WxDomainVerify: {
      VIEW: 'merchant:wx-verify:view',
      MANAGE: 'merchant:wx-verify:manage',
    },
  },

  /** 渠道（通道商户 / 通道应用均统一码，不按通道拆） */
  Channel: {
    /** 通道商户 menuCode=channel:merchant */
    Merchant: {
      VIEW: 'channel:merchant:view',
      MANAGE: 'channel:merchant:manage',
    },
    /** 通道应用（直连 + 子商户应用等）menuCode=channel:app */
    App: {
      VIEW: 'channel:app:view',
      MANAGE: 'channel:app:manage',
    },
  },

  /** 支付平台（主数据 + 配置 + ISV） */
  Payment: {
    /** 服务商 ISV 配置（全通道共用）menuCode=payment:isv */
    Isv: {
      VIEW: 'payment:isv:view',
      MANAGE: 'payment:isv:manage',
    },
    Platform: {
      Product: {
        VIEW: 'payment:platform:product:view',
        MANAGE: 'payment:platform:product:manage',
      },
      /** 支付方式 */
      PayMethod: {
        VIEW: 'payment:platform:pay-method:view',
        MANAGE: 'payment:platform:pay-method:manage',
      },
      /** 支付渠道 */
      Provider: {
        VIEW: 'payment:platform:provider:view',
        MANAGE: 'payment:platform:provider:manage',
      },
      PayChannel: {
        VIEW: 'payment:platform:pay-channel:view',
      },
      Capability: {
        VIEW: 'payment:platform:capability:view',
      },
    },
    ProductConfig: {
      VIEW: 'payment:config:product-config:view',
      MANAGE: 'payment:config:product-config:manage',
    },
    Config: {
      WxDomainVerify: {
        VIEW: 'payment:config:wx-verify:view',
        MANAGE: 'payment:config:wx-verify:manage',
      },
    },
    /** 支付风控 */
    Risk: {
      Blacklist: {
        VIEW: 'payment:risk:blacklist:view',
        MANAGE: 'payment:risk:blacklist:manage',
      },
      Hit: {
        VIEW: 'payment:risk:hit:view',
        MANAGE: 'payment:risk:hit:manage',
      },
    },
  },

  /** 交易单据 */
  Trade: {
    Order: {
      VIEW: 'trade:order:view',
      MANAGE: 'trade:order:manage',
    },
    Refund: {
      VIEW: 'trade:refund:view',
      MANAGE: 'trade:refund:manage',
    },
    Fund: {
      VIEW: 'trade:fund:view',
      MANAGE: 'trade:fund:manage',
    },
    GatewayOrder: {
      VIEW: 'trade:gateway-order:view',
      MANAGE: 'trade:gateway-order:manage',
    },
  },

  Develop: {
    Trade: {
      VIEW: 'develop:trade:view',
      SIGN: 'develop:trade:sign',
    },
    Sign: {
      VIEW: 'develop:sign:view',
    },
    Auth: {
      VIEW: 'develop:auth:view',
    },
    Gateway: {
      VIEW: 'develop:gateway:view',
      SIGN: 'develop:gateway:sign',
    },
  },

  Device: {
    QrCode: {
      VIEW: 'device:qrcode:view',
      MANAGE: 'device:qrcode:manage',
    },
  },

  System: {
    Dict: {
      VIEW: 'system:dict:view',
      MANAGE: 'system:dict:manage',
    },
    Log: {
      Login: {
        VIEW: 'system:log:login:view',
        MANAGE: 'system:log:login:manage',
      },
      Operate: {
        VIEW: 'system:log:operate:view',
        MANAGE: 'system:log:operate:manage',
      },
      Unipay: {
        VIEW: 'system:log:unipay:view',
        MANAGE: 'system:log:unipay:manage',
      },
    },
    Notify: {
      VIEW: 'system:notify:notice:view',
      MANAGE: 'system:notify:notice:manage',
      PUBLISH: 'system:notify:notice:publish',
    },
    WechatNotify: {
      MANAGE: 'system:notify:wechat-config:manage',
      VIEW: 'system:notify:wechat-config:view',
      RESEND: 'system:notify:wechat-config:resend',
      TEST: 'system:notify:wechat-config:test',
    },
    File: {
      VIEW: 'system:file:view',
    },
    PlatformConfig: {
      VIEW: 'system:platform-config:view',
      MANAGE: 'system:platform-config:manage',
    },
    OssConfig: {
      VIEW: 'system:oss-config:view',
      MANAGE: 'system:oss-config:manage',
    },
    SecurityConfig: {
      VIEW: 'system:security-config:view',
      MANAGE: 'system:security-config:manage',
    },
    Protocol: {
      VIEW: 'system:protocol:view',
      MANAGE: 'system:protocol:manage',
      PUBLISH: 'system:protocol:publish',
    },
    /** 敏感词词库 */
    SensitiveWord: {
      VIEW: 'system:sensitive-word:view',
      MANAGE: 'system:sensitive-word:manage',
    },
    /** 敏感词命中记录 */
    SensitiveWordHit: {
      VIEW: 'system:sensitive-word-hit:view',
    },
  },
} as const;
