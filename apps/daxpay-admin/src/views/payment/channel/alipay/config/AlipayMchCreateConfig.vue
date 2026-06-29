<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';

import { $t } from '@vben/locales';

import { IconifyIcon } from '@vben-core/icons';

import { type AlipayIsvApp, AlipayIsvAppApi } from '#/api/payment/channel/alipay/isv-app.api';
import {
  type AlipayIsvChannelMerchantCreateParam,
  AlipayIsvChannelMerchantApi,
} from '#/api/payment/channel/alipay/channel-merchant.api';
import ChannelLogo from '#/components/channel/ChannelLogo.vue';
import { channelI18nMap, channelNameMap, productI18nMap, productNameMap } from '#/enums/payment';
import { useMessage } from '#/hooks/useMessage';

defineOptions({ name: 'AlipayMchCreateConfig' });

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
  isvAppId: undefined as string | undefined,
  alipayUserId: '',
  appAuthToken: '',
});

const isvAppList = ref<AlipayIsvApp[]>([]);
const isvAppLoading = ref(false);

const visible = ref(false);
const createSuccess = ref(false);
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

/** 支付产品展示名称，区分服务商/直连等模式 */
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
  channelMerchantName: [{ required: true, message: $t('payment.merchant.channelMerchant.channelMerchantNameRequired') }],
  isvAppId: [{ required: true, message: $t('payment.merchant.channelMerchant.alipayIsvAppRequired') }],
  alipayUserId: [{ required: true, message: $t('payment.merchant.channelMerchant.alipaySubMerchantNoRequired') }],
  appAuthToken: [{ required: false }],
}));

/** 支付宝应用下拉选项(值为系统主键id, 展示应用名+支付宝APPID便于识别) */
const isvAppOptions = computed(() =>
  isvAppList.value.map((item) => ({
    value: item.id,
    label: `${item.appName} (${item.aliAppId})`,
  })),
);

/** 加载支付宝服务商应用下拉列表 */
function loadIsvAppList() {
  isvAppLoading.value = true;
  AlipayIsvAppApi.listAll()
    .then(({ data }) => {
      isvAppList.value = data || [];
    })
    .finally(() => {
      isvAppLoading.value = false;
    });
}

function init(no: string, product: string, channel: string) {
  mchNo.value = no;
  productCode.value = product;
  channelCode.value = channel;
  visible.value = true;
  createSuccess.value = false;
  resetForm();
  loadIsvAppList();
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
  // param 已由 handleSubmit 组装完整(mchNo/product/form 各字段), 直接透传
  return AlipayIsvChannelMerchantApi.create(param as AlipayIsvChannelMerchantCreateParam);
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
  form.value = {
    channelMerchantName: '',
    isvAppId: undefined,
    alipayUserId: '',
    appAuthToken: '',
  };
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
        <!-- 国际化：支付产品 -->
        <a-form-item :label="$t('payment.merchant.channelMerchant.product')">
          <div class="flex items-center gap-2 h-8">
            <ChannelLogo v-if="channelCode" :channel="channelCode" :size="24" />
            <span class="text-foreground">{{ productDisplayName }}</span>
          </div>
        </a-form-item>
        <!-- 国际化：商户名称 -->
        <a-form-item :label="$t('payment.merchant.channelMerchant.channelMerchantName')" name="channelMerchantName">
          <a-input
            v-model:value="form.channelMerchantName"
            :placeholder="$t('payment.merchant.channelMerchant.pleaseInputName')"
          />
        </a-form-item>
        <!-- 国际化：支付宝应用 -->
        <a-form-item name="isvAppId">
          <template #label>
            {{ $t('payment.merchant.channelMerchant.alipayIsvApp') }}
            <a-tooltip :title="$t('payment.merchant.channelMerchant.alipayIsvAppHelp')">
              <IconifyIcon icon="ant-design:question-circle-outlined" class="ml-1 cursor-help text-muted-foreground" />
            </a-tooltip>
          </template>
          <a-select
            v-model:value="form.isvAppId"
            :options="isvAppOptions"
            :loading="isvAppLoading"
            :placeholder="$t('payment.merchant.channelMerchant.alipayIsvAppPlaceholder')"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <!-- 国际化：子商户号 -->
        <a-form-item :label="$t('payment.merchant.channelMerchant.alipaySubMerchantNo')" name="alipayUserId">
          <a-input
            v-model:value="form.alipayUserId"
            :placeholder="$t('payment.merchant.channelMerchant.alipaySubMerchantNoPlaceholder')"
          />
        </a-form-item>
        <!-- 国际化：应用授权令牌 -->
        <a-form-item name="appAuthToken">
          <template #label>
            {{ $t('payment.merchant.channelMerchant.appAuthToken') }}
            <a-tooltip :title="$t('payment.merchant.channelMerchant.appAuthTokenHelp')">
              <IconifyIcon icon="ant-design:question-circle-outlined" class="ml-1 cursor-help text-muted-foreground" />
            </a-tooltip>
          </template>
          <a-input
            v-model:value="form.appAuthToken"
            :placeholder="$t('payment.merchant.channelMerchant.appAuthTokenPlaceholder')"
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
