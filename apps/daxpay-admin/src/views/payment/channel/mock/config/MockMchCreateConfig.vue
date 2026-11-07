<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    MockChannelMerchantApi,
    type MockChannelMerchantCreateParam,
  } from '#/api/payment/channel/mock/channel-merchant.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * 模拟通道直连商户建档(mock_pay)
   *
   * 纯本地登记: 商户档案在模拟通道控制台创建, 此处登记其通道商户号与展示名称;
   * 模拟通道为独立通道(无对接接口), 通道商户号必须手工登记, 商户级接入密钥在工作台后置维护。
   */
  defineOptions({ name: 'MockMchCreateConfig' });

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
    channelMchNo: '',
    channelMerchantName: '',
  });

  const visible = ref(false);
  const createSuccess = ref(false);
  const submitLoading = ref(false);

  /** 支付产品展示名称(优先国际化映射, 兜底产品编码) */
  const productDisplayName = computed(() => {
    const product = productCode.value;
    if (!product) return '-';
    const i18nKey = productI18nMap[product];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return productNameMap[product] || product;
  });

  const rules = computed(() => ({
    // 通道商户号(模拟通道控制台创建的商户号, 必须手工登记)
    channelMchNo: [{ required: true, message: $t('payment.channel.mock.create.channelMchNoRequired') }],
    // 通道商户名称
    channelMerchantName: [{ required: true, message: $t('payment.channel.mock.create.channelMerchantNameRequired') }],
  }));

  /** 初始化建档表单(由创建流程分发组件调用) */
  function init(no: string, product: string, channel: string) {
    mchNo.value = no;
    productCode.value = product;
    channelCode.value = channel;
    visible.value = true;
    createSuccess.value = false;
    resetForm();
  }

  /** 返回上一步(重选支付产品) */
  function handlePrev() {
    emit('prev');
  }

  /** 提交建档 */
  function handleSubmit() {
    formRef.value
      ?.validate()
      .then(() => {
        submitLoading.value = true;
        const param: MockChannelMerchantCreateParam = {
          mchNo: mchNo.value,
          product: productCode.value,
          channelMchNo: form.value.channelMchNo.trim(),
          channelMerchantName: form.value.channelMerchantName.trim(),
        };
        MockChannelMerchantApi.createMockDirectMerchant(param)
          .then(() => {
            createSuccess.value = true;
            // 国际化：创建成功
            message.success($t('payment.merchant.channelMerchant.createSuccess'));
          })
          .finally(() => {
            submitLoading.value = false;
          });
      })
      .catch(() => {});
  }

  /** 重置表单(切换产品重新进入时避免残留上一次输入) */
  function resetForm() {
    form.value = {
      channelMchNo: '',
      channelMerchantName: '',
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
          <!-- 国际化：支付产品 -->
          <a-form-item :label="$t('payment.merchant.channelMerchant.product')">
            <div class="flex items-center gap-2 h-8">
              <ChannelLogo v-if="channelCode" :product="productCode" :channel="channelCode" :size="24" />
              <span class="text-foreground">{{ productDisplayName }}</span>
            </div>
          </a-form-item>
          <!-- 国际化：通道商户名称 -->
          <a-form-item :label="$t('payment.channel.mock.create.channelMerchantName')" name="channelMerchantName">
            <a-input
              v-model:value="form.channelMerchantName"
              :placeholder="$t('payment.merchant.channelMerchant.pleaseInputName')"
            />
          </a-form-item>
          <!-- 国际化：通道商户号(模拟通道控制台创建的商户号, 必须手工登记) -->
          <a-form-item
            :label="$t('payment.channel.mock.create.channelMchNo')"
            name="channelMchNo"
          >
            <a-input
              v-model:value="form.channelMchNo"
              allow-clear
              :placeholder="$t('payment.channel.mock.create.channelMchNoPlaceholder')"
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

    <!-- 建档成功: 与其它通道创建流程同款成功态 -->
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
