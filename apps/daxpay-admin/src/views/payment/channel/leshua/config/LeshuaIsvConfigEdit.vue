<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type LeshuaIsvKeyConfig,
    LeshuaPayConfigApi,
  } from '#/api/payment/channel/leshua/pay-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { ProductEnum } from '#/enums/payment/productEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'LeshuaIsvConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<LeshuaIsvKeyConfig>({} as LeshuaIsvKeyConfig);
  let rawForm: Record<string, any> = {};
  // 当前环境(由管理页传入)
  const sandbox = ref(false);

  // 乐刷权限码(参考 lakala, 需在 PermCodes 中注册)
  const canEdit = computed(() => hasPermission(PermCodes.Payment.Isv.MANAGE));

  const drawerTitle = $t('payment.channel.leshuaIsv.configTitle');

  const signTypeOptions = [
    { label: 'MD5', value: 'MD5' },
    { label: 'SM3', value: 'SM3' },
  ];

  const rules = {
    lsMchNo: [{ required: true, message: $t('payment.channel.leshuaIsv.validation.lsMchNo') }],
    tradeKey: [{ required: true, message: $t('payment.channel.leshuaIsv.validation.tradeKey') }],
    signType: [{ required: true, message: $t('payment.channel.leshuaIsv.validation.signType') }],
  };

  /** 打开抽屉并加载乐刷服务商密钥配置（平台为唯一服务商，密钥全局唯一，按环境区分） */
  function init(isSandbox: boolean) {
    sandbox.value = isSandbox;
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    LeshuaPayConfigApi.findConfig(ProductEnum.LESHUA_PAY, sandbox.value)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = {
          product: ProductEnum.LESHUA_PAY,
          ...data,
        } as LeshuaIsvKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true;
      LeshuaPayConfigApi.saveConfig({
        ...form.value,
        ...diffForm(
          rawForm,
          form.value,
          'tradeKey',
          'notifyKey',
        ),
        product: ProductEnum.LESHUA_PAY,
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
        <a-divider orientation="left">{{ $t('payment.channel.leshuaIsv.basicConfig') }}</a-divider>

        <a-form-item :label="$t('payment.channel.leshuaIsv.lsMchNo')" name="lsMchNo">
          <a-input
            v-model:value="form.lsMchNo"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.leshuaIsv.lsMchNoPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.leshuaIsv.signType')" name="signType">
          <a-radio-group v-model:value="form.signType" button-style="solid" :disabled="!canEdit">
            <a-radio-button v-for="opt in signTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </a-radio-button>
          </a-radio-group>
        </a-form-item>

        <a-divider orientation="left">{{ $t('payment.channel.leshuaIsv.keyConfig') }}</a-divider>

        <a-form-item :label="$t('payment.channel.leshuaIsv.tradeKey')" name="tradeKey">
          <a-input-password
            v-model:value="form.tradeKey"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.leshuaIsv.tradeKeyPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.leshuaIsv.notifyKey')" name="notifyKey">
          <a-input-password
            v-model:value="form.notifyKey"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.leshuaIsv.notifyKeyPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.leshuaIsv.lsIsvNo')" name="lsIsvNo">
          <a-input
            v-model:value="form.lsIsvNo"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.leshuaIsv.lsIsvNoPlaceholder')"
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
