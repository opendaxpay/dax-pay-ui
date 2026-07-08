<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type HkrtIsvKeyConfig,
    HkrtPayConfigApi,
  } from '#/api/payment/channel/hkrt/pay-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'HkrtIsvConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<HkrtIsvKeyConfig>({} as HkrtIsvKeyConfig);
  let rawForm: Record<string, any> = {};
  // 当前环境(由管理页传入)
  const sandbox = ref(false);

  const canEdit = computed(() => hasPermission(PermCodes.Payment.Hkrt.MANAGE));

  const drawerTitle = $t('payment.channel.hkrtIsv.configTitle');

  const rules = {
    agentNo: [{ required: true, message: $t('payment.channel.hkrtIsv.validation.agentNo') }],
    accessId: [{ required: true, message: $t('payment.channel.hkrtIsv.validation.accessId') }],
    accessKey: [{ required: true, message: $t('payment.channel.hkrtIsv.validation.accessKey') }],
  };

  /** 打开抽屉并加载海科融通服务商密钥配置（平台为唯一服务商，密钥全局唯一，按环境区分） */
  function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    HkrtPayConfigApi.findConfig(ProductEnum.HKRT_PAY, sandbox.value)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = {
          product: ProductEnum.HKRT_PAY,
          ...data,
        } as HkrtIsvKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true;
      HkrtPayConfigApi.saveConfig({
        ...form.value,
        ...diffForm(
          rawForm,
          form.value,
          'accessKey',
        ),
        product: ProductEnum.HKRT_PAY,
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
        <a-divider orientation="left">{{ $t('payment.channel.hkrtIsv.basicConfig') }}</a-divider>

        <!-- 国际化: 服务商编号 -->
        <a-form-item :label="$t('payment.channel.hkrtIsv.agentNo')" name="agentNo">
          <a-input
            v-model:value="form.agentNo"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.hkrtIsv.agentNoPlaceholder')"
          />
        </a-form-item>

        <!-- 国际化: 接入机构标识 -->
        <a-form-item :label="$t('payment.channel.hkrtIsv.accessId')" name="accessId">
          <a-input
            v-model:value="form.accessId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.hkrtIsv.accessIdPlaceholder')"
          />
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.hkrtIsv.keyConfig') }}</a-divider>

        <!-- 国际化: 签名密钥 -->
        <a-form-item :label="$t('payment.channel.hkrtIsv.accessKey')" name="accessKey">
          <a-textarea
            v-model:value="form.accessKey"
            :disabled="!canEdit"
            :rows="3"
            :placeholder="$t('payment.channel.hkrtIsv.accessKeyPlaceholder')"
          />
        </a-form-item>

      </a-form>
    </a-spin>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button v-if="canEdit" type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
