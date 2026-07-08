<script lang="ts" setup>
  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    DougongChannelMerchantApi,
    type DougongIsvChannelMerchant,
  } from '#/api/payment/channel/dougong/channel-merchant.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'DougongMchConfigEdit' });

  const props = defineProps<{ channelMchNo: string }>();

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel } = useFormEdit();

  const { message } = useMessage();

  const formRef = ref();
  const form = ref<DougongIsvChannelMerchant>({} as DougongIsvChannelMerchant);

  const rules = {
    appId: [{ required: true, message: $t('payment.channel.dougongIsv.validation.appId') }],
  };

  /** 打开抽屉并加载斗拱通道商户配置 */
  function init() {
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    DougongChannelMerchantApi.findByChannelMchNo(props.channelMchNo)
      .then(({ data }) => {
        form.value = { ...data } as DougongIsvChannelMerchant;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true;
      DougongChannelMerchantApi.updateAppId(
        props.channelMchNo,
        form.value.appId!,
      )
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
    :title="$t('payment.channel.dougongIsv.mchConfigTitle')"
    size="medium"
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
        <a-form-item :label="$t('payment.channel.dougongIsv.merchantNo')" name="merchantNo">
          <a-input :value="form.merchantNo" disabled />
        </a-form-item>

        <a-form-item
          :label="$t('payment.channel.dougongIsv.appId')"
          name="appId"
          :tooltip="$t('payment.channel.dougongIsv.appIdTooltip')"
        >
          <a-input v-model:value="form.appId" :placeholder="$t('payment.channel.dougongIsv.appIdPlaceholder')" />
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
