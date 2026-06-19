<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    WechatMchAppApi,
    type WechatMchApp,
  } from '#/api/payment/channel/wechat/mch-app.api';
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

  const formState = ref<WechatMchApp>({
    appName: '',
    appType: 'official_account',
    wxAppId: '',
  });

  const isEdit = computed(() => formEditType.value === FormEditType.Edit);

  /** 应用类型选项 */
  const appTypeOptions = computed(() => [
    {
      label: $t('payment.channel.wechatMchApp.appTypeOfficialAccount'),
      value: 'official_account',
    },
    { label: $t('payment.channel.wechatMchApp.appTypeMiniProgram'), value: 'mini_program' },
    { label: $t('payment.channel.wechatMchApp.appTypeMobileApp'), value: 'mobile_app' },
  ]);

  async function validateWxAppId() {
    const { wxAppId, id } = formState.value;
    return existsByServer(
      wxAppId,
      id,
      formEditType.value,
      (value) => WechatMchAppApi.existsWxAppId(mchNo.value, channelMchNo.value, value),
      (value, excludeId) =>
        WechatMchAppApi.existsWxAppIdNotId(mchNo.value, channelMchNo.value, value, excludeId),
      $t('payment.channel.wechatMchApp.wxAppIdDuplicate'),
    );
  }

  const validateWxAppIdDebounced = useDebounceValidator(formRef, 'wxAppId', validateWxAppId, 500);

  const formRules = computed(() => ({
    appName: [{ required: true, message: $t('payment.channel.wechatMchApp.appNameRequired') }],
    appType: isEdit.value
      ? []
      : [{ required: true, message: $t('payment.channel.wechatMchApp.appTypeRequired') }],
    wxAppId: [
      { required: true, message: $t('payment.channel.wechatMchApp.wxAppIdRequired') },
      { validator: validateWxAppIdDebounced },
    ],
  }));

  function resetForm() {
    formState.value = {
      appName: '',
      appType: 'official_account',
      wxAppId: '',
    };
    formRef.value?.resetFields();
  }

  function show(no: string, mchChannelNo: string) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  function showEdit(no: string, mchChannelNo: string, record: WechatMchApp) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    WechatMchAppApi.findById(record.id!)
      .then(({ data }) => {
        if (data) {
          formState.value = {
            id: data.id,
            appName: data.appName,
            appType: data.appType || 'official_account',
            wxAppId: data.wxAppId,
          };
        }
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败：表单已显示错误提示
      return;
    }
    await validateWxAppId();
    confirmLoading.value = true;
    const payload: WechatMchApp = {
      ...formState.value,
      mchNo: mchNo.value,
      channelMchNo: channelMchNo.value,
    };
    const request =
      formEditType.value === FormEditType.Edit
        ? WechatMchAppApi.update(payload)
        : WechatMchAppApi.add(payload);
    request
      .then(() => {
        message.success($t('payment.channel.wechatMchApp.saveSuccess'));
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
        <a-form-item :label="$t('payment.channel.wechatMchApp.appName')" name="appName">
          <a-input
            v-model:value="formState.appName"
            :placeholder="$t('payment.channel.wechatMchApp.appNamePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.channel.wechatMchApp.appType')" name="appType">
          <a-select
            v-model:value="formState.appType"
            :options="appTypeOptions"
            :disabled="isEdit"
            :placeholder="$t('payment.channel.wechatMchApp.appTypeRequired')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.channel.wechatMchApp.wxAppId')" name="wxAppId">
          <a-input
            v-model:value="formState.wxAppId"
            :placeholder="$t('payment.channel.wechatMchApp.wxAppIdPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
