<script lang="ts" setup>
  import type { AdapayDirectChannelMerchantCreateParam } from '#/api/payment/channel/adapay/channel-merchant.api';

  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { AdapayDirectChannelMerchantApi } from '#/api/payment/channel/adapay/channel-merchant.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AdapayMchCreateConfig' });

  const emit = defineEmits<{
    (e: 'prev'): void;
    (e: 'close'): void;
  }>();

  const { message } = useMessage();

  const mchNo = ref('');
  const productCode = ref('');
  const channelCode = ref('');
  const formRef = ref();
  const form = ref({
    channelMerchantName: '',
    merchantNo: '',
  });

  const visible = ref(false);
  const createSuccess = ref(false);
  const submitLoading = ref(false);

  /** 支付产品展示名称(优先取国际化映射, 兜底产品编码) */
  const productDisplayName = computed(() => {
    const product = productCode.value;
    if (!product) return '-';
    const i18nKey = productI18nMap[product];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return productNameMap[product] || product;
  });

  const rules = {
    channelMerchantName: [
      { required: true, message: $t('payment.merchant.channelMerchant.channelMerchantNameRequired') },
    ],
    merchantNo: [{ required: true, message: $t('payment.channel.adapay.validation.merchantNo') }],
  };

  function init(no: string, product: string, channel: string) {
    mchNo.value = no;
    productCode.value = product;
    channelCode.value = channel;
    visible.value = true;
    createSuccess.value = false;
    resetForm();
  }

  function handlePrev() {
    emit('prev');
  }

  function handleSubmit() {
    formRef.value
      ?.validate()
      .then(() => {
        submitLoading.value = true;
        AdapayDirectChannelMerchantApi.create({
          mchNo: mchNo.value,
          product: productCode.value,
          ...form.value,
        } as AdapayDirectChannelMerchantCreateParam)
          .then(() => {
            createSuccess.value = true;
            message.success($t('payment.merchant.channelMerchant.createSuccess'));
          })
          .finally(() => {
            submitLoading.value = false;
          });
      })
      .catch(() => {});
  }

  function resetForm() {
    form.value = {
      channelMerchantName: '',
      merchantNo: '',
    };
    nextTick(() => {
      formRef.value?.resetFields();
    });
  }

  defineExpose({ init });
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
          <!-- 国际化: 支付产品 -->
          <a-form-item :label="$t('payment.merchant.channelMerchant.product')">
            <div class="flex items-center gap-2 h-8">
              <ChannelLogo v-if="channelCode" :channel="channelCode" :size="24" />
              <span class="text-foreground">{{ productDisplayName }}</span>
            </div>
          </a-form-item>
          <!-- 国际化: 商户名称 -->
          <a-form-item
            :label="$t('payment.merchant.channelMerchant.channelMerchantName')"
            name="channelMerchantName"
          >
            <a-input
              v-model:value="form.channelMerchantName"
              :placeholder="$t('payment.merchant.channelMerchant.pleaseInputName')"
            />
          </a-form-item>
          <!-- 国际化: Adapay 商户号 -->
          <a-form-item :label="$t('payment.channel.adapay.merchantNo')" name="merchantNo">
            <a-input
              v-model:value="form.merchantNo"
              :placeholder="$t('payment.channel.adapay.merchantNoPlaceholder')"
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
