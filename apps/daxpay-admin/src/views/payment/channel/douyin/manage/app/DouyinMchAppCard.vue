<script lang="ts" setup>
  import type { DouyinMchApp } from '#/api/payment/channel/douyin/mch-app.api';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  import { computed } from 'vue';

  // 抖音渠道色值
  const douyinColor = '#000000';
  const douyinSvgUrl = getProviderSvgUrl('douyin');

  const props = defineProps<{
    record: DouyinMchApp;
  }>();

  const emit = defineEmits<{
    edit: [];
    manage: [];
  }>();

  const { hasPermission } = usePermission();

  /** 应用类型展示文案 */
  const appTypeLabel = computed(() => {
    const typeKeyMap: Record<string, string> = {
      mini_program: 'payment.channel.douyinMchApp.appTypeMiniProgram',
      mobile_app: 'payment.channel.douyinMchApp.appTypeMobileApp',
      web_app: 'payment.channel.douyinMchApp.appTypeWebApp',
    };
    const key = typeKeyMap[props.record.appType || ''];
    return key ? $t(key) : props.record.appType || '-';
  });
</script>

<template>
  <div class="douyin-mch-app-card group flex h-full min-h-[128px] flex-col rounded-xl border bg-card shadow-sm">
    <div class="card-body flex flex-1 items-center gap-3 px-4 py-4">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
        :style="{ backgroundColor: `${douyinColor}1a` }"
      >
        <img v-if="douyinSvgUrl" :src="douyinSvgUrl" class="w-6 h-6" alt="douyin" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-base font-semibold leading-snug text-foreground">
          {{ record.appName || '-' }}
        </div>
        <div class="mt-1 truncate text-xs text-muted-foreground">
          {{ $t('payment.channel.douyinMchApp.appIdPrefix', { appId: record.douyinAppId || '-' }) }}
        </div>
        <div class="mt-0.5 truncate text-xs text-muted-foreground">
          {{ $t('payment.channel.douyinMchApp.appTypePrefix', { type: appTypeLabel }) }}
        </div>
      </div>
    </div>

    <div class="card-footer flex shrink-0 items-center justify-end border-t border-border px-3 py-1.5">
      <div class="flex items-center">
        <a-tooltip
          v-if="hasPermission(PermCodes.Channel.App.MANAGE)"
          :title="$t('payment.channel.douyinMchApp.edit')"
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
          v-if="hasPermission(PermCodes.Channel.App.VIEW)"
          :title="$t('payment.channel.douyinMchApp.actionMore')"
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
  .douyin-mch-app-card {
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .douyin-mch-app-card:hover {
    border-color: hsl(var(--primary) / 0.4);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
    transform: translateY(-4px);
  }
</style>
