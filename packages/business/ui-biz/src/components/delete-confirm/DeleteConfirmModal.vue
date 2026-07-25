<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { closeDeleteConfirm, deleteConfirmState } from '../../hooks/useDeleteConfirm';
  import { useMessage } from '../../hooks/useMessage';

  const { confirm } = useMessage();

  // 用户输入的校验内容
  const inputValue = ref('');

  /** 输入是否与校验串完全一致 */
  const matched = computed(
    () => inputValue.value === deleteConfirmState.verificationText,
  );

  /** 描述区 i18n 参数 */
  const descriptionParams = computed(() => ({
    name: deleteConfirmState.name,
    ...deleteConfirmState.descriptionParams,
  }));

  watch(
    () => deleteConfirmState.visible,
    (visible) => {
      if (!visible) {
        inputValue.value = '';
      }
    },
  );

  /**
   * 取消或关闭
   */
  function handleCancel() {
    deleteConfirmState.onCancel?.();
    closeDeleteConfirm();
  }

  /**
   * 执行删除回调
   */
  async function executeDelete() {
    if (!deleteConfirmState.onConfirm) {
      return;
    }
    deleteConfirmState.confirmLoading = true;
    try {
      await deleteConfirmState.onConfirm();
      closeDeleteConfirm();
    } finally {
      deleteConfirmState.confirmLoading = false;
    }
  }

  /**
   * 确认删除（校验通过后弹出最终确认，再执行删除）
   */
  function handleOk() {
    if (!matched.value || !deleteConfirmState.onConfirm) {
      return;
    }
    if (deleteConfirmState.skipFinalConfirm) {
      executeDelete();
      return;
    }
    confirm({
      title: $t('components.deleteConfirm.finalTitle'),
      content: $t('components.deleteConfirm.finalContent', { name: deleteConfirmState.name }),
      okText: $t('components.deleteConfirm.confirmDelete'),
      cancelText: $t('common.cancelText'),
      okType: 'danger',
      zIndex: 2100,
      maskClosable: false,
      onOk: () => executeDelete(),
    });
  }
</script>

<template>
  <a-modal
    :open="deleteConfirmState.visible"
    :title="deleteConfirmState.title"
    :z-index="2000"
    :mask-closable="false"
    :keyboard="false"
    destroy-on-hidden
    :width="560"
    @cancel="handleCancel"
  >
    <div class="delete-confirm-body">
      <!-- 国际化：主警示 -->
      <div class="delete-confirm-alert delete-confirm-alert--primary">
        {{ $t('components.deleteConfirm.primaryWarning') }}
      </div>

      <div class="delete-confirm-alert delete-confirm-alert--detail">
        <p class="delete-confirm-desc">
          {{ $t(deleteConfirmState.descriptionKey, descriptionParams) }}
        </p>
        <!-- 国际化：输入校验说明 -->
        <p class="delete-confirm-instruction">
          {{ $t('components.deleteConfirm.instruction') }}
        </p>
        <code class="delete-confirm-verify-text">{{ deleteConfirmState.verificationText }}</code>
      </div>

      <a-input
        v-model:value="inputValue"
        :placeholder="$t('components.deleteConfirm.inputPlaceholder')"
        autocomplete="off"
        @press-enter="matched && handleOk()"
      />
    </div>

    <template #footer>
      <a-button @click="handleCancel">{{ $t('common.cancelText') }}</a-button>
      <a-button
        type="primary"
        danger
        :disabled="!matched"
        :loading="deleteConfirmState.confirmLoading"
        @click="handleOk"
      >
        {{ $t('components.deleteConfirm.confirmDelete') }}
      </a-button>
    </template>
  </a-modal>
</template>

<style scoped>
  .delete-confirm-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .delete-confirm-alert {
    padding: 10px 12px;
    border: 1px solid var(--ant-color-error);
    border-radius: var(--ant-border-radius);
    background: var(--ant-color-error-bg);
    color: var(--ant-color-error);
    font-size: 14px;
    line-height: 1.6;
  }

  .delete-confirm-alert--detail {
    color: var(--ant-color-text);
  }

  .delete-confirm-desc {
    margin: 0 0 8px;
  }

  .delete-confirm-instruction {
    margin: 0 0 8px;
    color: var(--ant-color-text-secondary);
  }

  .delete-confirm-verify-text {
    display: inline-block;
    padding: 2px 4px;
    border-bottom: 2px dotted var(--ant-color-error);
    background: transparent;
    color: var(--ant-color-text);
    font-size: 14px;
    font-weight: 600;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
      'Courier New', monospace;
    word-break: break-all;
  }
</style>
