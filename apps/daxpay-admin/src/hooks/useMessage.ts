import { App, message, Modal, notification } from 'antdv-next';

let antdAppContext: null | ReturnType<typeof App.useApp> = null;

/**
 * 设置 antd App 上下文
 */
export function setAntdAppContext(appContext: ReturnType<typeof App.useApp>) {
  antdAppContext = appContext;
}

/**
 * 统一获取全局消息、通知和确认框能力
 */
export function useMessage() {
  /**
   * 确认框
   */
  function confirm(config: Parameters<typeof Modal.confirm>[0]) {
    if (antdAppContext) {
      return antdAppContext.modal.confirm(config);
    }
    return Modal.confirm(config);
  }

  return {
    confirm,
    message: antdAppContext?.message ?? message,
    notification: antdAppContext?.notification ?? notification,
  };
}
