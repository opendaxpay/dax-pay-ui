<script lang="ts" setup>
  import type { AlipayMchApp } from '#/api/payment/channel/alipay/mch-app.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  // 支付宝渠道色值
  const alipayColor = '#1677ff';
  const alipaySvgUrl = getProviderSvgUrl('alipay');

  const props = defineProps<{
    record: AlipayMchApp;
  }>();

  /** 应用类型展示文案 */
  const appTypeLabel = computed(() => {
    const typeKeyMap: Record<string, string> = {
      mini_program: 'payment.channel.alipayMchApp.appTypeMiniProgram',
      mobile_app: 'payment.channel.alipayMchApp.appTypeMobileApp',
      web_app: 'payment.channel.alipayMchApp.appTypeWebApp',
    };
    const key = typeKeyMap[props.record.appType || ''];
    return key ? $t(key) : props.record.appType || '-';
  });

  const emit = defineEmits<{
    edit: [];
    manage: [];
  }>();

  const { hasPermission } = usePermission();
</script>

<template>
  <div
    class="alipay-mch-app-card group flex h-full min-h-[128px] flex-col rounded-xl border bg-card shadow-sm"
  >
    <div class="card-body flex flex-1 items-center gap-3 px-4 py-4">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
        :style="{ backgroundColor: `${alipayColor}1a` }"
      >
        <img v-if="alipaySvgUrl" :src="alipaySvgUrl" class="w-6 h-6" alt="alipay" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="truncate text-base font-semibold leading-snug text-foreground">
            {{ record.appName || '-' }}
          </span>
        </div>
        <div class="mt-1.5 truncate text-xs text-muted-foreground">
          {{ $t('payment.channel.alipayMchApp.aliAppIdPrefix', { appId: record.aliAppId || '-' }) }}
        </div>
        <div class="mt-0.5 truncate text-xs text-muted-foreground">
          {{ $t('payment.channel.alipayMchApp.appTypePrefix', { type: appTypeLabel }) }}
        </div>
      </div>
    </div>

    <div class="card-footer flex shrink-0 items-center justify-end border-t border-border px-3 py-1.5">
      <div class="flex items-center">
        <a-tooltip
          v-if="hasPermission(PermCodes.Channel.App.MANAGE)"
          :title="$t('payment.channel.alipayMchApp.edit')"
        >
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
        <a-tooltip
          v-if="hasPermission(PermCodes.Channel.App.MANAGE)"
          :title="$t('payment.channel.alipayMchApp.actionMore')"
        >
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
  .alipay-mch-app-card {
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .alipay-mch-app-card:hover {
    border-color: hsl(var(--primary) / 0.4);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
    transform: translateY(-4px);
  }
</style>
