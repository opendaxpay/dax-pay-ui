<script lang="ts" setup>
  import type { WechatMchApp } from '#/api/payment/channel/wechat/mch-app.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { WechatMchAppApi } from '#/api/payment/channel/wechat/mch-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    app: WechatMchApp;
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
      official_account: 'payment.channel.wechatMchApp.appTypeOfficialAccount',
      mini_program: 'payment.channel.wechatMchApp.appTypeMiniProgram',
      mobile_app: 'payment.channel.wechatMchApp.appTypeMobileApp',
    };
    const key = typeKeyMap[props.app.appType || ''];
    return key ? $t(key) : props.app.appType || '-';
  });

  function handleDelete() {
    openDeleteConfirm({
      name: props.app.appName || props.app.wxAppId || '',
      verificationText: props.app.wxAppId || '',
      title: $t('payment.channel.wechatMchApp.delete'),
      onConfirm: () =>
        WechatMchAppApi.delete(props.app.id!).then(() => {
          message.success($t('payment.channel.wechatMchApp.deleteSuccess'));
          emit('deleted');
        }),
    });
  }
</script>

<template>
  <div class="basic-info-panel">
    <a-descriptions bordered :column="1" size="middle">
      <a-descriptions-item :label="$t('payment.channel.wechatMchApp.appName')">
        {{ app.appName || '-' }}
      </a-descriptions-item>
      <a-descriptions-item :label="$t('payment.channel.wechatMchApp.appType')">
        {{ appTypeLabel }}
      </a-descriptions-item>
      <a-descriptions-item :label="$t('payment.channel.wechatMchApp.wxAppId')">
        {{ app.wxAppId || '-' }}
      </a-descriptions-item>
    </a-descriptions>

    <div v-if="hasPermission(PermCodes.Payment.ChannelMerchant.EDIT)" class="basic-info-panel__actions">
      <a-button danger @click="handleDelete">{{ $t('payment.channel.wechatMchApp.delete') }}</a-button>
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
