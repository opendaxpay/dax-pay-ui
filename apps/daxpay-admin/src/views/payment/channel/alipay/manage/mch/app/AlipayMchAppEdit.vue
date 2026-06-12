<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { AlipayMchAppApi, type AlipayMchApp } from '#/api/payment/alipayMchApp.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const { existsByServer, useDebounceValidator } = useValidate();

  const formRef = ref();
  const mchNo = ref('');
  const channelMchNo = ref('');

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  // 表单数据
  const formState = ref<AlipayMchApp>({
    appName: '',
    aliAppId: '',
  });

  /** 校验同一通道商户下应用 ID 不可重复 */
  async function validateAliAppId() {
    const { aliAppId, id } = formState.value;
    return existsByServer(
      aliAppId,
      id,
      formEditType.value,
      (value) => AlipayMchAppApi.existsAliAppId(mchNo.value, channelMchNo.value, value),
      (value, excludeId) =>
        AlipayMchAppApi.existsAliAppIdNotId(mchNo.value, channelMchNo.value, value, excludeId),
      $t('payment.channel.alipayMchApp.aliAppIdDuplicate'),
    );
  }

  const validateAliAppIdDebounced = useDebounceValidator(formRef, 'aliAppId', validateAliAppId, 500);

  const formRules = {
    appName: [{ required: true, message: $t('payment.channel.alipayMchApp.appNameRequired') }],
    aliAppId: [
      { required: true, message: $t('payment.channel.alipayMchApp.aliAppIdRequired') },
      { validator: validateAliAppIdDebounced },
    ],
  };

  function resetForm() {
    formState.value = {
      appName: '',
      aliAppId: '',
    };
    formRef.value?.resetFields();
  }

  function show(no: string, mchChannelNo: string) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  function showEdit(no: string, mchChannelNo: string, record: AlipayMchApp) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    AlipayMchAppApi.findById(record.id!)
      .then(({ data }) => {
        if (data) {
          formState.value = {
            id: data.id,
            appName: data.appName,
            aliAppId: data.aliAppId,
          };
        }
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  async function handleOk() {
    await formRef.value?.validate();
    await validateAliAppId();
    confirmLoading.value = true;
    const payload: AlipayMchApp = {
      ...formState.value,
      mchNo: mchNo.value,
      channelMchNo: channelMchNo.value,
    };
    const request =
      formEditType.value === FormEditType.Edit ? AlipayMchAppApi.update(payload) : AlipayMchAppApi.add(payload);
    request
      .then(() => {
        message.success($t('payment.channel.alipayMchApp.saveSuccess'));
        handleCancel();
        emit('ok');
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  defineExpose({ show, showEdit });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="480"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="form-compact"
      >
        <a-form-item :label="$t('payment.channel.alipayMchApp.appName')" name="appName">
          <a-input
            v-model:value="formState.appName"
            :placeholder="$t('payment.channel.alipayMchApp.appNamePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.channel.alipayMchApp.aliAppId')" name="aliAppId">
          <a-input
            v-model:value="formState.aliAppId"
            :placeholder="$t('payment.channel.alipayMchApp.aliAppIdPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
