<script lang="ts" setup>
  import type {
    AllocReceiverAppOption,
    AllocReceiverResult,
  } from '#/api/payment/global/alloc-receiver/alloc-receiver.api';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { type ProductConfig, receiverTypeI18nKey, STATUS_COLOR } from './constants';

  /**
   * 分账接收方详情弹窗(完整账号/应用/失败原因, 补偿列表列宽截断)
   */
  const props = defineProps<{
    /** 直连应用下拉(支付宝应用名解析) */
    appOptions: AllocReceiverAppOption[];
    /** 当前产品配置(应用/关系字段显隐) */
    config?: ProductConfig;
    /** 弹窗开关 */
    open: boolean;
    /** 支付产品编码(mock 的 USER_ID 文案按产品覆盖) */
    product: string;
    /** 当前行 */
    row?: AllocReceiverResult;
  }>();

  const emit = defineEmits<{
    /** 关闭弹窗 */
    (e: 'close'): void;
  }>();

  /** 关系类型展示(自定义关系显示名称) */
  function relationText(row: AllocReceiverResult): string {
    if (!row.relationType) {
      return '-';
    }
    if (row.relationType === 'custom' && row.customRelation) {
      return row.customRelation;
    }
    return $t(`payment.channel.allocReceiver.relation.${row.relationType}`);
  }

  /** 应用标签(详情回显绑定所用应用) */
  function appLabel(row: AllocReceiverResult): string {
    if (row.channelAppId) {
      return row.channelAppId;
    }
    if (row.spAppId) {
      return row.spAppId;
    }
    if (row.directAppRefId) {
      const app = props.appOptions.find((a) => a.value === row.directAppRefId);
      return app?.label ?? row.directAppRefId;
    }
    return '-';
  }
</script>

<template>
  <a-modal
    :open="open"
    :title="$t('payment.channel.allocReceiver.detailTitle')"
    :footer="null"
    :width="640"
    @cancel="emit('close')"
  >
    <a-descriptions v-if="row" :column="2" size="small" bordered class="mt-2">
      <a-descriptions-item :label="$t('payment.channel.allocReceiver.typeLabel')">
        {{ $t(receiverTypeI18nKey(props.product, row.receiverType)) }}
      </a-descriptions-item>
      <a-descriptions-item :label="$t('payment.channel.allocReceiver.statusLabel')">
        <a-tag :color="STATUS_COLOR[row.status ?? ''] ?? 'default'">
          {{ $t(`payment.channel.allocReceiver.status.${row.status ?? ''}`) }}
        </a-tag>
      </a-descriptions-item>
      <!-- 账号完整展示(openid 等长串不截断) -->
      <a-descriptions-item :label="$t('payment.channel.allocReceiver.account')" :span="2">
        <span class="break-all">{{ row.receiverAccount || '-' }}</span>
      </a-descriptions-item>
      <a-descriptions-item :label="$t('payment.channel.allocReceiver.name')" :span="2">
        {{ row.receiverName || '-' }}
      </a-descriptions-item>
      <!-- 别名(本地备注, 不上送通道) -->
      <a-descriptions-item :label="$t('payment.channel.allocReceiver.alias')" :span="2">
        {{ row.alias || '-' }}
      </a-descriptions-item>
      <!-- 分账关系(微信/抖音) -->
      <a-descriptions-item v-if="config?.hasRelation" :label="$t('payment.channel.allocReceiver.relationLabel')">
        {{ relationText(row) }}
      </a-descriptions-item>
      <!-- 绑定应用(微信服务商: sp + sub 两档) -->
      <template v-if="config?.appMode === 'wechat-isv'">
        <a-descriptions-item :label="$t('payment.channel.allocReceiver.spApp')">
          {{ row.spAppId || '-' }}
        </a-descriptions-item>
        <a-descriptions-item v-if="row.subAppId" :label="$t('payment.channel.allocReceiver.subApp')">
          {{ row.subAppId }}
        </a-descriptions-item>
      </template>
      <!-- 绑定应用(其余模式) -->
      <a-descriptions-item
        v-else-if="config && config.appMode !== 'none'"
        :label="$t('payment.channel.allocReceiver.app')"
      >
        {{ appLabel(row) }}
      </a-descriptions-item>
      <a-descriptions-item :label="$t('payment.channel.allocReceiver.bindTime')">
        {{ formatDateTime(row.bindTime) || '-' }}
      </a-descriptions-item>
      <a-descriptions-item v-if="row.unbindTime" :label="$t('payment.channel.allocReceiver.unbindTime')">
        {{ formatDateTime(row.unbindTime) }}
      </a-descriptions-item>
      <!-- 最近失败原因(绑定失败/解绑失败) -->
      <a-descriptions-item v-if="row.errorMsg" :label="$t('payment.channel.allocReceiver.errorLabel')" :span="2">
        <span class="break-all text-red-500">{{ row.errorMsg }}</span>
      </a-descriptions-item>
    </a-descriptions>
  </a-modal>
</template>
