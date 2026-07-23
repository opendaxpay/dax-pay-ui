<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';

  import type { MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  const props = defineProps<{
    record: MchAppInfoResult;
    /** 更多操作菜单（编辑/设默认/删除） */
    actionMenu?: MenuProps;
    /** 是否有管理权限（控制底部操作区） */
    canManage?: boolean;
  }>();

  const isEnabled = computed(() => props.record.status === 'enable');
  const hasActions = computed(() => !!props.canManage && (props.actionMenu?.items?.length || 0) > 0);
</script>

<template>
  <div
    class="mch-app-info-card group relative flex h-full min-h-[156px] flex-col overflow-hidden rounded-2xl border-none bg-card shadow-md"
    :class="{ 'mch-app-info-card--default': record.defaultApp }"
  >
    <div class="card-body flex flex-1 items-center gap-4 px-5 py-5">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
      >
        <IconifyIcon icon="ant-design:appstore-outlined" class="h-7 w-7" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="truncate text-base font-bold leading-snug text-foreground">
            {{ record.appName }}
          </span>
          <a-tag v-if="record.defaultApp" color="processing" class="shrink-0 !m-0 !text-xs">
            <!-- 国际化：默认 -->
            {{ $t('payment.merchant.app.app.defaultTag') }}
          </a-tag>
        </div>
        <div class="mt-2 truncate text-xs text-muted-foreground">
          <!-- 国际化：应用号前缀 -->
          {{ $t('payment.merchant.app.app.appIdPrefix', { appId: record.appId }) }}
        </div>
      </div>
    </div>

    <div class="card-footer flex shrink-0 items-center justify-between px-5 pb-4 pt-1">
      <div class="flex items-center gap-1.5 text-xs leading-none text-muted-foreground">
        <span
          class="inline-block h-1.5 w-1.5 rounded-full"
          :class="isEnabled ? 'bg-primary' : 'bg-muted-foreground/50'"
        />
        <span>
          {{
            isEnabled
              ? $t('payment.merchant.app.app.statusEnable')
              : $t('payment.merchant.app.app.statusDisabled')
          }}
        </span>
      </div>
      <!-- 配置入口改侧栏；卡片仅保留管理操作 -->
      <a-dropdown v-if="hasActions" :menu="actionMenu">
        <a-button type="link" size="small" @click.stop>
          <!-- 国际化：更多操作 -->
          {{ $t('payment.merchant.app.app.actionMore') }}
          <IconifyIcon icon="ant-design:down-outlined" class="inline" />
        </a-button>
      </a-dropdown>
    </div>

    <div
      class="absolute bottom-0 left-0 h-1.5 w-0 bg-primary transition-all duration-300 group-hover:w-full"
    />
  </div>
</template>

<style scoped>
  .mch-app-info-card {
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .mch-app-info-card:hover {
    box-shadow: 0 12px 28px rgb(0 0 0 / 0.12);
    transform: translateY(-6px);
  }

  .mch-app-info-card--default {
    box-shadow:
      0 4px 14px rgb(0 0 0 / 0.08),
      0 0 0 1.5px hsl(var(--primary) / 0.35);
  }
</style>
