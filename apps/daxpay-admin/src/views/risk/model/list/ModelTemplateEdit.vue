<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { InputParamSetApi, ModelTemplateApi, type ModelTemplateParam } from '#/api/risk/model.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  // 表单引用
  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType, editable } = useFormEdit();
  // 编辑ID
  const editId = ref<null | string>(null);

  // 表单数据
  const formState = ref<ModelTemplateParam>({
    modelId: '',
    modelName: '',
    description: '',
    status: 'DRAFT',
    inputParamSetCode: '',
  });

  // 参数集合下拉选项
  // 国际化：参数集合下拉选项
  const inputParamSetOptions = ref<LabelValue[]>([]);

  // 表单校验规则
  // 国际化：表单校验规则
  const formRules = computed(() => ({
    modelName: [{ required: true, message: $t('risk.model.form.add.modelNamePlaceholder') }],
    status: [{ required: true, message: $t('risk.model.form.add.statusPlaceholder') }],
  }));

  // 状态选项
  // 国际化：状态选项
  const statusOptions = computed(() => [
    { label: $t('risk.model.base.status.draft'), value: 'DRAFT' },
    { label: $t('risk.model.base.status.published'), value: 'PUBLISHED' },
    { label: $t('risk.model.base.status.disabled'), value: 'DISABLED' },
  ]);

  /** 加载参数集合下拉选项 */
  function loadInputParamSetOptions() {
    InputParamSetApi.dropdown().then((res: any) => {
      inputParamSetOptions.value = res.data || [];
    });
  }

  /** 重置表单 */
  function resetForm() {
    formState.value = {
      modelId: '',
      modelName: '',
      description: '',
      status: 'DRAFT',
      inputParamSetCode: '',
    };
    formRef.value?.resetFields();
  }

  /**
   * 新增模式
   */
  function show() {
    initFormEditType(FormEditType.Add);
    editId.value = null;
    resetForm();
  }

  /**
   * 编辑模式
   */
  async function showEdit(id: string) {
    initFormEditType(FormEditType.Edit);
    editId.value = id;
    resetForm();
    confirmLoading.value = true;
    try {
      const { data } = await ModelTemplateApi.findById(id);
      if (data) {
        formState.value = {
          modelId: data.modelId || '',
          modelName: data.modelName || '',
          description: data.description || '',
          status: data.status || 'DRAFT',
          inputParamSetCode: data.inputParamSetCode || '',
        };
      }
    } finally {
      confirmLoading.value = false;
    }
  }

  /** 确认提交 */
  async function handleOk() {
    await formRef.value?.validate();
    confirmLoading.value = true;
    try {
      const params: ModelTemplateParam = {
        ...formState.value,
        ...(formEditType.value === FormEditType.Edit ? { id: editId.value } : {}),
      };
      await (formEditType.value === FormEditType.Edit ? ModelTemplateApi.update(params) : ModelTemplateApi.add(params));
      message.success($t('common.success'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  onMounted(() => {
    loadInputParamSetOptions();
  });

  defineExpose({ show, showEdit });
</script>

<template>
  <a-modal
    :open="visible"
    :title="title"
    :width="600"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
    :mask-closable="false"
    :focusable="{ trap: false }"
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
        <!-- 模型ID -->
        <a-form-item v-if="editable" :label="$t('risk.model.base.field.modelId')">
          <a-input v-model:value="formState.modelId" disabled />
        </a-form-item>
        <!-- 模型名称 -->
        <a-form-item :label="$t('risk.model.base.field.modelName')" name="modelName">
          <a-input v-model:value="formState.modelName" :placeholder="$t('risk.model.form.add.modelNamePlaceholder')" />
        </a-form-item>
        <!-- 参数集合（从参数集合库中选择，用于模型运行时读取参数） -->
        <a-form-item :label="$t('risk.model.base.field.inputParamSetCode')" name="inputParamSetCode">
          <a-select
            v-model:value="formState.inputParamSetCode"
            :options="inputParamSetOptions"
            :placeholder="$t('risk.model.form.add.inputParamSetCodePlaceholder')"
            allow-clear
          />
        </a-form-item>
        <!-- 描述 -->
        <a-form-item :label="$t('risk.model.base.field.description')" name="description">
          <a-textarea
            v-model:value="formState.description"
            :placeholder="$t('risk.model.form.add.descriptionPlaceholder')"
            :rows="3"
          />
        </a-form-item>
        <!-- 状态 -->
        <a-form-item :label="$t('risk.model.base.field.status')" name="status">
          <a-select
            v-model:value="formState.status"
            :options="statusOptions"
            :placeholder="$t('risk.model.form.add.statusPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
