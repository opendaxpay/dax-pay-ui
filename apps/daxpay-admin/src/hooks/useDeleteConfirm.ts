import { reactive } from 'vue';

import { $t } from '@vben/locales';

/** 打开高危删除确认 */
export interface DeleteConfirmOptions {
  /** 资源展示名（描述区加粗） */
  name: string;
  /** 用户必须完整输入的校验串（必填） */
  verificationText: string;
  /** 弹窗标题，默认 components.deleteConfirm.title */
  title?: string;
  /** 描述文案 i18n key，默认 components.deleteConfirm.description */
  descriptionKey?: string;
  /** 传给 description 的额外参数（合并 name） */
  descriptionParams?: Record<string, string>;
  /** 确认后执行，支持 Promise；成功后才关闭弹窗 */
  onConfirm: () => Promise<void> | void;
  /** 取消/关闭时可选回调 */
  onCancel?: () => void;
  /** 为 true 时跳过最终 Modal.confirm（默认需要最终确认） */
  skipFinalConfirm?: boolean;
}

const DEFAULT_DESCRIPTION_KEY = 'components.deleteConfirm.description';

/** 全局单例状态，供 DeleteConfirmModal 绑定 */
export const deleteConfirmState = reactive({
  visible: false,
  // 国际化：确认删除标题
  title: $t('components.deleteConfirm.title'),
  name: '',
  verificationText: '',
  descriptionKey: DEFAULT_DESCRIPTION_KEY,
  descriptionParams: {} as Record<string, string>,
  confirmLoading: false,
  skipFinalConfirm: false,
  onConfirm: null as (() => Promise<void> | void) | null,
  onCancel: null as (() => void) | null,
});

/**
 * 关闭弹窗并清空回调
 */
export function closeDeleteConfirm() {
  deleteConfirmState.visible = false;
  deleteConfirmState.confirmLoading = false;
  deleteConfirmState.skipFinalConfirm = false;
  deleteConfirmState.onConfirm = null;
  deleteConfirmState.onCancel = null;
  deleteConfirmState.name = '';
  deleteConfirmState.verificationText = '';
  deleteConfirmState.descriptionParams = {};
  deleteConfirmState.descriptionKey = DEFAULT_DESCRIPTION_KEY;
  // 国际化：确认删除标题
  deleteConfirmState.title = $t('components.deleteConfirm.title');
}

/**
 * 高危删除二次确认
 */
export function useDeleteConfirm() {
  /**
   * 打开删除确认弹窗
   */
  function openDeleteConfirm(options: DeleteConfirmOptions) {
    deleteConfirmState.name = options.name;
    deleteConfirmState.verificationText = options.verificationText;
    deleteConfirmState.descriptionKey = options.descriptionKey ?? DEFAULT_DESCRIPTION_KEY;
    deleteConfirmState.descriptionParams = { ...options.descriptionParams };
    // 国际化：确认删除标题
    deleteConfirmState.title = options.title ?? $t('components.deleteConfirm.title');
    deleteConfirmState.onConfirm = options.onConfirm;
    deleteConfirmState.onCancel = options.onCancel ?? null;
    deleteConfirmState.skipFinalConfirm = options.skipFinalConfirm ?? false;
    deleteConfirmState.confirmLoading = false;
    deleteConfirmState.visible = true;
  }

  return {
    openDeleteConfirm,
  };
}
