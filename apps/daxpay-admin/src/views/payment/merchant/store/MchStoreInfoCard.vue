<script lang="ts" setup>
  import type { MchStoreInfoResult } from '#/api/payment/merchant/store.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    record: MchStoreInfoResult;
  }>();
  const emit = defineEmits<{
    open: [];
  }>();

  const { hasPermission } = usePermission();

  /** 是否可进入门店工作台(门店查看权限; 无权限时整卡不响应) */
  const canEnter = computed(() => hasPermission(PermCodes.Merchant.Store.VIEW));

  /** 是否启用(启用=主色图标底与状态点, 停用=灰色) */
  const isEnabled = computed(() => props.record.status === 'enable');

  /** 默认支付应用展示文案(未配置显示「跟随商户默认」) */
  const defaultAppText = computed(() => {
    if (props.record.appId) {
      return $t('payment.merchant.store.card.defaultAppLine', {
        app: props.record.appName || props.record.appId,
      });
    }
    return $t('payment.merchant.store.card.defaultAppFollow');
  });

  /**
   * 整卡点击进入门店详情工作台(无查看权限时不响应)
   */
  function handleClick() {
    if (canEnter.value) {
      emit('open');
    }
  }

  /**
   * 键盘 Enter / Space 打开(与整卡点击同权限条件)
   */
  function handleKeydown(e: KeyboardEvent) {
    if (!canEnter.value) {
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      emit('open');
    }
  }
</script>

<template>
  <div
    class="mch-store-card group relative flex h-full min-h-[126px] flex-col overflow-hidden rounded-xl border bg-card shadow-sm"
    :class="[
      canEnter ? 'mch-store-card-clickable cursor-pointer' : '',
      record.defaultStore ? 'mch-store-card--default' : '',
    ]"
    :role="canEnter ? 'button' : undefined"
    :tabindex="canEnter ? 0 : undefined"
    :aria-label="$t('payment.merchant.store.card.enterWorkbench')"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <div class="flex flex-1 items-start gap-3 px-4 py-4">
      <!-- 门店图标: 默认门店或启用=主色浅底, 停用且非默认=灰底 -->
      <div
        class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg transition-colors duration-300"
        :class="record.defaultStore || isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'"
      >
        <IconifyIcon icon="ant-design:shop-outlined" class="text-xl" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <a-tooltip :title="record.storeName" placement="top">
            <span
              class="truncate text-[15px] font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-primary"
            >
              {{ record.storeName || '-' }}
            </span>
          </a-tooltip>
          <!-- 默认门店标记(仅默认门店展示) -->
          <a-tag v-if="record.defaultStore" color="processing" class="shrink-0 !m-0 !text-xs">
            {{ $t('payment.merchant.store.store.defaultStore') }}
          </a-tag>
          <!-- 停用标记(仅非启用状态展示) -->
          <a-tag v-if="!isEnabled" class="shrink-0 !m-0 !text-xs">
            {{ $t('payment.merchant.store.store.status.disabled') }}
          </a-tag>
        </div>
        <div class="mt-1.5 truncate text-xs text-muted-foreground">
          <!-- 门店号 -->
          {{ $t('payment.merchant.store.card.storeNoPrefix', { storeNo: record.storeNo || '-' }) }}
        </div>
        <!-- 默认支付应用(空=跟随商户默认应用) -->
        <div class="mt-1 truncate text-xs text-muted-foreground">
          {{ defaultAppText }}
        </div>
      </div>
    </div>

    <!-- 底部操作条: 无查看权限时隐藏, 整卡也不响应点击 -->
    <div v-if="canEnter" class="flex shrink-0 items-center justify-between border-t border-border px-4 py-2">
      <div class="flex items-center gap-1.5 text-xs leading-none text-muted-foreground">
        <span
          class="inline-block h-1.5 w-1.5 rounded-full"
          :class="isEnabled ? 'bg-primary' : 'bg-muted-foreground/50'"
        />
        <span>{{
          isEnabled
            ? $t('payment.merchant.store.store.status.enable')
            : $t('payment.merchant.store.store.status.disabled')
        }}</span>
      </div>
      <div
        class="flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors duration-300 group-hover:text-primary"
      >
        <span>{{ $t('payment.merchant.store.card.enterWorkbench') }}</span>
        <IconifyIcon icon="ant-design:arrow-right-outlined" class="text-xs" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .mch-store-card {
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .mch-store-card-clickable:hover {
    border-color: hsl(var(--primary) / 40%);
    box-shadow: 0 10px 26px rgb(0 0 0 / 12%);
    transform: translateY(-3px);
  }

  .mch-store-card-clickable:focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }

  /* 默认门店卡片常显主色描边 */
  .mch-store-card--default {
    box-shadow: 0 0 0 1px hsl(var(--primary) / 35%);
  }

  .mch-store-card--default:hover {
    box-shadow:
      0 10px 26px rgb(0 0 0 / 12%),
      0 0 0 1px hsl(var(--primary) / 35%);
  }
</style>
