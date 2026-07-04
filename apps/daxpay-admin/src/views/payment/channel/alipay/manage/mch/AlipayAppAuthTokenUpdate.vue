<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    AlipayIsvChannelMerchantApi,
    type AlipayIsvChannelMerchantConfig,
  } from '#/api/payment/channel/alipay/channel-merchant.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AlipayAppAuthTokenUpdate' });

  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const { confirm, message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const channelMchNo = ref('');
  // 服务商通道商户配置(用于展示当前令牌)
  const isvConfig = ref<AlipayIsvChannelMerchantConfig>({});
  // 新令牌输入
  const newAuthToken = ref('');

  /** 脱敏展示敏感字段 */
  function maskSecret(value?: string) {
    if (!value) {
      return '-';
    }
    if (value.length <= 8) {
      return '****';
    }
    return `${value.slice(0, 4)}****${value.slice(-4)}`;
  }

  /** 加载当前配置, 展示已有令牌 */
  function loadConfig() {
    if (!channelMchNo.value) {
      return;
    }
    loading.value = true;
    isvConfig.value = {};
    AlipayIsvChannelMerchantApi.findByChannelMchNo(channelMchNo.value)
      .then(({ data }) => {
        isvConfig.value = data || {};
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 打开弹窗 */
  function open(mchNo: string) {
    channelMchNo.value = mchNo;
    newAuthToken.value = '';
    visible.value = true;
    loadConfig();
  }

  /** 关闭弹窗 */
  function close() {
    visible.value = false;
  }

  /** 保存新令牌(二次确认后提交) */
  function handleSave() {
    if (!newAuthToken.value.trim()) {
      message.warning($t('payment.merchant.channelMerchant.appAuthTokenRequired'));
      return;
    }
    confirm({
      title: $t('common.confirm'),
      content: $t('payment.merchant.channelMerchant.appAuthTokenUpdateConfirm'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk() {
        saving.value = true;
        return AlipayIsvChannelMerchantApi.updateAppAuthToken({
          channelMchNo: channelMchNo.value,
          appAuthToken: newAuthToken.value.trim(),
        })
          .then(() => {
            message.success($t('payment.merchant.channelMerchant.appAuthTokenUpdateSuccess'));
            emit('success');
            close();
          })
          .finally(() => {
            saving.value = false;
          });
      },
    });
  }

  defineExpose({ open, close });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.merchant.channelMerchant.appAuthTokenSetTitle')"
    :confirm-loading="saving"
    :ok-text="$t('common.save')"
    :cancel-text="$t('common.cancelText')"
    destroy-on-hidden
    @ok="handleSave"
  >
    <a-spin :spinning="loading">
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <!-- 国际化：当前令牌 -->
        <a-form-item :label="$t('payment.merchant.channelMerchant.appAuthTokenCurrent')">
          {{ maskSecret(isvConfig.appAuthToken) }}
        </a-form-item>
        <!-- 国际化：新令牌 -->
        <a-form-item :label="$t('payment.merchant.channelMerchant.appAuthTokenNew')">
          <a-input
            v-model:value="newAuthToken"
            :placeholder="$t('payment.merchant.channelMerchant.appAuthTokenNewPlaceholder')"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
