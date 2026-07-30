<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type WxMchApp, WxMchAppApi } from '#/api/payment/wx/mch-app.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const { existsByServer, useDebounceValidator } = useValidate();

  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType, diffForm } = useFormEdit();

  const formState = ref<WxMchApp>({
    appName: '',
    appType: 'official_account',
    wxAppId: '',
    appSecret: '',
  });
  // 编辑时脱敏回显原始值，用于 diffForm 比对敏感字段
  const originalForm = ref<WxMchApp>({});

  /** 应用类型选项 */
  const appTypeOptions = computed(() => [
    { label: $t('payment.wx.app.appTypeOfficialAccount'), value: 'official_account' },
    { label: $t('payment.wx.app.appTypeMiniProgram'), value: 'mini_program' },
    { label: $t('payment.wx.app.appTypeMobileApp'), value: 'mobile_app' },
  ]);

  async function validateWxAppId() {
    const { wxAppId, id } = formState.value;
    return existsByServer(
      wxAppId,
      id,
      formEditType.value,
      (value) => WxMchAppApi.existsWxAppId(value),
      (value, excludeId) => WxMchAppApi.existsWxAppIdNotId(value, excludeId),
      $t('payment.wx.app.wxAppIdDuplicate'),
    );
  }

  const validateWxAppIdDebounced = useDebounceValidator(formRef, 'wxAppId', validateWxAppId, 500);

  const formRules = {
    appName: [{ required: true, message: $t('payment.wx.app.appNameRequired') }],
    appType: [{ required: true, message: $t('payment.wx.app.appTypeRequired') }],
    wxAppId: [
      { required: true, message: $t('payment.wx.app.wxAppIdRequired') },
      { validator: validateWxAppIdDebounced },
    ],
    // 应用密钥：新增必填；编辑时脱敏回显，未修改由 diffForm 比对跳过更新
    appSecret: [{ required: true, message: $t('payment.wx.app.validation.appSecret') }],
  };

  /** AppSecret 提示文案（按应用类型） */
  const appSecretTooltip = computed(() => {
    const map: Record<string, string> = {
      official_account: 'payment.wx.app.appSecretTooltipOfficialAccount',
      mini_program: 'payment.wx.app.appSecretTooltipMiniProgram',
      mobile_app: 'payment.wx.app.appSecretTooltipMobileApp',
    };
    const key = map[formState.value.appType || 'official_account'];
    return key ? $t(key) : $t('payment.wx.app.appSecretTooltipOfficialAccount');
  });

  function resetForm() {
    formState.value = {
      appName: '',
      appType: 'official_account',
      wxAppId: '',
      appSecret: '',
    };
    originalForm.value = {};
    formRef.value?.resetFields();
    validateWxAppIdDebounced.reset();
  }

  function show() {
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  function showEdit(record: WxMchApp) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    WxMchAppApi.findById(record.id!)
      .then(({ data }) => {
        if (data) {
          formState.value = {
            id: data.id,
            appName: data.appName,
            appType: data.appType || 'official_account',
            wxAppId: data.wxAppId,
            appSecret: data.appSecret,
          };
          originalForm.value = { ...formState.value };
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
      return;
    }
    await validateWxAppId();
    confirmLoading.value = true;
    const payload: WxMchApp = {
      ...formState.value,
      ...diffForm(originalForm.value, formState.value, 'appSecret'),
    };
    const request =
      formEditType.value === FormEditType.Edit ? WxMchAppApi.update(payload) : WxMchAppApi.add(payload);
    request
      .then(() => {
        message.success($t('payment.wx.app.saveSuccess'));
        // 应用类型变更: 后端已自动清除不兼容的支付能力绑定, 提示用户重新配置
        if (formEditType.value === FormEditType.Edit && formState.value.appType !== originalForm.value.appType) {
          message.warning($t('payment.common.app.appTypeChangedCleanup'));
        }
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
        <a-form-item :label="$t('payment.wx.app.appName')" name="appName">
          <a-input
            v-model:value="formState.appName"
            :placeholder="$t('payment.wx.app.appNamePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.wx.app.appType')" name="appType">
          <a-select
            v-model:value="formState.appType"
            :options="appTypeOptions"
            :placeholder="$t('payment.wx.app.appTypeRequired')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.wx.app.wxAppId')" name="wxAppId">
          <a-input
            v-model:value="formState.wxAppId"
            :placeholder="$t('payment.wx.app.wxAppIdPlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.wx.app.appSecret')" name="appSecret" :tooltip="appSecretTooltip">
          <a-input
            v-model:value="formState.appSecret"
            :placeholder="$t('payment.wx.app.appSecretPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
