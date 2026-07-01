<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type WechatIsvApp, WechatIsvAppApi } from '#/api/payment/channel/wechat/isv-app.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const { existsByServer, useDebounceValidator } = useValidate();

  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  const formState = ref<WechatIsvApp>({
    appName: '',
    appType: 'official_account',
    wxAppId: '',
  });

  /** 应用类型选项 */
  const appTypeOptions = computed(() => [
    { label: $t('payment.channel.wechatManage.appTypeOfficialAccount'), value: 'official_account' },
    { label: $t('payment.channel.wechatManage.appTypeMiniProgram'), value: 'mini_program' },
    { label: $t('payment.channel.wechatManage.appTypeMobileApp'), value: 'mobile_app' },
  ]);

  async function validateWxAppId() {
    const { wxAppId, id } = formState.value;
    return existsByServer(
      wxAppId,
      id,
      formEditType.value,
      (value) => WechatIsvAppApi.existsWxAppId(value),
      (value, excludeId) => WechatIsvAppApi.existsWxAppIdNotId(value, excludeId),
      $t('payment.channel.wechatManage.wxAppIdDuplicate'),
    );
  }

  const validateWxAppIdDebounced = useDebounceValidator(formRef, 'wxAppId', validateWxAppId, 500);

  const formRules = {
    appName: [{ required: true, message: $t('payment.channel.wechatManage.appNameRequired') }],
    appType: [{ required: true, message: $t('payment.channel.wechatManage.appTypeRequired') }],
    wxAppId: [
      { required: true, message: $t('payment.channel.wechatManage.wxAppIdRequired') },
      { validator: validateWxAppIdDebounced },
    ],
  };

  function resetForm() {
    formState.value = {
      appName: '',
      appType: 'official_account',
      wxAppId: '',
    };
    formRef.value?.resetFields();
    // 清空防抖校验缓存，避免上次（新增/编辑）判重结果污染本次会话
    validateWxAppIdDebounced.reset();
  }

  function show() {
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  function showEdit(record: WechatIsvApp) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    WechatIsvAppApi.findById(record.id!)
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
    const payload: WechatIsvApp = {
      ...formState.value,
    };
    const request =
      formEditType.value === FormEditType.Edit ? WechatIsvAppApi.update(payload) : WechatIsvAppApi.add(payload);
    request
      .then(() => {
        message.success($t('payment.channel.wechatManage.saveSuccess'));
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
        <a-form-item :label="$t('payment.channel.wechatManage.appName')" name="appName">
          <a-input
            v-model:value="formState.appName"
            :placeholder="$t('payment.channel.wechatManage.appNamePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.channel.wechatManage.appType')" name="appType">
          <a-select
            v-model:value="formState.appType"
            :options="appTypeOptions"
            :placeholder="$t('payment.channel.wechatManage.appTypeRequired')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.channel.wechatManage.wxAppId')" name="wxAppId">
          <a-input
            v-model:value="formState.wxAppId"
            :placeholder="$t('payment.channel.wechatManage.wxAppIdPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
