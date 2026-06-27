<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    DouyinDirectChannelMerchantApi,
    type DouyinDirectKeyConfig,
  } from '#/api/payment/channel/douyin/channel-merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'DouyinDirectKeyConfigEdit' });

  const props = defineProps<{
    channelMchNo: string;
  }>();

  const emit = defineEmits<{
    (e: 'saved'): void;
  }>();

  const { labelCol, wrapperCol, confirmLoading, visible, handleCancel, diffForm } = useFormEdit();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  const formRef = ref();
  const form = ref<DouyinDirectKeyConfig>({} as DouyinDirectKeyConfig);
  let rawForm: Record<string, any> = {};

  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  const drawerTitle = $t('payment.channel.douyinManage.directKeyConfigTitle');

  const rules = {
    merchantSerialNumber: [
      { required: true, message: $t('payment.channel.douyin.validation.merchantSerialNumberRequired') },
    ],
    merchantPrivateKey: [
      { required: true, message: $t('payment.channel.douyin.validation.merchantPrivateKeyRequired') },
    ],
    encryptKey: [{ required: true, message: $t('payment.channel.douyin.validation.encryptKeyRequired') }],
  };

  /** 打开抽屉并加载密钥配置 */
  function init() {
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    if (!props.channelMchNo) return;
    confirmLoading.value = true;
    DouyinDirectChannelMerchantApi.findKeyConfig(props.channelMchNo)
      .then(({ data }) => {
        rawForm = { ...data };
        form.value = { ...data } as DouyinDirectKeyConfig;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function handleOk() {
    formRef.value?.validate().then(() => {
      confirmLoading.value = true;
      DouyinDirectChannelMerchantApi.saveKeyConfig({
        ...form.value,
        ...diffForm(rawForm, form.value, 'merchantPrivateKey', 'encryptKey'),
        channelMchNo: props.channelMchNo,
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
        <a-divider orientation="left">{{ $t('payment.channel.douyinManage.keyConfigSection') }}</a-divider>

        <a-form-item :label="$t('payment.channel.douyin.merchantPrivateKey')" name="merchantPrivateKey">
          <a-textarea
            v-model:value="form.merchantPrivateKey"
            :disabled="!canEdit"
            :rows="4"
            :placeholder="$t('payment.channel.douyin.merchantPrivateKeyPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.douyin.merchantSerialNumber')" name="merchantSerialNumber">
          <a-input
            v-model:value="form.merchantSerialNumber"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.douyin.merchantSerialNumberPlaceholder')"
          />
        </a-form-item>

        <a-form-item :label="$t('payment.channel.douyin.encryptKey')" name="encryptKey">
          <a-input
            v-model:value="form.encryptKey"
            :disabled="!canEdit"
            :placeholder="$t('payment.channel.douyin.encryptKeyPlaceholder')"
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
