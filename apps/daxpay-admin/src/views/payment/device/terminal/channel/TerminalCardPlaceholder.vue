<script lang="ts" setup>
  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  defineOptions({ name: 'TerminalCardPlaceholder' });
</script>

<template>
  <!-- 终端台账占位卡片(通道差异化字段设计未定, 暂不接入, 详见 cardTerminalTooltip) -->
  <a-tooltip :title="$t('payment.merchant.channelMerchant.cardTerminalTooltip')" placement="bottom">
    <div
      class="terminal-placeholder relative flex w-[220px] cursor-not-allowed flex-col items-center overflow-hidden rounded-2xl border-none bg-card px-5 py-6 text-center shadow-md"
    >
      <!-- 开发中角标 -->
      <div
        class="absolute right-2 top-2 rounded-full bg-muted-foreground/15 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
      >
        {{ $t('payment.merchant.channelMerchant.cardTerminalBadge') }}
      </div>
      <!-- 图标(灰度) -->
      <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-sm">
        <IconifyIcon icon="lucide:monitor-smartphone" class="h-7 w-7" />
      </div>
      <!-- 标题 -->
      <div class="mb-1.5 text-base font-bold text-muted-foreground">
        {{ $t('payment.merchant.channelMerchant.cardTerminal') }}
      </div>
      <!-- 描述 -->
      <div class="card-desc line-clamp-1 text-xs leading-relaxed text-muted-foreground/80">
        {{ $t('payment.merchant.channelMerchant.cardTerminalDesc') }}
      </div>
    </div>
  </a-tooltip>
</template>

<style scoped>
  .terminal-placeholder {
    opacity: 0.6;
    max-height: 200px;
  }

  .card-desc {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  .line-clamp-1 {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
</style>
