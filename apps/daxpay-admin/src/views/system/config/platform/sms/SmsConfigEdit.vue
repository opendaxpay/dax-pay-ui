<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type SmsConfig, SmsConfigApi } from '#/api/system/sms-config.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emits = defineEmits(['ok']);

  const { message } = useMessage();

  const {
    initFormEditType,
    handleCancel,
    labelCol,
    wrapperCol,
    modalWidth,
    visible,
    title,
    confirmLoading,
    showable,
    formEditType,
    diffForm,
  } = useFormEdit();

  const formRef = ref();
  // 表单数据
  const form = ref<SmsConfig>({});
  // 原始数据，用于检测敏感字段是否被修改
  const originalForm = ref<SmsConfig>({});

  // 供应商选项
  const providerOptions = [
    { label: $t('system.platform.sms.providerOptions.aliyun'), value: 'ALIYUN' },
    { label: $t('system.platform.sms.providerOptions.tencent'), value: 'TENCENT' },
  ];

  // 表单校验规则
  const rules = {
    // 配置名称
    configName: [{ required: true, message: $t('system.platform.sms.inputConfigName') }],
    // 供应商
    provider: [{ required: true, message: $t('system.platform.sms.selectProvider') }],
    // 短信签名
    signature: [{ required: true, message: $t('system.platform.sms.inputSignature') }],
  };

  /**
   * 入口
   */
  function init(id: string | undefined, editType: FormEditType) {
    initFormEditType(editType);
    resetForm();
    getInfo(id, editType);
  }

  /**
   * 获取信息
   */
  function getInfo(id: string | undefined, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true;
      SmsConfigApi.findById(id!)
        .then(({ data }) => {
          form.value = data;
          // 记录原始值，用于后续比较
          originalForm.value = { ...data };
        })
        .finally(() => {
          confirmLoading.value = false;
        });
    } else {
      confirmLoading.value = false;
    }
  }

  /**
   * 重置表单
   */
  function resetForm() {
    formRef.value?.clearValidate();
    form.value = {};
    originalForm.value = {};
  }

  /**
   * 提交
   */
  function handleOk() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true;
      if (formEditType.value === FormEditType.Add) {
        await SmsConfigApi.add(form.value)
          .then(() => {
            message.success($t('common.success'));
            handleCancel();
            emits('ok');
          })
          .finally(() => {
            confirmLoading.value = false;
          });
      } else if (formEditType.value === FormEditType.Edit) {
        // 使用diffForm处理敏感字段，未修改的字段返回undefined
        const sensitiveData = diffForm(originalForm, form, 'accessKey', 'secretKey');
        const submitData: SmsConfig = {
          ...form.value,
          ...sensitiveData,
        };
        await SmsConfigApi.update(submitData)
          .then(() => {
            message.success($t('common.success'));
            handleCancel();
            emits('ok');
          })
          .finally(() => {
            confirmLoading.value = false;
          });
      }
    });
  }

  defineExpose({ init });
</script>

<template>
  <a-modal
    :open="visible"
    :title="title"
    :confirm-loading="confirmLoading"
    :width="modalWidth"
    :mask-closable="showable"
    :ok-text="$t('common.save')"
    :cancel-text="$t('common.cancel')"
    :ok-button-props="{ disabled: showable }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
        class="form-compact"
      >
        <!-- 主键 -->
        <a-form-item name="id" :hidden="true">
          <a-input v-model:value="form.id" :disabled="showable" />
        </a-form-item>
        <!-- 配置名称 -->
        <a-form-item :label="$t('system.platform.sms.configName')" name="configName">
          <a-input
            v-model:value="form.configName"
            :disabled="showable"
            :placeholder="$t('system.platform.sms.inputConfigName')"
          />
        </a-form-item>
        <!-- 供应商 -->
        <a-form-item :label="$t('system.platform.sms.provider')" name="provider">
          <a-select
            v-model:value="form.provider"
            :disabled="showable"
            :placeholder="$t('system.platform.sms.selectProvider')"
            :options="providerOptions"
          />
        </a-form-item>
        <!-- 短信签名 -->
        <a-form-item :label="$t('system.platform.sms.signature')" name="signature">
          <a-input
            v-model:value="form.signature"
            :disabled="showable"
            :placeholder="$t('system.platform.sms.inputSignature')"
          />
        </a-form-item>
        <!-- AccessKey -->
        <!-- 国际化：AccessKey -->
        <a-form-item :label="$t('system.platform.sms.accessKey')" name="accessKey">
          <!-- 国际化：请输入AccessKey -->
          <a-input
            v-model:value="form.accessKey"
            :disabled="showable"
            :placeholder="$t('system.platform.sms.inputAccessKey')"
          />
        </a-form-item>
        <!-- SecretKey -->
        <!-- 国际化：SecretKey -->
        <a-form-item :label="$t('system.platform.sms.secretKey')" name="secretKey">
          <!-- 国际化：请输入SecretKey -->
          <a-input
            v-model:value="form.secretKey"
            :disabled="showable"
            :placeholder="$t('system.platform.sms.inputSecretKey')"
          />
        </a-form-item>
        <!-- 注册短信模板ID -->
        <a-form-item :label="$t('system.platform.sms.registerId')" name="registerId">
          <a-input
            v-model:value="form.registerId"
            :disabled="showable"
            :placeholder="$t('system.platform.sms.inputRegisterId')"
          />
        </a-form-item>
        <!-- 忘记密码短信模板ID -->
        <a-form-item :label="$t('system.platform.sms.forgetId')" name="forgetId">
          <a-input
            v-model:value="form.forgetId"
            :disabled="showable"
            :placeholder="$t('system.platform.sms.inputForgetId')"
          />
        </a-form-item>
        <!-- 验证码短信模板ID -->
        <a-form-item :label="$t('system.platform.sms.captchaId')" name="captchaId">
          <a-input
            v-model:value="form.captchaId"
            :disabled="showable"
            :placeholder="$t('system.platform.sms.inputCaptchaId')"
          />
        </a-form-item>
        <!-- 通知短信模板ID -->
        <a-form-item :label="$t('system.platform.sms.noticeId')" name="noticeId">
          <a-input
            v-model:value="form.noticeId"
            :disabled="showable"
            :placeholder="$t('system.platform.sms.inputNoticeId')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
