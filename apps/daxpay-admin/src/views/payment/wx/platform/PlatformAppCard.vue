<script lang="ts" setup>
  import type { WxPlatformApp } from '#/api/payment/wx/platform-app.api';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { ResourceCard } from '@daxpay/ui-biz/components/resource-card';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  const props = defineProps<{
    record: WxPlatformApp;
  }>();
  const emit = defineEmits<{
    delete: [];
    edit: [];
  }>();
  // 微信支付渠道色值
  const wechatColor = '#07c160';
  const wechatSvgUrl = getProviderSvgUrl('wechat');

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
  <!-- 卡片统一走 ui-biz 的 ResourceCard, 本组件只保留微信平台应用特有语义: 品牌图标、AppId 与类型副信息、卡脚编辑/删除操作 -->
  <ResourceCard
    :title="record.appName || '-'"
    :subtitle="$t('payment.wx.app.wxAppIdPrefix', { appId: record.wxAppId || '-' })"
    :image="wechatSvgUrl"
    :icon-bg="wechatColor"
    :clickable="false"
    footer="actions"
  >
    <!-- 副信息第二行: 应用类型 -->
    <template #subtitleExtra>
      <div class="mt-0.5 truncate text-xs text-muted-foreground">
        {{ $t('payment.wx.app.appTypePrefix', { type: appTypeLabel }) }}
      </div>
    </template>

    <!-- 卡脚操作: 编辑 / 删除(同一管理权限控制) -->
    <template #actions>
      <a-tooltip v-if="hasPermission(PermCodes.Payment.Wx.PlatformApp.MANAGE)" :title="$t('payment.wx.app.edit')">
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
      <a-tooltip v-if="hasPermission(PermCodes.Payment.Wx.PlatformApp.MANAGE)" :title="$t('payment.wx.app.delete')">
        <a-button type="text" danger size="small" class="!h-6 !w-6 !min-w-6 !p-0" @click="emit('delete')">
          <template #icon>
            <IconifyIcon icon="ant-design:delete-outlined" class="text-sm" />
          </template>
        </a-button>
      </a-tooltip>
    </template>
  </ResourceCard>
</template>
