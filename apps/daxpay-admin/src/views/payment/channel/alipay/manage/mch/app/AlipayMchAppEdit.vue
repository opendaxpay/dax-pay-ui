<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type AlipayMchApp, AlipayMchAppApi } from '#/api/payment/channel/alipay/mch-app.api';
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

  /** 应用类型选项 */
  const appTypeOptions = computed(() => [
    { label: $t('payment.channel.alipayMchApp.appTypeMiniProgram'), value: 'mini_program' },
    { label: $t('payment.channel.alipayMchApp.appTypeMobileApp'), value: 'mobile_app' },
    { label: $t('payment.channel.alipayMchApp.appTypeWebApp'), value: 'web_app' },
  ]);

  // 表单数据
  const formState = ref<AlipayMchApp>({
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
      (value) => AlipayMchAppApi.existsAliAppId(mchNo.value, channelMchNo.value, value),
      (value, excludeId) => AlipayMchAppApi.existsAliAppIdNotId(mchNo.value, channelMchNo.value, value, excludeId),
      $t('payment.channel.alipayMchApp.aliAppIdDuplicate'),
    );
  }

  const validateAliAppIdDebounced = useDebounceValidator(formRef, 'aliAppId', validateAliAppId, 500);

  const formRules = {
    appName: [{ required: true, message: $t('payment.channel.alipayMchApp.appNameRequired') }],
    appType: [{ required: true, message: $t('payment.channel.alipayMchApp.appTypeRequired') }],
    aliAppId: [
      { required: true, message: $t('payment.channel.alipayMchApp.aliAppIdRequired') },
      { validator: validateAliAppIdDebounced },
    ],
  };

  function resetForm() {
    formState.value = {
      appName: '',
      aliAppId: '',
      appType: 'mini_program',
    };
    formRef.value?.resetFields();
    // 清空防抖校验缓存，避免上次（新增/编辑）判重结果污染本次会话
    validateAliAppIdDebounced.reset();
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
        <a-form-item :label="$t('payment.channel.alipayMchApp.appName')" name="appName">
          <a-input
            v-model:value="formState.appName"
            :placeholder="$t('payment.channel.alipayMchApp.appNamePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.channel.alipayMchApp.appType')" name="appType">
          <a-select
            v-model:value="formState.appType"
            :options="appTypeOptions"
            :placeholder="$t('payment.channel.alipayMchApp.appTypeRequired')"
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
