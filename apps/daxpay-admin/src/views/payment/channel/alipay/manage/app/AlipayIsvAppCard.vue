<script lang="ts" setup>
  import type { AlipayIsvApp } from '#/api/payment/alipayIsvApp.api';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { findPayProviderDisplay } from '#/views/payment/shared/payProviderDisplay';

  // 支付宝品牌图标与色值（与支付渠道展示一致）
  const alipayDisplay = findPayProviderDisplay('alipay');
  const alipayIcon = alipayDisplay?.icon ?? 'simple-icons:alipay';
  const alipayColor = alipayDisplay?.color ?? '#1677ff';

  defineProps<{
    record: AlipayIsvApp;
  }>();

  const emit = defineEmits<{
    edit: [];
    manage: [];
  }>();

  const { hasPermission } = usePermission();
</script>

<template>
  <div
    class="alipay-isv-app-card group flex h-full min-h-[128px] flex-col rounded-xl border bg-card shadow-sm"
  >
    <!-- 卡片主体 -->
    <div class="card-body flex flex-1 items-center gap-3 px-4 py-4">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
        :style="{ backgroundColor: `${alipayColor}1a` }"
      >
        <IconifyIcon :icon="alipayIcon" class="text-2xl" :style="{ color: alipayColor }" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="truncate text-base font-semibold leading-snug text-foreground">
            {{ record.appName || '-' }}
          </span>
        </div>
        <div class="mt-1.5 truncate text-xs text-muted-foreground">
          {{ $t('payment.channel.alipayManage.aliAppIdPrefix', { appId: record.aliAppId || '-' }) }}
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="card-footer flex shrink-0 items-center justify-end border-t border-border px-3 py-1.5">
      <div class="flex items-center">
        <a-tooltip v-if="hasPermission(PermCodes.Payment.AlipayIsv.EDIT)" :title="$t('payment.channel.alipayManage.edit')">
          <a-button
            type="text"
            size="small"
            class="!h-6 !w-6 !min-w-6 !p-0 !text-muted-foreground hover:!text-primary"
            @click="emit('edit')"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:edit-outlined" class="text-sm" />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip v-if="hasPermission(PermCodes.Payment.AlipayIsv.EDIT)" :title="$t('payment.channel.alipayManage.actionMore')">
          <a-button
            type="text"
            size="small"
            class="!h-6 !w-6 !min-w-6 !p-0 !text-muted-foreground hover:!text-primary"
            @click="emit('manage')"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:menu-outlined" class="text-sm" />
            </template>
          </a-button>
        </a-tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .alipay-isv-app-card {
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .alipay-isv-app-card:hover {
    border-color: hsl(var(--primary) / 0.4);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
    transform: translateY(-4px);
  }
</style>
