<script lang="ts" setup>
  import type { DyMchApp } from '#/api/payment/douyin/mch-app.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ResourceCard } from '@daxpay/ui-biz/components/resource-card';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  const props = defineProps<{
    record: DyMchApp;
  }>();
  const emit = defineEmits<{
    delete: [];
    edit: [];
  }>();
  // 抖音支付渠道色值(图标本体为近黑色, 背景配浅黑更贴品牌)
  const douyinColor = '#130A17';
  const douyinSvgUrl = getProviderSvgUrl('douyin');

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
  <!-- 卡片统一走 ui-biz 的 ResourceCard, 本组件只保留抖音商户应用特有语义: 品牌图标、AppId 与类型副信息、卡脚编辑/删除操作 -->
  <ResourceCard
    :title="record.appName || '-'"
    :subtitle="$t('payment.douyin.app.douyinAppIdPrefix', { appId: record.douyinAppId || '-' })"
    :image="douyinSvgUrl"
    :icon-bg="douyinColor"
    :clickable="false"
    footer="actions"
  >
    <!-- 副信息第二行: 应用类型 -->
    <template #subtitleExtra>
      <div class="mt-0.5 truncate text-xs text-muted-foreground">
        {{ $t('payment.douyin.app.appTypePrefix', { type: appTypeLabel }) }}
      </div>
    </template>

    <!-- 卡脚操作: 编辑 / 删除(同一管理权限控制) -->
    <template #actions>
      <a-tooltip v-if="hasPermission(PermCodes.Payment.Douyin.MchApp.MANAGE)" :title="$t('payment.douyin.app.edit')">
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
      <a-tooltip v-if="hasPermission(PermCodes.Payment.Douyin.MchApp.MANAGE)" :title="$t('payment.douyin.app.delete')">
        <a-button type="text" danger size="small" class="!h-6 !w-6 !min-w-6 !p-0" @click="emit('delete')">
          <template #icon>
            <IconifyIcon icon="ant-design:delete-outlined" class="text-sm" />
          </template>
        </a-button>
      </a-tooltip>
    </template>
  </ResourceCard>
</template>
