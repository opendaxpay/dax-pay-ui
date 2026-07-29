<script lang="ts" setup>
  import type { DyPlatformApp } from '#/api/payment/douyin/platform-app.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  // 抖音支付渠道色值
  const douyinColor = '#fe2c55';
  const douyinSvgUrl = getProviderSvgUrl('douyin');

  const props = defineProps<{
    record: DyPlatformApp;
  }>();

  const emit = defineEmits<{
    delete: [];
    edit: [];
  }>();

  const { hasPermission } = usePermission();

  /** 应用类型展示文案 */
  const appTypeLabel = computed(() => {
    const type = props.record.appType;
    const typeKeyMap: Record<string, string> = {
      mini_program: 'payment.douyin.app.appTypeMiniProgram',
      mobile_app: 'payment.douyin.app.appTypeMobileApp',
      web_app: 'payment.douyin.app.appTypeWebApp',
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
        :style="{ backgroundColor: `${douyinColor}1a` }"
      >
        <img v-if="douyinSvgUrl" :src="douyinSvgUrl" class="h-6 w-6" alt="douyin" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-base font-semibold leading-snug text-foreground">
          {{ record.appName || '-' }}
        </div>
        <div class="mt-1 truncate text-xs text-muted-foreground">
          {{ $t('payment.douyin.app.douyinAppIdPrefix', { appId: record.douyinAppId || '-' }) }}
        </div>
        <div class="mt-0.5 truncate text-xs text-muted-foreground">
          {{ $t('payment.douyin.app.appTypePrefix', { type: appTypeLabel }) }}
        </div>
      </div>
    </div>

    <div class="card-footer flex shrink-0 items-center justify-end border-t border-border px-3 py-1.5">
      <div class="flex items-center">
        <a-tooltip
          v-if="hasPermission(PermCodes.Payment.Douyin.PlatformApp.MANAGE)"
          :title="$t('payment.douyin.app.edit')"
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
          v-if="hasPermission(PermCodes.Payment.Douyin.PlatformApp.MANAGE)"
          :title="$t('payment.douyin.app.delete')"
        >
          <a-button
            type="text"
            danger
            size="small"
            class="!h-6 !w-6 !min-w-6 !p-0"
            @click="emit('delete')"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:delete-outlined" class="text-sm" />
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
