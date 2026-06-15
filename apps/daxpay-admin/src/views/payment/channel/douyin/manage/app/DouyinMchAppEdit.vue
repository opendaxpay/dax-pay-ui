<script lang="ts" setup>
  import { ref, computed } from 'vue';

  import { $t } from '@vben/locales';

  import { DouyinMchAppApi, type DouyinMchApp } from '#/api/payment/channel/douyin/mch-app.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { FormEditType } from '#/enums/formEditType';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const { existsByServer, useDebounceValidator } = useValidate();

  const formRef = ref();
  const mchNo = ref('');
  const channelMchNo = ref('');

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  const formState = ref<DouyinMchApp>({
    appName: '',
    douyinAppId: '',
    appType: 'mini_program',
  });

  const isEdit = computed(() => formEditType.value === FormEditType.Edit);

  /** 应用类型选项 */
  const appTypeOptions = computed(() => [
    { label: $t('payment.channel.douyinMchApp.appTypeMiniProgram'), value: 'mini_program' },
    { label: $t('payment.channel.douyinMchApp.appTypeMobileApp'), value: 'mobile_app' },
    { label: $t('payment.channel.douyinMchApp.appTypeWebApp'), value: 'web_app' },
  ]);

  async function validateDouyinAppId() {
    const { douyinAppId, id } = formState.value;
    return existsByServer(
      douyinAppId,
      id,
      formEditType.value,
      (value) => DouyinMchAppApi.existsDouyinAppId(mchNo.value, channelMchNo.value, value),
      (value, excludeId) => DouyinMchAppApi.existsDouyinAppIdNotId(mchNo.value, channelMchNo.value, value, excludeId),
      $t('payment.channel.douyinMchApp.douyinAppIdDuplicate'),
    );
  }

  const validateDouyinAppIdDebounced = useDebounceValidator(formRef, 'douyinAppId', validateDouyinAppId, 500);

  const formRules = computed(() => ({
    appName: [{ required: true, message: $t('payment.channel.douyinMchApp.appNameRequired') }],
    appType: isEdit.value ? [] : [{ required: true, message: $t('payment.channel.douyinMchApp.appTypeRequired') }],
    douyinAppId: [
      { required: true, message: $t('payment.channel.douyinMchApp.douyinAppIdRequired') },
      { validator: validateDouyinAppIdDebounced },
    ],
  }));

  function resetForm() {
    formState.value = {
      appName: '',
      douyinAppId: '',
      appType: 'mini_program',
    };
    formRef.value?.resetFields();
  }

  function show(no: string, mchChannelNo: string) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  function showEdit(no: string, mchChannelNo: string, record: DouyinMchApp) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    DouyinMchAppApi.findById(record.id!)
      .then(({ data }) => {
        if (data) {
          formState.value = {
            id: data.id,
            appName: data.appName,
            douyinAppId: data.douyinAppId,
            appType: data.appType || 'mini_program',
          };
        }
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  async function handleOk() {
    await formRef.value?.validate();
    await validateDouyinAppId();
    confirmLoading.value = true;
    const payload: DouyinMchApp = {
      ...formState.value,
      mchNo: mchNo.value,
      channelMchNo: channelMchNo.value,
    };
    const request =
      formEditType.value === FormEditType.Edit ? DouyinMchAppApi.update(payload) : DouyinMchAppApi.add(payload);
    request
      .then(() => {
        message.success($t('payment.channel.douyinMchApp.saveSuccess'));
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
    :width="520"
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
        <a-form-item :label="$t('payment.channel.douyinMchApp.appName')" name="appName">
          <a-input
            v-model:value="formState.appName"
            :placeholder="$t('payment.channel.douyinMchApp.appNamePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.channel.douyinMchApp.appType')" name="appType">
          <a-select
            v-model:value="formState.appType"
            :options="appTypeOptions"
            :disabled="isEdit"
            :placeholder="$t('payment.channel.douyinMchApp.appTypeRequired')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.channel.douyinMchApp.douyinAppId')" name="douyinAppId">
          <a-input
            v-model:value="formState.douyinAppId"
            :placeholder="$t('payment.channel.douyinMchApp.douyinAppIdPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
