<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { ConfigParamApi, type ConfigParamParam } from '#/api/risk/model.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  const props = defineProps<{
    modelId: string;
  }>();

  const emit = defineEmits(['ok']);
  const { message } = useMessage();
  const { existsByServer, useDebounceValidator } = useValidate();

  const formRef = ref(); // 表单引用
  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  // 参数类型选项
  const paramTypeOptions = computed(() => [
    { label: $t('risk.configParam.base.paramType.string'), value: 'STRING' },
    { label: $t('risk.configParam.base.paramType.number'), value: 'NUMBER' },
    { label: $t('risk.configParam.base.paramType.boolean'), value: 'BOOLEAN' },
  ]);

  // 表单数据

  const formState = ref<ConfigParamParam>({
    paramCode: '',
    paramName: '',
    paramType: 'STRING',
    defaultValue: '',
    sortNo: 0,
  });

  // 表单校验规则
  // 国际化：参数编码和名称校验提示
  const formRules = computed(() => ({
    paramCode: [
      { required: true, message: $t('risk.configParam.form.add.paramCodePlaceholder') },
      { validator: useDebounceValidator(formRef, 'paramCode', validateParamCode, 500) },
    ],
    paramName: [{ required: true, message: $t('risk.configParam.form.add.paramNamePlaceholder') }],
    paramType: [{ required: true, message: $t('risk.configParam.form.add.paramTypePlaceholder') }],
    defaultValue: [{ required: true, message: $t('risk.configParam.form.add.defaultValuePlaceholder') }],
    sortNo: [{ required: true, message: $t('risk.configParam.form.add.sortNoPlaceholder') }],
  }));

  /** 参数编码判重校验 */
  async function validateParamCode() {
    const { paramCode, id } = formState.value;
    return existsByServer(
      paramCode,
      id,
      formEditType.value,
      (value: string) => ConfigParamApi.existsByParamCode(props.modelId, value),
      (value: string, excludeId: string) => ConfigParamApi.existsByParamCodeNotId(props.modelId, value, excludeId),
      $t('risk.configParam.form.add.paramCodeDuplicate'),
    );
  }

  /** 重置表单 */
  function resetForm() {
    formState.value = {
      paramCode: '',
      paramName: '',
      paramType: 'STRING',
      defaultValue: '',
      sortNo: 0,
    };
    formRef.value?.resetFields();
  }

  /** 新增模式 */
  function show() {
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /** 编辑模式 */
  async function showEdit(id: string) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    try {
      const res = await ConfigParamApi.findById(id);
      const row = res.data;
      formState.value = {
        id: row.id!,
        modelId: props.modelId,
        paramCode: row.paramCode || '',
        paramName: row.paramName || '',
        paramType: row.paramType || 'STRING',
        defaultValue: row.defaultValue || '',
        sortNo: row.sortNo ?? 0,
      };
    } finally {
      confirmLoading.value = false;
    }
  }

  /** 参数类型变更时重置默认值 */
  function handleParamTypeChange() {
    formState.value.defaultValue = '';
  }

  /** 确认提交 */
  async function handleOk() {
    await formRef.value?.validate();
    confirmLoading.value = true;
    try {
      const params: ConfigParamParam = {
        ...formState.value,
        modelId: props.modelId,
      };
      await (formEditType.value === FormEditType.Edit ? ConfigParamApi.update(params) : ConfigParamApi.add(params));
      message.success($t('common.success'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show, showEdit });
</script>

<template>
  <a-modal
    :open="visible"
    :title="title"
    :width="500"
    :confirm-loading="confirmLoading"
    :mask-closable="false"
    :focusable="{ trap: false }"
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
        class="mt-4 form-compact"
      >
        <!-- 参数编码 -->
        <a-form-item :label="$t('risk.configParam.base.field.paramCode')" name="paramCode" validate-first>
          <a-input
            v-model:value="formState.paramCode"
            :placeholder="$t('risk.configParam.form.add.paramCodePlaceholder')"
          />
        </a-form-item>
        <!-- 参数名称 -->
        <a-form-item :label="$t('risk.configParam.base.field.paramName')" name="paramName">
          <a-input
            v-model:value="formState.paramName"
            :placeholder="$t('risk.configParam.form.add.paramNamePlaceholder')"
          />
        </a-form-item>
        <!-- 参数类型 -->
        <a-form-item :label="$t('risk.configParam.base.field.paramType')" name="paramType">
          <a-select
            v-model:value="formState.paramType"
            :options="paramTypeOptions"
            :placeholder="$t('risk.configParam.form.add.paramTypePlaceholder')"
            @change="handleParamTypeChange"
          />
        </a-form-item>
        <!-- 默认值 -->
        <a-form-item :label="$t('risk.configParam.base.field.defaultValue')" name="defaultValue">
          <!-- 字符串类型 -->
          <a-input
            v-if="formState.paramType !== 'NUMBER' && formState.paramType !== 'BOOLEAN'"
            v-model:value="formState.defaultValue"
            :placeholder="$t('risk.configParam.form.add.defaultValuePlaceholder')"
          />
          <!-- 数值类型 -->
          <a-input-number
            v-if="formState.paramType === 'NUMBER'"
            v-model:value="formState.defaultValue"
            :placeholder="$t('risk.configParam.form.add.defaultValuePlaceholder')"
            style="width: 100%"
          />
          <!-- 布尔类型 -->
          <a-select
            v-if="formState.paramType === 'BOOLEAN'"
            v-model:value="formState.defaultValue"
            :placeholder="$t('risk.configParam.form.add.defaultValuePlaceholder')"
            allow-clear
          >
            <a-select-option value="true">{{ $t('risk.configParam.base.boolean.true') }}</a-select-option>
            <a-select-option value="false">{{ $t('risk.configParam.base.boolean.false') }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="$t('risk.configParam.base.field.sortNo')" name="sortNo">
          <a-input-number
            v-model:value="formState.sortNo"
            :min="0"
            :placeholder="$t('risk.configParam.form.add.sortNoPlaceholder')"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
