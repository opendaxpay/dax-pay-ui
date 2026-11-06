<script lang="ts" setup>
  import type { AlipayIsvApp } from '#/api/payment/channel/alipay/isv-app.api';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ResourceCard } from '@daxpay/ui-biz/components/resource-card';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  defineProps<{
    record: AlipayIsvApp;
  }>();
  const emit = defineEmits<{
    edit: [];
    manage: [];
  }>();
  // 支付宝渠道色值（与支付渠道展示一致）
  const alipayColor = '#1677ff';
  const alipaySvgUrl = getProviderSvgUrl('alipay');

  const { hasPermission } = usePermission();
</script>

<template>
  <!-- 卡片统一走 ui-biz 的 ResourceCard, 本组件只保留支付宝服务商应用特有语义: 品牌图标、应用号副信息、卡脚编辑/更多操作 -->
  <ResourceCard
    :title="record.appName || '-'"
    :subtitle="$t('payment.channel.alipayManage.aliAppIdPrefix', { appId: record.aliAppId || '-' })"
    :image="alipaySvgUrl"
    :icon-bg="alipayColor"
    :clickable="false"
    footer="actions"
  >
    <!-- 卡脚操作: 编辑 / 更多(同一管理权限控制) -->
    <template #actions>
      <a-tooltip v-if="hasPermission(PermCodes.Payment.Isv.MANAGE)" :title="$t('payment.channel.alipayManage.edit')">
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
        v-if="hasPermission(PermCodes.Payment.Isv.MANAGE)"
        :title="$t('payment.channel.alipayManage.actionMore')"
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
    </template>
  </ResourceCard>
</template>
