<script lang="ts" setup>
  import type { WxPlatformApp } from '#/api/payment/wx/platform-app.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  // 微信支付渠道色值
  const wechatColor = '#07c160';
  const wechatSvgUrl = getProviderSvgUrl('wechat');

  const props = defineProps<{
    record: WxPlatformApp;
  }>();

  const emit = defineEmits<{
    edit: [];
    manage: [];
  }>();

  const { hasPermission } = usePermission();

  /** 应用类型展示文案 */
  const appTypeLabel = computed(() => {
    const type = props.record.appType;
    const typeKeyMap: Record<string, string> = {
      official_account: 'payment.wx.app.appTypeOfficialAccount',
      mini_program: 'payment.wx.app.appTypeMiniProgram',
      mobile_app: 'payment.wx.app.appTypeMobileApp',
    };
    const key = typeKeyMap[type || ''];
    return key ? $t(key) : type || '-';
  });
</script>

<template>
  <div class="platform-app-card group flex h-full min-h-[128px] flex-col rounded-xl border bg-card shadow-sm">
    <div class="card-body flex flex-1 items-center gap-3 px-4 py-4">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
        :style="{ backgroundColor: `${wechatColor}1a` }"
      >
        <img v-if="wechatSvgUrl" :src="wechatSvgUrl" class="h-6 w-6" alt="wechat" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-base font-semibold leading-snug text-foreground">
          {{ record.appName || '-' }}
        </div>
        <div class="mt-1 truncate text-xs text-muted-foreground">
          {{ $t('payment.wx.app.wxAppIdPrefix', { appId: record.wxAppId || '-' }) }}
        </div>
        <div class="mt-0.5 truncate text-xs text-muted-foreground">
          {{ $t('payment.wx.app.appTypePrefix', { type: appTypeLabel }) }}
        </div>
      </div>
    </div>

    <div class="card-footer flex shrink-0 items-center justify-end border-t border-border px-3 py-1.5">
      <div class="flex items-center">
        <a-tooltip
          v-if="hasPermission(PermCodes.Payment.Wx.PlatformApp.MANAGE)"
          :title="$t('payment.wx.app.edit')"
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
          v-if="hasPermission(PermCodes.Payment.Wx.PlatformApp.MANAGE)"
          :title="$t('payment.wx.app.actionMore')"
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
  .platform-app-card {
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .platform-app-card:hover {
    border-color: hsl(var(--primary) / 0.4);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
    transform: translateY(-4px);
  }
</style>
