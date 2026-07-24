<script lang="ts" setup>
  import type { MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  const props = defineProps<{
    record: MchAppInfoResult;
  }>();

  const emit = defineEmits<{
    open: [];
  }>();

  const isEnabled = computed(() => props.record.status === 'enable');

  /**
   * 整卡点击进入应用工作台
   */
  function handleOpen() {
    emit('open');
  }

  /**
   * 键盘 Enter / Space 打开
   */
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      emit('open');
    }
  }
</script>

<template>
  <div
    class="mch-app-info-card group relative flex h-full min-h-[156px] cursor-pointer flex-col overflow-hidden rounded-2xl border-none bg-card shadow-md"
    :class="{ 'mch-app-info-card--default': record.defaultApp }"
    role="button"
    tabindex="0"
    :aria-label="$t('payment.merchant.app.app.openActionAria')"
    @click="handleOpen"
    @keydown="handleKeydown"
  >
    <div class="card-body flex flex-1 items-center gap-4 px-5 py-5">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
      >
        <IconifyIcon icon="ant-design:appstore-outlined" class="h-7 w-7" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span
            class="truncate text-base font-bold leading-snug text-foreground transition-colors duration-300 group-hover:text-primary"
          >
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
          {{ isEnabled ? $t('payment.merchant.app.app.statusEnable') : $t('payment.merchant.app.app.statusDisabled') }}
        </span>
      </div>
      <!-- 国际化：进入配置 › -->
      <div
        class="flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors duration-300 group-hover:text-primary"
      >
        <span>{{ $t('payment.merchant.app.app.enterConfig') }}</span>
        <IconifyIcon icon="ant-design:right-outlined" class="text-xs" />
      </div>
    </div>

    <!-- hover 底边色条（对齐工作台） -->

    <div class="absolute bottom-0 left-0 h-1.5 w-0 bg-primary transition-all duration-300 group-hover:w-full" />
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

  .mch-app-info-card:focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }

  .mch-app-info-card--default {
    box-shadow:
      0 4px 14px rgb(0 0 0 / 0.08),
      0 0 0 1.5px hsl(var(--primary) / 0.35);
  }
</style>
