<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';

import { $t } from '@vben/locales';

import { ChannelMerchantAlipayApi } from '#/api/payment/channelMerchant.api';
import ChannelLogo from '#/components/channel/ChannelLogo.vue';
import { channelI18nMap, channelNameMap } from '#/enums/payment';
import { ProductEnum } from '#/enums/payment/productEnum';
import { useMessage } from '#/hooks/useMessage';

defineOptions({ name: 'AlipayDirectMchCreateConfig' });

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'close'): void;
}>();

const router = useRouter();
const { message } = useMessage();

const mchNo = ref('');
const productCode = ref('');
const channelCode = ref('');
const formRef = ref();
const form = ref({
  channelMerchantName: '',
  alipayUserId: '',
});

const visible = ref(false);
const submitLoading = ref(false);

const channelDisplayName = computed(() => {
  const channel = channelCode.value;
  if (!channel) return '-';
  const i18nKey = channelI18nMap[channel];
  if (i18nKey) {
    return $t(i18nKey);
  }
  return channelNameMap[channel] || channel;
});

const rules = computed(() => ({
  channelMerchantName: [{ required: true, message: $t('payment.merchant.channelMerchant.channelMerchantNameRequired') }],
  alipayUserId: [{ required: true, message: $t('payment.channel.alipay.validation.alipayUserIdRequired') }],
}));

function init(no: string, product: string, channel: string) {
  mchNo.value = no;
  productCode.value = product;
  channelCode.value = channel;
  visible.value = true;
  resetForm();
}

function handlePrev() {
  emit('prev');
}

function handleSubmit() {
  formRef.value?.validate().then(() => {
    submitLoading.value = true;
    ChannelMerchantAlipayApi.createDirect({
      mchNo: mchNo.value,
      product: productCode.value,
      channel: 'alipay',
      ...form.value,
    })
      .then(({ data }) => {
        message.success($t('payment.merchant.channelMerchant.createSuccess'));
        router.push({
          path: '/payment/merchant/channel-merchant/detail',
          query: {
            mchNo: mchNo.value,
            id: data ? String(data) : '',
            product: productCode.value || ProductEnum.ALIPAY,
          },
        });
      })
      .finally(() => {
        submitLoading.value = false;
      });
  });
}

function resetForm() {
  form.value = {
    channelMerchantName: '',
    alipayUserId: '',
  };
  nextTick(() => {
    formRef.value?.resetFields();
  });
}

defineExpose({ init });
</script>

<template>
  <div v-if="visible">
    <a-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      :validate-trigger="['blur', 'change']"
    >
      <!-- 国际化：支付产品 -->
      <a-form-item :label="$t('payment.merchant.channelMerchant.product')">
        <div class="flex items-center gap-2 h-8">
          <ChannelLogo v-if="channelCode" :channel="channelCode" :size="24" />
          <span class="text-foreground">{{ channelDisplayName }}</span>
        </div>
      </a-form-item>
      <!-- 国际化：商户名称 -->
      <a-form-item :label="$t('payment.merchant.channelMerchant.channelMerchantName')" name="channelMerchantName">
        <a-input
          v-model:value="form.channelMerchantName"
          :placeholder="$t('payment.merchant.channelMerchant.pleaseInputName')"
        />
      </a-form-item>
      <!-- 国际化：支付宝商家用户 ID（PID） -->
      <a-form-item :label="$t('payment.channel.alipay.alipayUserId')" name="alipayUserId">
        <a-input
          v-model:value="form.alipayUserId"
          :placeholder="$t('payment.channel.alipay.validation.alipayUserIdRequired')"
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
  </div>
</template>
