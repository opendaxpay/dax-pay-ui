<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';

import { $t } from '@vben/locales';

import { IconifyIcon } from '@vben-core/icons';

import { type AlipayIsvApp, AlipayIsvAppApi } from '#/api/payment/alipayIsvApp.api';
import { ChannelMerchantAlipayApi } from '#/api/payment/channelMerchant.api';
import ChannelLogo from '#/components/channel/ChannelLogo.vue';
import { channelI18nMap, channelNameMap } from '#/enums/payment';
import { useMessage } from '#/hooks/useMessage';

defineOptions({ name: 'AlipayMchCreateConfig' });

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'close'): void;
}>();

const { message } = useMessage();

const mchNo = ref('');
const isvNo = ref('');
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

const rules = computed(() => ({
  channelMerchantName: [{ required: true, message: $t('payment.merchant.channelMerchant.channelMerchantNameRequired') }],
  isvAppId: [{ required: true, message: $t('payment.merchant.channelMerchant.alipayIsvAppRequired') }],
  alipayUserId: [{ required: true, message: $t('payment.merchant.channelMerchant.alipaySubMerchantNoRequired') }],
  appAuthToken: [{ required: true, message: $t('payment.merchant.channelMerchant.appAuthTokenRequired') }],
}));

/** 支付宝应用下拉选项（antdv-next Select 需使用 options 属性） */
const isvAppOptions = computed(() =>
  isvAppList.value.map((item) => ({
    value: item.aliAppId,
    label: `${item.appName} (${item.aliAppId})`,
  })),
);

function loadIsvAppList() {
  if (!isvNo.value) {
    isvAppList.value = [];
    return;
  }
  isvAppLoading.value = true;
  AlipayIsvAppApi.listByIsvNo(isvNo.value)
    .then(({ data }) => {
      isvAppList.value = data || [];
    })
    .finally(() => {
      isvAppLoading.value = false;
    });
}

function init(no: string, product: string, channel: string, isv: string) {
  mchNo.value = no;
  isvNo.value = isv;
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
  return ChannelMerchantAlipayApi.create({
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
      channel: 'alipay',
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
  });
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
