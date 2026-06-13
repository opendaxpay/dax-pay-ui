/**
 * 权限码常量（与后端 @PermCode 扫描结果 menuCode:code 保持一致）
 *
 * ## 方案阅读
 *
 * | 要点 | 说明 |
 * |------|------|
 * | 与后端对齐 | 值必须等于 @PermCode 扫描出的完整码 `menuCode:code` |
 * | 命名约定 | `PermCodes.域.功能.{VIEW\|EDIT\|ADD\|...}`，键名用业务语义 |
 * | menu_code | 菜单注册（iam_perm_menu）用，**不**写入本文件 |
 * | 方案 B | `AppPayRoute` 表示应用通道路由，与商户主体 `Merchant` 同级 |
 * | 使用方式 | 模板：`v-if="hasPermission(PermCodes....)"` / `hasAnyPermission([...])`（`usePermission`）；脚本：同上 |
 * | 已移除 | v-access 指令已删除，仅用 `usePermission` |
 */
export const PermCodes = {
  /** IAM 身份与访问 */
  Iam: {
    PermMenu: {
      MANAGE: 'iam:perm:menu:manage',
      VIEW: 'iam:perm:menu:view',
    },
    Role: {
      MANAGE: 'iam:role:manage',
      VIEW: 'iam:role:view',
    },
    UserManager: {
      ADD: 'iam:user:manager:add',
      EDIT: 'iam:user:manager:edit',
      VIEW: 'iam:user:manager:view',
      STATUS: 'iam:user:manager:status',
      RESET_PASSWORD: 'iam:user:manager:resetPassword',
      ASSIGN_ROLE: 'iam:user:manager:assignRole',
    },
    OnlineUser: {
      KICKOUT: 'iam:online:user:kickout',
    },
  },

  /** 支付域 */
  Payment: {
    /** 商户主体 menuCode=payment:merchant */
    Merchant: {
      ADD: 'payment:merchant:add',
      VIEW: 'payment:merchant:view',
      EDIT: 'payment:merchant:edit',
      CREDENTIAL_CONFIG_UPDATE: 'payment:merchant:credential_config_update',
      PRODUCT_CONFIG_UPDATE: 'payment:merchant:product_config_update',
    },
    /** 应用通道路由 menuCode=payment:merchant:app:payRoute（方案 B） */
    AppPayRoute: {
      VIEW: 'payment:merchant:app:payRoute:view',
      EDIT: 'payment:merchant:app:payRoute:edit',
    },
    /** 支付宝服务商通道 menuCode=payment:alipay:isv */
    AlipayIsv: {
      ADD: 'payment:alipay:isv:add',
      VIEW: 'payment:alipay:isv:view',
      EDIT: 'payment:alipay:isv:edit',
    },
    /** 微信服务商通道 menuCode=payment:wechat:isv */
    WechatIsv: {
      ADD: 'payment:wechat:isv:add',
      VIEW: 'payment:wechat:isv:view',
      EDIT: 'payment:wechat:isv:edit',
    },
    /** 通道商户 menuCode=payment:merchant:channelMerchant */
    ChannelMerchant: {
      ADD: 'payment:merchant:channelMerchant:add',
      EDIT: 'payment:merchant:channelMerchant:edit',
      DELETE: 'payment:merchant:channelMerchant:delete',
      VIEW: 'payment:merchant:channelMerchant:view',
    },
  },

  /** 风控域 */
  Risk: {
    Model: {
      ADD: 'risk:model:add',
      VIEW: 'risk:model:view',
      EDIT: 'risk:model:edit',
      DELETE: 'risk:model:delete',
    },
    /** 模型管理 menuCode=risk:model:manage */
    ModelManage: {
      ADD: 'risk:model:manage:add',
      VIEW: 'risk:model:manage:view',
      EDIT: 'risk:model:manage:edit',
      DELETE: 'risk:model:manage:delete',
      /** 策略节点 menuCode=risk:model:manage:strategyNode */
      StrategyNode: {
        VIEW: 'risk:model:manage:strategyNode:view',
        ADD: 'risk:model:manage:strategyNode:add',
        EDIT: 'risk:model:manage:strategyNode:edit',
        DELETE: 'risk:model:manage:strategyNode:delete',
      },
      /** 规则配置 menuCode=risk:model:manage:strategyRule */
      StrategyRule: {
        VIEW: 'risk:model:manage:strategyRule:view',
        ADD: 'risk:model:manage:strategyRule:add',
        EDIT: 'risk:model:manage:strategyRule:edit',
        DELETE: 'risk:model:manage:strategyRule:delete',
      },
    },
    ModelInstance: {
      ADD: 'risk:model:instance:add',
      VIEW: 'risk:model:instance:view',
      EDIT: 'risk:model:instance:edit',
      DELETE: 'risk:model:instance:delete',
    },
    InputParamSet: {
      ADD: 'risk:inputParamSet:add',
      VIEW: 'risk:inputParamSet:view',
      EDIT: 'risk:inputParamSet:edit',
      DELETE: 'risk:inputParamSet:delete',
    },
    DataSourceDef: {
      ADD: 'risk:dataSourceDef:add',
      VIEW: 'risk:dataSourceDef:view',
      EDIT: 'risk:dataSourceDef:edit',
      DELETE: 'risk:dataSourceDef:delete',
      MANAGE: 'risk:dataSourceDef:manage',
    },
  },

  /** 系统域 */
  System: {
    Dict: {
      MANAGE: 'system:dict:dict:manage',
      VIEW: 'system:dict:dict:view',
    },
    DictItem: {
      MANAGE: 'system:dict:item:manage',
      VIEW: 'system:dict:item:view',
    },
    FilePlatform: {
      VIEW: 'system:file:platform:view',
    },
  },

  /** 日志域 */
  Log: {
    Operate: {
      MANAGE: 'starter:log:operate:manage',
      VIEW: 'starter:log:operate:view',
    },
    Login: {
      MANAGE: 'starter:log:login:manage',
      VIEW: 'starter:log:login:view',
    },
  },
} as const;
