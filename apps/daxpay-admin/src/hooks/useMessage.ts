import { $t } from '@vben/locales';

import { App, message, Modal, notification } from 'antdv-next';

/** Modal 静态方法配置类型（confirm / info / warning / error / success 共用） */
type ModalConfig = Parameters<typeof Modal.confirm>[0];

let antdAppContext: null | ReturnType<typeof App.useApp> = null;

/**
 * 设置 antd App 上下文
 */
export function setAntdAppContext(appContext: ReturnType<typeof App.useApp>) {
  antdAppContext = appContext;
}

/**
 * 为确认框注入默认 title / okText / cancelText
 * 调用方显式传入则覆盖；undefined 不冲掉默认值
 */
function withConfirmDefaults(config: ModalConfig): ModalConfig {
  const { title, okText, cancelText, ...rest } = config;
  return {
    ...rest,
    // 国际化：提示（与退出登录等通用二次确认一致）
    title: title ?? $t('common.prompt'),
    // 国际化：确定
    okText: okText ?? $t('common.okText'),
    // 国际化：取消
    cancelText: cancelText ?? $t('common.cancelText'),
  };
}

/**
 * 为单按钮结果弹窗注入默认 title / okText
 */
function withAlertDefaults(config: ModalConfig, defaultTitleKey: string): ModalConfig {
  const { title, okText, ...rest } = config;
  return {
    ...rest,
    title: title ?? $t(defaultTitleKey),
    // 国际化：确定
    okText: okText ?? $t('common.okText'),
  };
}

/**
 * 统一获取全局消息、通知和确认框能力
 *
 * 弹窗标题约定：
 * - confirm 默认 common.prompt（提示）
 * - info 默认 common.prompt（提示）
 * - warning 默认 common.warning（警告）
 * - error 默认 common.error（错误）
 * - success 默认 common.success（成功）
 * 业务语义强时由调用方显式传 title 覆盖
 */
export function useMessage() {
  /**
   * 确认框（二次确认）
   */
  function confirm(config: ModalConfig) {
    const merged = withConfirmDefaults(config);
    if (antdAppContext) {
      return antdAppContext.modal.confirm(merged);
    }
    return Modal.confirm(merged);
  }

  /**
   * 提示信息框
   */
  function info(config: ModalConfig) {
    // 国际化：提示
    const merged = withAlertDefaults(config, 'common.prompt');
    if (antdAppContext) {
      return antdAppContext.modal.info(merged);
    }
    return Modal.info(merged);
  }

  /**
   * 警告信息框
   */
  function warning(config: ModalConfig) {
    // 国际化：警告
    const merged = withAlertDefaults(config, 'common.warning');
    if (antdAppContext) {
      return antdAppContext.modal.warning(merged);
    }
    return Modal.warning(merged);
  }

  /**
   * 错误信息框
   */
  function error(config: ModalConfig) {
    // 国际化：错误
    const merged = withAlertDefaults(config, 'common.error');
    if (antdAppContext) {
      return antdAppContext.modal.error(merged);
    }
    return Modal.error(merged);
  }

  /**
   * 成功信息框
   */
  function success(config: ModalConfig) {
    // 国际化：成功
    const merged = withAlertDefaults(config, 'common.success');
    if (antdAppContext) {
      return antdAppContext.modal.success(merged);
    }
    return Modal.success(merged);
  }

  return {
    confirm,
    info,
    warning,
    error,
    success,
    message: antdAppContext?.message ?? message,
    notification: antdAppContext?.notification ?? notification,
  };
}
