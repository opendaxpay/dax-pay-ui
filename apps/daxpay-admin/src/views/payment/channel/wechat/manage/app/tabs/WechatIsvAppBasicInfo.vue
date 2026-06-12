<script lang="ts" setup>
  import type { WechatIsvApp } from '#/api/payment/wechatIsvApp.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { WechatIsvAppApi } from '#/api/payment/wechatIsvApp.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    app: WechatIsvApp;
  }>();

  const emit = defineEmits<{
    deleted: [];
  }>();

  const { message } = useMessage();
  const { openDeleteConfirm } = useDeleteConfirm();
  const { hasPermission } = usePermission();

  /** 应用类型展示文案 */
  const appTypeLabel = computed(() => {
    const typeKeyMap: Record<string, string> = {
      official_account: 'payment.channel.wechatManage.appTypeOfficialAccount',
      mini_program: 'payment.channel.wechatManage.appTypeMiniProgram',
      mobile_app: 'payment.channel.wechatManage.appTypeMobileApp',
    };
    const key = typeKeyMap[props.app.appType || ''];
    return key ? $t(key) : props.app.appType || '-';
  });

  function handleDelete() {
    openDeleteConfirm({
      name: props.app.appName || props.app.wxAppId || '',
      verificationText: props.app.wxAppId || '',
      title: $t('payment.channel.wechatManage.delete'),
      onConfirm: () =>
        WechatIsvAppApi.delete(props.app.id!).then(() => {
          message.success($t('payment.channel.wechatManage.deleteSuccess'));
          emit('deleted');
        }),
    });
  }
</script>

<template>
  <div class="basic-info-panel">
    <a-descriptions bordered :column="1" size="middle">
      <a-descriptions-item :label="$t('payment.channel.wechatManage.appName')">
        {{ app.appName || '-' }}
      </a-descriptions-item>
      <a-descriptions-item :label="$t('payment.channel.wechatManage.appType')">
        {{ appTypeLabel }}
      </a-descriptions-item>
      <a-descriptions-item :label="$t('payment.channel.wechatManage.wxAppId')">
        {{ app.wxAppId || '-' }}
      </a-descriptions-item>
    </a-descriptions>

    <div v-if="hasPermission(PermCodes.Payment.WechatIsv.EDIT)" class="basic-info-panel__actions">
      <a-button danger @click="handleDelete">{{ $t('payment.channel.wechatManage.delete') }}</a-button>
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
