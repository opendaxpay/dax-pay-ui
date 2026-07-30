<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    AlipayDirectAppApi,
    type AlipayDirectAppParam,
    type AlipayDirectAppResult,
  } from '#/api/payment/alipay/alipay-direct-app.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const { existsByServer, useDebounceValidator } = useValidate();

  const formRef = ref();
  const channelMchNo = ref('');

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  /** 应用类型选项 */
  const appTypeOptions = computed(() => [
    { label: $t('payment.merchant.alipayDirectApp.appTypeMiniProgram'), value: 'mini_program' },
    { label: $t('payment.merchant.alipayDirectApp.appTypeMobileApp'), value: 'mobile_app' },
    { label: $t('payment.merchant.alipayDirectApp.appTypeWebApp'), value: 'web_app' },
  ]);

  // 表单数据
  const formState = ref<AlipayDirectAppParam>({
    channelMchNo: '',
    appName: '',
    aliAppId: '',
    appType: 'mini_program',
  });
  // 编辑时记录原始应用类型, 用于切换后提示能力绑定已被清除
  const originalAppType = ref('mini_program');

  /** 校验同一通道商户下应用 ID 不可重复 */
  async function validateAliAppId() {
    const { aliAppId, id } = formState.value;
    return existsByServer(
      aliAppId,
      id,
      formEditType.value,
      (value) => AlipayDirectAppApi.existsAliAppId(channelMchNo.value, value),
      (value, excludeId) => AlipayDirectAppApi.existsAliAppIdNotId(channelMchNo.value, value, excludeId),
      $t('payment.merchant.alipayDirectApp.aliAppIdDuplicate'),
    );
  }

  const validateAliAppIdDebounced = useDebounceValidator(formRef, 'aliAppId', validateAliAppId, 500);

  const formRules = {
    appName: [{ required: true, message: $t('payment.merchant.alipayDirectApp.appNameRequired') }],
    appType: [{ required: true, message: $t('payment.merchant.alipayDirectApp.appTypeRequired') }],
    aliAppId: [
      { required: true, message: $t('payment.merchant.alipayDirectApp.aliAppIdRequired') },
      { validator: validateAliAppIdDebounced },
    ],
  };

  function resetForm() {
    formState.value = {
      channelMchNo: channelMchNo.value,
      appName: '',
      aliAppId: '',
      appType: 'mini_program',
    };
    formRef.value?.resetFields();
    // 清空防抖校验缓存，避免上次（新增/编辑）判重结果污染本次会话
    validateAliAppIdDebounced.reset();
  }

  function show(cMchNo: string) {
    channelMchNo.value = cMchNo;
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  function showEdit(cMchNo: string, record: AlipayDirectAppResult) {
    channelMchNo.value = cMchNo;
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    AlipayDirectAppApi.findById(record.id!)
      .then(({ data }) => {
        if (data) {
          formState.value = {
            id: data.id,
            channelMchNo: channelMchNo.value,
            appName: data.appName ?? '',
            aliAppId: data.aliAppId ?? '',
            appType: data.appType || 'mini_program',
          };
          originalAppType.value = data.appType || 'mini_program';
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
    await validateAliAppId();
    confirmLoading.value = true;
    const payload: AlipayDirectAppParam = {
      ...formState.value,
      channelMchNo: channelMchNo.value,
    };
    const request =
      formEditType.value === FormEditType.Edit ? AlipayDirectAppApi.update(payload) : AlipayDirectAppApi.add(payload);
    request
      .then(() => {
        message.success($t('common.saveSuccess'));
        // 应用类型变更: 后端已自动清除不兼容的支付能力绑定, 提示用户重新配置
        if (formEditType.value === FormEditType.Edit && formState.value.appType !== originalAppType.value) {
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
        <a-form-item :label="$t('payment.merchant.alipayDirectApp.appName')" name="appName">
          <a-input
            v-model:value="formState.appName"
            :placeholder="$t('payment.merchant.alipayDirectApp.appNamePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.merchant.alipayDirectApp.appType')" name="appType">
          <a-select
            v-model:value="formState.appType"
            :options="appTypeOptions"
            :placeholder="$t('payment.merchant.alipayDirectApp.appTypeRequired')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.merchant.alipayDirectApp.aliAppId')" name="aliAppId">
          <a-input
            v-model:value="formState.aliAppId"
            :placeholder="$t('payment.merchant.alipayDirectApp.aliAppIdPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
