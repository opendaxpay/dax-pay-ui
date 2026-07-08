<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type VbillIsvKeyConfig,
    VbillPayConfigApi,
  } from '#/api/payment/channel/vbill/pay-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'VbillIsvConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<VbillIsvKeyConfig>({} as VbillIsvKeyConfig);
  let rawForm: Record<string, any> = {};
  // 当前环境(由管理页传入)
  const sandbox = ref(false);

  const canEdit = computed(() => hasPermission(PermCodes.Payment.Vbill.MANAGE));

  const drawerTitle = $t('payment.channel.vbillIsv.configTitle');

  const rules = {
    orgId: [{ required: true, message: $t('payment.channel.vbillIsv.validation.orgId') }],
    // 国际化: 脱敏字段始终必填, 编辑时预填脱敏值, 未修改由 diffForm 比对跳过更新
    publicKey: [{ required: true, message: $t('payment.channel.vbillIsv.validation.publicKey') }],
    privateKey: [{ required: true, message: $t('payment.channel.vbillIsv.validation.privateKey') }],
  };

  /** 打开抽屉并加载随行付服务商密钥配置（平台为唯一服务商，密钥全局唯一，按环境区分） */
  function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    VbillPayConfigApi.findConfig(ProductEnum.VBILL_PAY, sandbox.value)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = {
          product: ProductEnum.VBILL_PAY,
          ...data,
        } as VbillIsvKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true;
      VbillPayConfigApi.saveConfig({
        ...form.value,
        ...diffForm(
          rawForm,
          form.value,
          'privateKey',
          'publicKey',
        ),
        product: ProductEnum.VBILL_PAY,
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
        <a-divider orientation="left">{{ $t('payment.channel.vbillIsv.basicConfig') }}</a-divider>

        <!-- 国际化: 天阙机构ID -->
        <a-form-item :label="$t('payment.channel.vbillIsv.orgId')" name="orgId">
          <a-input
            v-model:value="form.orgId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.vbillIsv.orgIdPlaceholder')"
          />
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.vbillIsv.keyConfig') }}</a-divider>

        <!-- 国际化: 天阙RSA公钥 -->
        <a-form-item
          :label="$t('payment.channel.vbillIsv.publicKey')"
          name="publicKey"
          :tooltip="$t('payment.channel.vbillIsv.publicKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.publicKey"
            :disabled="!canEdit"
            :rows="3"
            :placeholder="$t('payment.channel.vbillIsv.publicKeyTooltip')"
          />
        </a-form-item>

        <!-- 国际化: 商户RSA私钥 -->
        <a-form-item
          :label="$t('payment.channel.vbillIsv.privateKey')"
          name="privateKey"
          :tooltip="$t('payment.channel.vbillIsv.privateKeyTooltip')"
        >
          <a-textarea
            v-model:value="form.privateKey"
            :disabled="!canEdit"
            :rows="3"
            :placeholder="$t('payment.channel.vbillIsv.privateKeyTooltip')"
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
