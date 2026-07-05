/**
 * 权限码常量（与后端 @PermCode 扫描结果 menuCode:code 保持一致）
 *
 * ## 方案阅读
 *
 * | 要点 | 说明 |
 * |------|------|
 * | 与后端对齐 | 值必须等于 @PermCode 扫描出的完整码 `menuCode:code` |
 * | 命名约定 | 全部使用下划线（`security_config` 非 `securityConfig`），键名用业务语义 |
 * | 粒度约定 | 标准为 `VIEW` + `MANAGE`（`MANAGE` 含增删改）；仅查看的只保留 `VIEW` |
 * | 特殊操作 | `PUBLISH`/`KICKOUT`/`RESET_PASSWORD`/`ASSIGN_ROLE`/`STATUS`/`SIGN`/`PAY`/`CREDENTIAL_CONFIG_UPDATE` 独立保留 |
 * | menu_code | 菜单注册（iam_perm_menu）用，**不**写入本文件 |
 * | 顶级域 | merchant / channel / payment / develop / device / iam / system 七域 |
 * | 使用方式 | 模板：`v-if="hasPermission(PermCodes....)"` / `hasAnyPermission([...])`（`usePermission`）；脚本：同上 |
 * | 已移除 | v-access 指令已删除，仅用 `usePermission` |
 */
