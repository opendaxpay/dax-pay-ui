<script lang="ts" setup>
  import type { AlipayMchApp } from '#/api/payment/channel/alipay/mch-app.api';

  import { $t } from '@vben/locales';

  import { AlipayMchAppApi } from '#/api/payment/channel/alipay/mch-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    app: AlipayMchApp;
  }>();

  const emit = defineEmits<{
    deleted: [];
  }>();

  const { message } = useMessage();
  const { openDeleteConfirm } = useDeleteConfirm();
  const { hasPermission } = usePermission();

  /** 删除应用 */
  function handleDelete() {
    openDeleteConfirm({
      name: props.app.appName || props.app.aliAppId || '',
      verificationText: props.app.aliAppId || '',
      title: $t('payment.channel.alipayMchApp.delete'),
      onConfirm: () =>
        AlipayMchAppApi.delete(props.app.id!).then(() => {
          message.success($t('payment.channel.alipayMchApp.deleteSuccess'));
          emit('deleted');
        }),
    });
  }
</script>

<template>
  <div class="basic-info-panel">
    <a-descriptions bordered :column="1" size="middle">
      <a-descriptions-item :label="$t('payment.channel.alipayMchApp.appName')">
        {{ app.appName || '-' }}
      </a-descriptions-item>
      <a-descriptions-item :label="$t('payment.channel.alipayMchApp.aliAppId')">
        {{ app.aliAppId || '-' }}
      </a-descriptions-item>
    </a-descriptions>

    <div v-if="hasPermission(PermCodes.Channel.App.MANAGE)" class="basic-info-panel__actions">
      <a-button danger @click="handleDelete">{{ $t('payment.channel.alipayMchApp.delete') }}</a-button>
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
