<script lang="ts" setup>
  import type { AlipayIsvApp } from '#/api/payment/channel/alipay/isv-app.api';

  import { $t } from '@vben/locales';

  import { AlipayIsvAppApi } from '#/api/payment/channel/alipay/isv-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    app: AlipayIsvApp;
  }>();

  const emit = defineEmits<{
    deleted: [];
  }>();

  const { message } = useMessage();
  const { openDeleteConfirm } = useDeleteConfirm();
  const { hasPermission } = usePermission();

  /**
   * 删除应用
   */
  function handleDelete() {
    openDeleteConfirm({
      name: props.app.appName || props.app.aliAppId || '',
      verificationText: props.app.aliAppId || '',
      // 国际化：删除
      title: $t('payment.channel.alipayManage.delete'),
      onConfirm: () =>
        AlipayIsvAppApi.delete(props.app.id!).then(() => {
          message.success($t('payment.channel.alipayManage.deleteSuccess'));
          emit('deleted');
        }),
    });
  }
</script>

<template>
  <div class="basic-info-panel">
    <a-descriptions bordered :column="1" size="middle">
      <!-- 应用名称 -->
      <a-descriptions-item :label="$t('payment.channel.alipayManage.appName')">
        {{ app.appName || '-' }}
      </a-descriptions-item>
      <!-- 应用 ID -->
      <a-descriptions-item :label="$t('payment.channel.alipayManage.aliAppId')">
        {{ app.aliAppId || '-' }}
      </a-descriptions-item>
    </a-descriptions>

    <div v-if="hasPermission(PermCodes.Payment.AlipayIsv.EDIT)" class="basic-info-panel__actions">
      <!-- 国际化：删除 -->
      <a-button danger @click="handleDelete">{{ $t('payment.channel.alipayManage.delete') }}</a-button>
    </div>
  </div>
</template>

<style scoped>
  .basic-info-panel {
    padding: 4px 0;
  }

  .basic-info-panel__actions {
    margin-top: 24px;
  }
</style>
