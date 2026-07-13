<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type FuyouIsvKeyConfig,
    FuyouPayConfigApi,
  } from '#/api/payment/channel/fuyou/pay-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'FuyouIsvConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<FuyouIsvKeyConfig>({} as FuyouIsvKeyConfig);
  let rawForm: Record<string, any> = {};
  // 当前环境(由管理页传入)
  const sandbox = ref(false);

  // 富友权限码
  const canEdit = computed(() => hasPermission(PermCodes.Payment.Isv.MANAGE));

  const drawerTitle = $t('payment.channel.fuyouIsv.configTitle');

  const rules = {
    fyAppId: [{ required: true, message: $t('payment.channel.fuyouIsv.validation.fyAppId') }],
  };

  /** 打开抽屉并加载富友服务商密钥配置（平台为唯一服务商，密钥全局唯一，按环境区分） */
  function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    FuyouPayConfigApi.findConfig(ProductEnum.FUYOU_PAY, sandbox.value)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = {
          product: ProductEnum.FUYOU_PAY,
          ...data,
        } as FuyouIsvKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true;
      FuyouPayConfigApi.saveConfig({
        ...form.value,
        ...diffForm(
          rawForm,
          form.value,
          'privateKey',
          'publicKey',
        ),
        product: ProductEnum.FUYOU_PAY,
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
        <a-divider orientation="left">{{ $t('payment.channel.fuyouIsv.basicConfig') }}</a-divider>

        <a-form-item :label="$t('payment.channel.fuyouIsv.fyAppId')" name="fyAppId">
          <a-input
            v-model:value="form.fyAppId"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.fuyouIsv.fyAppIdPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.fuyouIsv.orderPrefix')" name="orderPrefix">
          <a-input
            v-model:value="form.orderPrefix"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.fuyouIsv.orderPrefixPlaceholder')"
          />
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.fuyouIsv.keyConfig') }}</a-divider>

        <a-form-item :label="$t('payment.channel.fuyouIsv.privateKey')" name="privateKey">
          <a-textarea
            v-model:value="form.privateKey"
            :disabled="!canEdit"
            :rows="4"
            :placeholder="$t('payment.channel.fuyouIsv.privateKeyPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.fuyouIsv.publicKey')" name="publicKey">
          <a-textarea
            v-model:value="form.publicKey"
            :disabled="!canEdit"
            :rows="4"
            :placeholder="$t('payment.channel.fuyouIsv.publicKeyPlaceholder')"
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
