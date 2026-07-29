<script lang="ts" setup>
  import type { DyPlatformApp } from '#/api/payment/douyin/platform-app.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { DyPlatformAppApi } from '#/api/payment/douyin/platform-app.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    app: DyPlatformApp;
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
      mini_program: 'payment.douyin.app.appTypeMiniProgram',
      mobile_app: 'payment.douyin.app.appTypeMobileApp',
      web_app: 'payment.douyin.app.appTypeWebApp',
    };
    const key = typeKeyMap[props.app.appType || ''];
    return key ? $t(key) : props.app.appType || '-';
  });

  function handleDelete() {
    openDeleteConfirm({
      name: props.app.appName || props.app.douyinAppId || '',
      verificationText: props.app.douyinAppId || '',
      title: $t('payment.douyin.app.delete'),
      onConfirm: () =>
        DyPlatformAppApi.delete(props.app.id!).then(() => {
          message.success($t('payment.douyin.app.deleteSuccess'));
          emit('deleted');
        }),
    });
  }
</script>

<template>
  <div class="basic-info-panel">
    <a-descriptions bordered :column="1" size="middle">
      <a-descriptions-item :label="$t('payment.douyin.app.appName')">
        {{ app.appName || '-' }}
      </a-descriptions-item>
      <a-descriptions-item :label="$t('payment.douyin.app.appType')">
        {{ appTypeLabel }}
      </a-descriptions-item>
      <a-descriptions-item :label="$t('payment.douyin.app.douyinAppId')">
        {{ app.douyinAppId || '-' }}
      </a-descriptions-item>
    </a-descriptions>

    <div v-if="hasPermission(PermCodes.Payment.Douyin.PlatformApp.MANAGE)" class="basic-info-panel__actions">
      <a-button danger @click="handleDelete">{{ $t('payment.douyin.app.delete') }}</a-button>
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
