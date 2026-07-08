<script lang="ts" setup>
  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type HmpayIsvKeyConfig,
    HmpayPayConfigApi,
  } from '#/api/payment/channel/hmpay/isv-config.api';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'HmpayIsvConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();

  const formRef = ref();
  const form = ref<HmpayIsvKeyConfig>({} as HmpayIsvKeyConfig);
  let rawForm: Record<string, any> = {};
  // 当前环境(由管理页传入)
  const sandbox = ref(false);

  // 河马付服务商密钥配置
  const drawerTitle = $t('payment.channel.hmpayIsv.configTitle');

  const rules = {
    sandAppId: [{ required: true, message: $t('payment.channel.hmpayIsv.validation.sandAppId') }],
    privateKey: [{ required: true, message: $t('payment.channel.hmpayIsv.validation.privateKey') }],
    publicKey: [{ required: true, message: $t('payment.channel.hmpayIsv.validation.publicKey') }],
  };

  /** 打开抽屉并加载河马付服务商密钥配置（平台为唯一服务商，密钥全局唯一，按环境区分） */
  function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    HmpayPayConfigApi.findConfig(ProductEnum.HM_PAY, sandbox.value)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = {
          product: ProductEnum.HM_PAY,
          ...data,
        } as HmpayIsvKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true;
      HmpayPayConfigApi.saveConfig({
        ...form.value,
        ...diffForm(rawForm, form.value, 'privateKey', 'publicKey'),
        product: ProductEnum.HM_PAY,
        sandbox: sandbox.value,
      })
        .then(() => {
          message.success($t('common.saveSuccess'));
          handleCancel();
          emit('saved');
        })
        .finally(() => {
          confirmLoading.value = false;
        });
    }).catch(() => {});
  }

  function resetForm() {
    nextTick(() => {
      formRef.value?.resetFields();
    });
  }

  defineExpose({ init });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="drawerTitle"
    size="large"
    :styles="{ footer: { textAlign: 'right' } }"
    :mask-closable="false"
    destroy-on-hidden
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
        :validate-trigger="['blur', 'change']"
      >
        <a-divider orientation="left">{{ $t('payment.channel.hmpayIsv.isvIdentity') }}</a-divider>

        <a-form-item :label="$t('payment.channel.hmpayIsv.sandAppId')" name="sandAppId">
          <a-input
            v-model:value="form.sandAppId"
            :placeholder="$t('payment.channel.hmpayIsv.sandAppIdPlaceholder')"
          />
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.hmpayIsv.keyConfig') }}</a-divider>

        <a-form-item
          :label="$t('payment.channel.hmpayIsv.publicKey')"
          name="publicKey"
          :tooltip="$t('payment.channel.hmpayIsv.publicKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.publicKey"
            :rows="6"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :placeholder="$t('payment.channel.hmpayIsv.publicKeyPlaceholder')"
          />
        </a-form-item>

        <a-form-item
          :label="$t('payment.channel.hmpayIsv.privateKey')"
          name="privateKey"
          :tooltip="$t('payment.channel.hmpayIsv.privateKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.privateKey"
            :rows="6"
            :autosize="{ minRows: 4, maxRows: 12 }"
            :placeholder="$t('payment.channel.hmpayIsv.privateKeyPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
