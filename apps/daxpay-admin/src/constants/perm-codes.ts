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
    Notify: {
      ADD: 'system:notify:notice:add',
      PUBLISH: 'system:notify:notice:publish',
      VIEW: 'system:notify:notice:view',
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
