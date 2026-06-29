<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';

import { $t } from '@vben/locales';

import { IconifyIcon } from '@vben-core/icons';

import { ChannelMerchantUmsApi } from '#/api/payment/channel/ums/channel-merchant.api';
import { useMessage } from '#/hooks/useMessage';

defineOptions({ name: 'UmsMchCreateConfig' });

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'close'): void;
}>();

const { message } = useMessage();

const mchNo = ref('');
const productCode = ref('');
const productDisplayName = ref('');
const formRef = ref();
const form = ref({
  channelMerchantName: '',
  sandbox: false,
  umsAppId: '',
  appKey: '',
  merchantNo: '',
  terminalNo: '',
  orderPrefix: '',
  secretKey: '',
});

const visible = ref(false);
const createSuccess = ref(false);
const submitLoading = ref(false);

const rules = computed(() => ({
  channelMerchantName: [{ required: true, message: $t('payment.merchant.channelMerchant.channelMerchantNameRequired') }],
  umsAppId: [{ required: true, message: $t('payment.channel.ums.validation.umsAppId') }],
  appKey: [{ required: true, message: $t('payment.channel.ums.validation.appKey') }],
  merchantNo: [{ required: true, message: $t('payment.channel.ums.validation.merchantNo') }],
  terminalNo: [{ required: true, message: $t('payment.channel.ums.validation.terminalNo') }],
  orderPrefix: [{ required: true, message: $t('payment.channel.ums.validation.orderPrefix') }],
  secretKey: [{ required: true, message: $t('payment.channel.ums.validation.secretKey') }],
}));

function init(no: string, product: string, displayName: string) {
  mchNo.value = no;
  productCode.value = product;
  productDisplayName.value = displayName;
  visible.value = true;
  createSuccess.value = false;
  resetForm();
}

function validate(): boolean {
  let valid = false;
  formRef.value?.validate((errors: any) => {
    valid = !errors;
  });
  return valid;
}

function getData(): Record<string, any> {
  return { ...form.value };
}

function submit(param: Record<string, any>): Promise<any> {
  return ChannelMerchantUmsApi.create({
    ...param,
    ...form.value,
  });
}

function handlePrev() {
  emit('prev');
}

function handleSubmit() {
  formRef.value?.validate().then(() => {
    submitLoading.value = true;
    const param = {
      mchNo: mchNo.value,
      product: productCode.value,
      channel: 'ums',
      ...form.value,
    };
    submit(param)
      .then(() => {
        createSuccess.value = true;
        message.success($t('payment.merchant.channelMerchant.createSuccess'));
      })
        .finally(() => {
          submitLoading.value = false;
        });
    }).catch(() => {});
  }

function resetForm() {
  nextTick(() => {
    formRef.value?.resetFields();
  });
}

defineExpose({ init, validate, getData, submit });
</script>

<template>
  <div v-if="visible">
    <div v-if="!createSuccess">
      <a-spin :spinning="submitLoading">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        :validate-trigger="['blur', 'change']"
      >
        <!-- 国际化：商户名称 -->
        <a-form-item :label="$t('payment.merchant.channelMerchant.channelMerchantName')" name="channelMerchantName">
          <a-input
            v-model:value="form.channelMerchantName"
            :placeholder="$t('payment.merchant.channelMerchant.pleaseInputName')"
          />
        </a-form-item>
        <!-- 国际化：所属支付产品 -->
        <a-form-item :label="$t('payment.merchant.channelMerchant.selectedProduct')">
          <a-input :value="productDisplayName" disabled />
        </a-form-item>
        <!-- 国际化：沙箱环境 -->
        <a-form-item :label="$t('payment.channel.ums.sandbox')" name="sandbox">
          <a-switch
            v-model:checked="form.sandbox"
            :checked-children="$t('common.yes')"
            :un-checked-children="$t('common.no')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.ums.umsAppId')" name="umsAppId">
          <a-input
            v-model:value="form.umsAppId"
            :placeholder="$t('payment.channel.ums.umsAppIdPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.ums.appKey')" name="appKey">
          <a-input-password
            v-model:value="form.appKey"
            :placeholder="$t('payment.channel.ums.appKeyPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.ums.merchantNo')" name="merchantNo">
          <a-input
            v-model:value="form.merchantNo"
            :placeholder="$t('payment.channel.ums.merchantNoPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.ums.terminalNo')" name="terminalNo">
          <a-input
            v-model:value="form.terminalNo"
            :placeholder="$t('payment.channel.ums.terminalNoPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.ums.orderPrefix')" name="orderPrefix">
          <a-input
            v-model:value="form.orderPrefix"
            :placeholder="$t('payment.channel.ums.orderPrefixPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.ums.secretKey')" name="secretKey">
          <a-input-password
            v-model:value="form.secretKey"
            :placeholder="$t('payment.channel.ums.secretKeyPlaceholder')"
          />
        </a-form-item>

        <div class="flex justify-center gap-4 mt-8 pt-6 border-t border-border">
          <a-button @click="handlePrev">
            {{ $t('payment.merchant.channelMerchant.prevStep') }}
          </a-button>
          <a-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ $t('payment.merchant.channelMerchant.create') }}
          </a-button>
        </div>
      </a-form>
      </a-spin>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-12">
      <div class="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
        <IconifyIcon icon="ant-design:check-circle-filled" class="text-4xl text-green-500" />
      </div>
      <div class="text-xl font-bold text-foreground mb-2">{{
        $t('payment.merchant.channelMerchant.createSuccess')
      }}</div>
      <div class="text-sm text-muted-foreground mb-8">{{
        $t('payment.merchant.channelMerchant.createSuccessDesc')
      }}</div>
      <a-button type="primary" @click="emit('close')">
        {{ $t('payment.merchant.channelMerchant.closePage') }}
      </a-button>
    </div>
  </div>
</template>