export const PermCodes = {
  /** IAM 身份与访问 */
  Iam: {
    PermMenu: {
      VIEW: 'iam:perm:menu:view',
      MANAGE: 'iam:perm:menu:manage',
    },
    Role: {
      VIEW: 'iam:role:view',
      MANAGE: 'iam:role:manage',
    },
    UserManager: {
      VIEW: 'iam:user:manager:view',
      MANAGE: 'iam:user:manager:manage',
      RESET_PASSWORD: 'iam:user:manager:reset_password',
      ASSIGN_ROLE: 'iam:user:manager:assign_role',
      STATUS: 'iam:user:manager:status',
    },
    OnlineUser: {
      VIEW: 'iam:online:user:view',
      KICKOUT: 'iam:online:user:kickout',
    },
    Social: {
      VIEW: 'iam:social:config:view',
      MANAGE: 'iam:social:config:manage',
    },
  },

  /** 商户管理（独立顶级域） */
  Merchant: {
    /** 商户主体 menuCode=merchant:info */
    Info: {
      VIEW: 'merchant:info:view',
      MANAGE: 'merchant:info:manage',
    },
    /** 对接配置 menuCode=merchant:credential */
    Credential: {
      VIEW: 'merchant:credential:view',
      CREDENTIAL_CONFIG_UPDATE: 'merchant:credential:credential_config_update',
    },
    /** 通知配置 menuCode=merchant:notify_config */
    NotifyConfig: {
      VIEW: 'merchant:notify_config:view',
      UPDATE: 'merchant:notify_config:notify_config_update',
    },
    /** 商户应用 menuCode=merchant:app */
    App: {
      VIEW: 'merchant:app:view',
      MANAGE: 'merchant:app:manage',
    },
    /** 通道路由 menuCode=merchant:app:route */
    AppRoute: {
      VIEW: 'merchant:app:route:view',
      MANAGE: 'merchant:app:route:manage',
    },
    /** 门店 menuCode=merchant:store */
    Store: {
      VIEW: 'merchant:store:view',
      MANAGE: 'merchant:store:manage',
    },
    /** 商户用户 menuCode=merchant:user（预留，待 Controller 实现） */
    User: {
      VIEW: 'merchant:user:view',
      MANAGE: 'merchant:user:manage',
    },
  },

  /** 渠道管理（独立顶级域） */
  Channel: {
    /** 通道商户 menuCode=channel:merchant */
    Merchant: {
      VIEW: 'channel:merchant:view',
      MANAGE: 'channel:merchant:manage',
    },
    /** 支付宝直连应用 menuCode=channel:alipay:app */
    AlipayApp: {
      VIEW: 'channel:alipay:app:view',
      MANAGE: 'channel:alipay:app:manage',
    },
    /** 微信直连应用 menuCode=channel:wechat:app */
    WechatApp: {
      VIEW: 'channel:wechat:app:view',
      MANAGE: 'channel:wechat:app:manage',
    },
    /** 抖音直连应用 menuCode=channel:douyin:app */
    DouyinApp: {
      VIEW: 'channel:douyin:app:view',
      MANAGE: 'channel:douyin:app:manage',
    },
  },

  /** 支付核心（瘦身后：主数据 + 配置 + 服务商） */
  Payment: {
    /** 支付宝服务商 menuCode=payment:alipay:isv */
    AlipayIsv: {
      VIEW: 'payment:alipay:isv:view',
      MANAGE: 'payment:alipay:isv:manage',
    },
    /** 微信服务商 menuCode=payment:wechat:isv */
    WechatIsv: {
      VIEW: 'payment:wechat:isv:view',
      MANAGE: 'payment:wechat:isv:manage',
    },
    /** 拉卡拉服务商 menuCode=payment:lakala:isv */
    Lakala: {
      VIEW: 'payment:lakala:isv:view',
      MANAGE: 'payment:lakala:isv:manage',
    },
    /** 支付主数据 menuCode=payment:platform:* */
    Platform: {
      Product: {
        VIEW: 'payment:platform:product:view',
        MANAGE: 'payment:platform:product:manage',
      },
      Provider: {
        VIEW: 'payment:platform:provider:view',
        MANAGE: 'payment:platform:provider:manage',
      },
      PayChannel: {
        VIEW: 'payment:platform:pay_channel:view',
      },
      Capability: {
        VIEW: 'payment:platform:capability:view',
      },
    },
    /** 支付产品配置 menuCode=payment:config:product_config */
    ProductConfig: {
      VIEW: 'payment:config:product_config:view',
      MANAGE: 'payment:config:product_config:manage',
    },
    /** 普通支付业务订单 menuCode=payment:order */
    Order: {
      VIEW: 'payment:order:view',
      MANAGE: 'payment:order:manage',
    },
    /** 退款订单 menuCode=payment:refund */
    Refund: {
      VIEW: 'payment:refund:view',
      MANAGE: 'payment:refund:manage',
    },
    /** 资金交易凭证 menuCode=payment:trade */
    Trade: {
      VIEW: 'payment:trade:view',
      MANAGE: 'payment:trade:manage',
    },
  },

  /** 开发调试（独立顶级域） */
  Develop: {
    /** 支付调试 menuCode=develop:trade */
    Trade: {
      VIEW: 'develop:trade:view',
      SIGN: 'develop:trade:sign',
      PAY: 'develop:trade:pay',
    },
    /** 签名调试 menuCode=develop:sign */
    Sign: {
      VIEW: 'develop:sign:view',
    },
  },

  /** 设备管理（独立命名空间） */
  Device: {
    /** 云音箱 menuCode=device:speaker */
    Speaker: {
      VIEW: 'device:speaker:view',
      MANAGE: 'device:speaker:manage',
    },
    /** 云打印 menuCode=device:printer */
    Printer: {
      VIEW: 'device:printer:view',
      MANAGE: 'device:printer:manage',
    },
    /** 厂商配置 menuCode=device:vendor_config */
    VendorConfig: {
      VIEW: 'device:vendor_config:view',
      MANAGE: 'device:vendor_config:manage',
    },
  },

  /** 系统域 */
  System: {
    /** 字典（含字典项）menuCode=system:dict */
    Dict: {
      VIEW: 'system:dict:view',
      MANAGE: 'system:dict:manage',
    },
    /** 日志 menuCode=system:log:* */
    Log: {
      Login: {
        VIEW: 'system:log:login:view',
        MANAGE: 'system:log:login:manage',
      },
      Operate: {
        VIEW: 'system:log:operate:view',
        MANAGE: 'system:log:operate:manage',
      },
    },
    /** 通知中心 menuCode=system:notify → 公告通知 menuCode=system:notify:notice */
    Notify: {
      VIEW: 'system:notify:notice:view',
      MANAGE: 'system:notify:notice:manage',
      PUBLISH: 'system:notify:notice:publish',
    },
    /** 存储文件 menuCode=system:file:platform */
    FilePlatform: {
      VIEW: 'system:file:platform:view',
    },
    /** 平台配置 menuCode=system:platform_config */
    PlatformConfig: {
      VIEW: 'system:platform_config:view',
      MANAGE: 'system:platform_config:manage',
    },
    /** OSS 配置 menuCode=system:oss_config */
    OssConfig: {
      VIEW: 'system:oss_config:view',
      MANAGE: 'system:oss_config:manage',
    },
    /** 安全配置 menuCode=system:security_config */
    SecurityConfig: {
      VIEW: 'system:security_config:view',
      MANAGE: 'system:security_config:manage',
    },
    /** 用户协议 menuCode=system:protocol */
    Protocol: {
      VIEW: 'system:protocol:view',
      MANAGE: 'system:protocol:manage',
      PUBLISH: 'system:protocol:publish',
    },
  },
} as const;
