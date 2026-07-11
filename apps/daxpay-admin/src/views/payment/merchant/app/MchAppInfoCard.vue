<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';

  import type { MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';

  import { computed } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  const { hasPermission } = usePermission();

  const props = defineProps<{
    mchNo: string;
    record: MchAppInfoResult;
  }>();

  const emit = defineEmits<{
    cancelDefault: [];
    delete: [];
    edit: [];
    notifyConfig: [];
    setDefault: [];
  }>();

  const router = useRouter();

  const isEnabled = computed(() => props.record.status === 'enable');

  /** 进入应用通道路由配置 */
  function goPayRoute() {
    router.push({
      path: '/payment/merchant/route',
      query: { mchNo: props.mchNo, appId: props.record.appId },
    });
  }

  /** 进入聚合扫码配置 */
  function goAggregateScan() {
    router.push({
      path: '/payment/merchant/aggregate',
      query: { mchNo: props.mchNo, appId: props.record.appId },
    });
  }

  /**
   * 更多操作菜单
   */
  function getMoreMenu(): MenuProps {
    const items: MenuProps['items'] = [
      props.record.defaultApp
        ? { key: 'cancelDefault', label: $t('payment.merchant.app.app.cancelDefault') }
        : { key: 'setDefault', label: $t('payment.merchant.app.app.setDefault') },
      // 国际化：通知配置
      { key: 'notifyConfig', label: $t('payment.merchant.app.app.notifyConfig') },
      { key: 'delete', label: $t('payment.merchant.app.app.delete'), danger: true },
    ];
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        if (key === 'setDefault') {
          emit('setDefault');
        } else if (key === 'cancelDefault') {
          emit('cancelDefault');
        } else if (key === 'notifyConfig') {
          emit('notifyConfig');
        } else if (key === 'delete') {
          emit('delete');
        }
      },
    };
  }
</script>

<template>
  <div
    class="mch-app-info-card group flex h-full min-h-[128px] flex-col rounded-xl border bg-card shadow-sm"
    :class="{ 'mch-app-info-card--default': record.defaultApp }"
  >
    <div class="card-body flex flex-1 items-center gap-3 px-4 py-4">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <IconifyIcon icon="ant-design:appstore-outlined" class="text-xl" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="truncate text-base font-semibold leading-snug text-foreground">{{ record.appName }}</span>
          <a-tag v-if="record.defaultApp" color="processing" class="shrink-0 !m-0 !text-xs">
            {{ $t('payment.merchant.app.app.defaultTag') }}
          </a-tag>
        </div>
        <div class="mt-1.5 truncate text-xs text-muted-foreground">
          {{ $t('payment.merchant.app.app.appIdPrefix', { appId: record.appId }) }}
        </div>
      </div>
    </div>

    <div class="card-footer flex shrink-0 items-center justify-between border-t border-border px-3 py-1.5">
      <div class="flex items-center gap-1 text-xs leading-none text-muted-foreground">
        <span
          class="inline-block h-1.5 w-1.5 rounded-full"
          :class="isEnabled ? 'bg-primary' : 'bg-muted-foreground/50'"
        />
        <span>
          {{ isEnabled ? $t('payment.merchant.app.app.statusEnable') : $t('payment.merchant.app.app.statusDisabled') }}
        </span>
      </div>
      <div class="flex items-center">
        <a-tooltip
          v-if="hasPermission(PermCodes.Merchant.AppRoute.VIEW)"
          :title="$t('payment.merchant.app.app.payRoute')"
        >
          <a-button
            type="text"
            size="small"
            class="!h-6 !w-6 !min-w-6 !p-0 !text-muted-foreground hover:!text-primary"
            @click="goPayRoute"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:node-index-outlined" class="text-sm" />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip
          v-if="hasPermission(PermCodes.Merchant.GatewayAggregate.VIEW)"
          :title="$t('payment.merchant.app.app.aggregateScan')"
        >
          <a-button
            type="text"
            size="small"
            class="!h-6 !w-6 !min-w-6 !p-0 !text-muted-foreground hover:!text-primary"
            @click="goAggregateScan"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:qrcode-outlined" class="text-sm" />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip v-if="hasPermission(PermCodes.Merchant.App.MANAGE)" :title="$t('payment.merchant.app.app.edit')">
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
        <a-dropdown v-if="hasPermission(PermCodes.Merchant.App.MANAGE)" :menu="getMoreMenu()" :trigger="['click']">
          <a-tooltip :title="$t('payment.merchant.app.app.actionMore')">
            <a-button
              type="text"
              size="small"
              class="!h-6 !w-6 !min-w-6 !p-0 !text-muted-foreground hover:!text-primary"
            >
              <template #icon>
                <IconifyIcon icon="ant-design:menu-outlined" class="text-sm" />
              </template>
            </a-button>
          </a-tooltip>
        </a-dropdown>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .mch-app-info-card {
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      border-color 0.25s ease;
  }

  .mch-app-info-card:hover {
    border-color: hsl(var(--primary) / 0.4);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
    transform: translateY(-4px);
  }

  .mch-app-info-card--default {
    border-color: hsl(var(--primary) / 0.4);
  }
</style>
