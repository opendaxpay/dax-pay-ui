<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type FuyouDirectKeyConfig,
    FuyouDirectPayConfigApi,
  } from '#/api/payment/channel/fuyou/direct-pay-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'FuyouDirectKeyConfigEdit' });

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<FuyouDirectKeyConfig>({} as FuyouDirectKeyConfig);
  let rawForm: Record<string, any> = {};
  // 当前通道商户号(由管理页传入)
  const channelMchNo = ref('');

  // 富友权限码(密钥挂通道商户维度)
  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  const drawerTitle = $t('payment.channel.fuyouDirect.configTitle');

  const rules = {
    mchntCd: [{ required: true, message: $t('payment.channel.fuyouDirect.validation.mchntCd') }],
  };

  /** 打开抽屉并加载富友直连商户密钥配置（按通道商户维度） */
  function open(mchChannelNo: string) {
    channelMchNo.value = mchChannelNo;
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    FuyouDirectPayConfigApi.findConfig(channelMchNo.value)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = { ...data } as FuyouDirectKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        FuyouDirectPayConfigApi.saveConfig({
          ...form.value,
          ...diffForm(rawForm, form.value, 'mchntKey'),
          channelMchNo: channelMchNo.value,
        })
          .then(() => {
            message.success($t('common.saveSuccess'));
            handleCancel();
            emit('saved');
          })
          .finally(() => {
            confirmLoading.value = false;
          });
      })
      .catch(() => {});
  }

  function resetForm() {
    nextTick(() => {
      formRef.value?.resetFields();
    });
  }

  defineExpose({ open });
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
        <a-divider orientation="left">{{ $t('payment.channel.fuyouDirect.keyConfig') }}</a-divider>

        <a-form-item :label="$t('payment.channel.fuyouDirect.mchntCd')" name="mchntCd">
          <a-input
            v-model:value="form.mchntCd"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.fuyouDirect.mchntCdPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.fuyouDirect.mchntKey')" name="mchntKey">
          <a-input-password
            v-model:value="form.mchntKey"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.fuyouDirect.mchntKeyPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.fuyouDirect.termNo')" name="termNo">
          <a-input
            v-model:value="form.termNo"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.fuyouDirect.termNoPlaceholder')"
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
