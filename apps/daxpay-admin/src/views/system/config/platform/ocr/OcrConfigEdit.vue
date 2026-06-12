<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type OcrConfig, OcrConfigApi } from '#/api/system/ocr-config.api';
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
  const form = ref<OcrConfig>({});
  // 原始数据，用于检测敏感字段是否被修改
  const originalForm = ref<OcrConfig>({});

  // 供应商选项
  const providerOptions = [
    { label: $t('system.platform.ocr.providerOptions.aliyun'), value: 'ALIYUN' },
    { label: $t('system.platform.ocr.providerOptions.tencent'), value: 'TENCENT' },
  ];

  // 表单校验规则
  const rules = {
    // 配置名称
    configName: [{ required: true, message: $t('system.platform.ocr.inputConfigName') }],
    // 供应商
    provider: [{ required: true, message: $t('system.platform.ocr.selectProvider') }],
    // 访问端点
    endpoint: [{ required: true, message: $t('system.platform.ocr.inputEndpoint') }],
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
      OcrConfigApi.findById(id!)
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
        await OcrConfigApi.add(form.value)
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
        const submitData: OcrConfig = {
          ...form.value,
          ...sensitiveData,
        };
        await OcrConfigApi.update(submitData)
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
        <a-form-item :label="$t('system.platform.ocr.configName')" name="configName">
          <a-input
            v-model:value="form.configName"
            :disabled="showable"
            :placeholder="$t('system.platform.ocr.inputConfigName')"
          />
        </a-form-item>
        <!-- 供应商 -->
        <a-form-item :label="$t('system.platform.ocr.provider')" name="provider">
          <a-select
            v-model:value="form.provider"
            :disabled="showable"
            :placeholder="$t('system.platform.ocr.selectProvider')"
            :options="providerOptions"
          />
        </a-form-item>
        <!-- 访问端点 -->
        <a-form-item :label="$t('system.platform.ocr.endpoint')" name="endpoint">
          <a-input
            v-model:value="form.endpoint"
            :disabled="showable"
            :placeholder="$t('system.platform.ocr.inputEndpoint')"
          />
        </a-form-item>
        <!-- AccessKey -->
        <!-- 国际化：AccessKey -->
        <a-form-item :label="$t('system.platform.ocr.accessKey')" name="accessKey">
          <!-- 国际化：请输入AccessKey -->
          <a-input
            v-model:value="form.accessKey"
            :disabled="showable"
            :placeholder="$t('system.platform.ocr.inputAccessKey')"
          />
        </a-form-item>
        <!-- SecretKey -->
        <!-- 国际化：SecretKey -->
        <a-form-item :label="$t('system.platform.ocr.secretKey')" name="secretKey">
          <!-- 国际化：请输入SecretKey -->
          <a-input
            v-model:value="form.secretKey"
            :disabled="showable"
            :placeholder="$t('system.platform.ocr.inputSecretKey')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
