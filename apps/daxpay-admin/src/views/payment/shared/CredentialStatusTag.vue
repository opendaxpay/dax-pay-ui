<script lang="ts" setup>
  /**
   * 接入配置状态标签(工作台磁贴右上角 / 对接配置页字段标签共用)
   *
   * 三态: true=绿色「已配置」; false=橙色「待配置」(传入缺失项时悬停列出「未配置：xx、xx」);
   * undefined=不渲染(未加载 / 加载失败 / 无权查看), 调用方无需再包 v-if。
   * 商户端存在同构副本(apps/daxpay-merchant/src/views/payment/shared), 改动需两端同步。
   */
  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  defineOptions({ name: 'CredentialStatusTag' });

  const props = withDefaults(
    defineProps<{
      /** 磁贴紧凑形态: 小字号 + 窄内边距, 超出容器宽度省略(容器宽度由调用方约束, 避开磁贴中央图标) */
      compact?: boolean;
      /** 配置状态: true=已配置 false=待配置, undefined 不渲染 */
      configured?: boolean;
      /** 缺失项名称(已翻译文案, 待配置时悬停提示; 空数组不提示) */
      missing?: string[];
      /** 待配置态文案覆盖(如字段级「平台侧未配置」), 空则用通用「待配置」 */
      pendingText?: string;
    }>(),
    {
      compact: false,
      // 显式 undefined 默认值: 规避 Vue 布尔 prop 缺省转 false, 保留「不渲染」第三态
      configured: undefined,
      missing: () => [],
      pendingText: '',
    },
  );

  /** 标签文案(待配置态允许调用方覆盖) */
  const label = computed(() => {
    if (props.configured) {
      // 已配置
      return $t('payment.common.credentialStatus.configured');
    }
    // 待配置
    return props.pendingText || $t('payment.common.credentialStatus.pending');
  });

  /** 悬停提示: 仅待配置且传入缺失项时展示(空串时 tooltip 不弹出) */
  const tooltip = computed(() => {
    if (props.configured !== false || props.missing.length === 0) {
      return '';
    }
    // 未配置：{fields}(缺失项按语种分隔符拼接)
    return $t('payment.common.credentialStatus.missingTip', {
      fields: props.missing.join($t('payment.common.credentialStatus.separator')),
    });
  });
</script>

<template>
  <a-tooltip v-if="configured !== undefined" :title="tooltip">
    <a-tag
      :color="configured ? 'green' : 'orange'"
      class="!m-0 font-normal"
      :class="{ 'credential-status-tag--compact': compact }"
    >
      {{ label }}
    </a-tag>
  </a-tooltip>
</template>

<style scoped>
  /* 磁贴紧凑形态: scoped 选择器特异性高于 antd cssinjs 的 .ant-tag, 无需 !important */
  .credential-status-tag--compact {
    max-width: 100%;
    padding-inline: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 11px;
    line-height: 18px;
    vertical-align: top;
  }
</style>
