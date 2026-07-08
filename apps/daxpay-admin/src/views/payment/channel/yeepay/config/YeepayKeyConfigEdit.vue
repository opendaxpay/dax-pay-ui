<script lang="ts" setup>
import { ref } from 'vue';

import { $t } from '@vben/locales';

import {
  YeepayChannelMerchantApi,
  type YeepayDirectKeyConfigParam,
} from '#/api/payment/channel/yeepay/channel-merchant.api';
import { useMessage } from '#/hooks/useMessage';

defineOptions({ name: 'YeepayKeyConfigEdit' });

const { message } = useMessage();

const visible = ref(false);
const submitLoading = ref(false);
const formRef = ref();

// 当前编辑的通道商户号
const channelMchNo = ref('');
// 是否沙箱环境
const sandbox = ref(false);
// 已配置标志(回显用)
const configured = ref({
  appKey: false,
  privateKey: false,
  yopPublicKey: false,
});

const form = ref<YeepayDirectKeyConfigParam>({
  channelMchNo: '',
  appKey: '',
  privateKey: '',
  yopPublicKey: '',
  wxAppId: '',
  wxAppSecret: '',
});

const rules = {
  appKey: [
    { required: true, message: $t('payment.channel.yeepay.validation.appKey') },
  ],
  privateKey: [
    {
      required: true,
      message: $t('payment.channel.yeepay.validation.privateKey'),
    },
  ],
  yopPublicKey: [
    {
      required: true,
      message: $t('payment.channel.yeepay.validation.yopPublicKey'),
    },
  ],
};

/** 由通用框架初始化(传入通道商户号后加载密钥配置并打开弹窗) */
async function init(mchNo: string) {
  channelMchNo.value = mchNo;
  // 默认加载生产环境配置
  sandbox.value = false;
  visible.value = true;
  form.value = {
    channelMchNo: mchNo,
    appKey: '',
    privateKey: '',
    yopPublicKey: '',
    wxAppId: '',
    wxAppSecret: '',
  };
  configured.value = { appKey: false, privateKey: false, yopPublicKey: false };
  await loadConfig();
}

/** 加载当前环境(生产/沙箱)的密钥配置(脱敏返回) */
async function loadConfig() {
  if (!channelMchNo.value) return;
  const { data } = await YeepayChannelMerchantApi.findKeyConfig(channelMchNo.value, sandbox.value);
  if (data) {
    configured.value = {
      appKey: !!data.appKeyConfigured,
      privateKey: !!data.privateKeyConfigured,
      yopPublicKey: !!data.yopPublicKeyConfigured,
    };
    form.value.wxAppId = data.wxAppId ?? '';
  }
}

async function handleSubmit() {
  await formRef.value?.validate();
  submitLoading.value = true;
  try {
    await YeepayChannelMerchantApi.saveKeyConfig({ ...form.value, sandbox: sandbox.value });
    message.success($t('payment.channel.yeepay.saveSuccess'));
    visible.value = false;
  } finally {
    submitLoading.value = false;
  }
}

defineExpose({ init });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :cancel-text="$t('common.cancel')"
    :confirm-loading="submitLoading"
    :ok-text="$t('common.confirm')"
    :title="$t('payment.channel.yeepay.keyConfig')"
    width="600px"
    @ok="handleSubmit"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <!-- 国际化: 环境(生产/沙箱切换) -->
      <a-form-item :label="$t('payment.channel.yeepay.environment')">
        <a-radio-group v-model:value="sandbox" button-style="solid" @change="loadConfig">
          <a-radio-button :value="false">{{ $t('payment.channel.yeepay.prodEnv') }}</a-radio-button>
          <a-radio-button :value="true">{{ $t('payment.channel.yeepay.sandboxEnv') }}</a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item :label="$t('payment.channel.yeepay.appKey')" name="appKey">
        <a-textarea
          v-model:value="form.appKey"
          :auto-size="{ minRows: 1, maxRows: 3 }"
          :placeholder="
            configured.appKey
              ? $t('payment.channel.yeepay.keyConfigured')
              : $t('payment.channel.yeepay.appKeyPlaceholder')
          "
        />
      </a-form-item>
      <a-form-item
        :label="$t('payment.channel.yeepay.privateKey')"
        name="privateKey"
      >
        <a-textarea
          v-model:value="form.privateKey"
          :auto-size="{ minRows: 3, maxRows: 6 }"
          :placeholder="
            configured.privateKey
              ? $t('payment.channel.yeepay.keyConfigured')
              : $t('payment.channel.yeepay.privateKeyTooltip')
          "
        />
      </a-form-item>
      <a-form-item
        :label="$t('payment.channel.yeepay.yopPublicKey')"
        name="yopPublicKey"
      >
        <a-textarea
          v-model:value="form.yopPublicKey"
          :auto-size="{ minRows: 3, maxRows: 6 }"
          :placeholder="
            configured.yopPublicKey
              ? $t('payment.channel.yeepay.keyConfigured')
              : $t('payment.channel.yeepay.yopPublicKeyTooltip')
          "
        />
      </a-form-item>
      <a-form-item :label="$t('payment.channel.yeepay.wxAppId')">
        <a-input
          v-model:value="form.wxAppId"
          :placeholder="$t('payment.channel.yeepay.wxAppIdPlaceholder')"
        />
      </a-form-item>
      <a-form-item :label="$t('payment.channel.yeepay.wxAppSecret')">
        <a-input-password
          v-model:value="form.wxAppSecret"
          autocomplete="new-password"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
