<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { ModelInstanceApi, ModelTemplateApi, type ModelInstanceParam } from '#/api/risk/model.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  // 默认服务提供商标识（前端暂不展示该字段）
  const DEFAULT_PROVIDER_ID = 'default';

  // 表单引用
  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();
  // 编辑ID
  const editId = ref<null | string>(null);

  // 模型模板下拉选项
  const modelTemplateOptions = ref<LabelValue[]>([]);

  // 表单数据
  const formState = ref<ModelInstanceParam>({
    modelId: '',
    providerId: DEFAULT_PROVIDER_ID,
    instanceName: '',
    status: 'DRAFT',
    configParams: '{}',
  });

  // 状态选项
  // 国际化：状态选项
  const statusOptions = computed(() => [
    { label: $t('risk.modelInstance.base.status.draft'), value: 'DRAFT' },
    { label: $t('risk.modelInstance.base.status.published'), value: 'PUBLISHED' },
    { label: $t('risk.modelInstance.base.status.disabled'), value: 'DISABLED' },
  ]);

  // 表单校验规则
  // 国际化：表单校验规则
  const formRules = computed(() => ({
    modelId: [{ required: true, message: $t('risk.modelInstance.form.add.modelIdPlaceholder') }],
    instanceName: [{ required: true, message: $t('risk.modelInstance.form.add.instanceNamePlaceholder') }],
    status: [{ required: true, message: $t('risk.modelInstance.form.add.statusPlaceholder') }],
  }));

  /** 是否编辑模式 */
  const isEdit = computed(() => formEditType.value === FormEditType.Edit);

  /** 加载模型模板下拉选项 */
  function loadModelTemplateOptions() {
    ModelTemplateApi.dropdown().then((res: any) => {
      modelTemplateOptions.value = res.data || [];
    });
  }

  /** 解析服务提供商标识 */
  function resolveProviderId(providerId?: string) {
    const value = providerId?.trim();
    return value || DEFAULT_PROVIDER_ID;
  }

  /** 重置表单 */
  function resetForm() {
    formState.value = {
      modelId: '',
      providerId: DEFAULT_PROVIDER_ID,
      instanceName: '',
      status: 'DRAFT',
      configParams: '{}',
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
    const { data } = await ModelInstanceApi.findById(id);
    if (data) {
      formState.value = {
        instanceId: data.instanceId || '',
        modelId: data.modelId || '',
        providerId: resolveProviderId(data.providerId),
        instanceName: data.instanceName || '',
        status: data.status || 'DRAFT',
        configParams: data.configParams || '{}',
      };
    }
    confirmLoading.value = false;
  }

  /** 确认提交 */
  async function handleOk() {
    await formRef.value?.validate();
    confirmLoading.value = true;
    const { configParams: _configParams, ...basicFields } = formState.value;
    const params: ModelInstanceParam = {
      ...basicFields,
      providerId: resolveProviderId(formState.value.providerId),
      ...(formEditType.value === FormEditType.Edit ? { id: editId.value! } : { configParams: '{}' }),
    };
    await (formEditType.value === FormEditType.Edit ? ModelInstanceApi.update(params) : ModelInstanceApi.add(params));
    message.success($t('common.success'));
    handleCancel();
    emit('ok');
    confirmLoading.value = false;
  }

  onMounted(() => {
    loadModelTemplateOptions();
  });

  defineExpose({ show, showEdit });
</script>

<template>
  <a-modal
    :open="visible"
    :title="title"
    :confirm-loading="confirmLoading"
    width="520px"
    destroy-on-hidden
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
        <!-- 实例标识（编辑只读） -->
        <a-form-item v-if="isEdit" :label="$t('risk.modelInstance.base.field.instanceId')">
          <a-input v-model:value="formState.instanceId" disabled />
        </a-form-item>
        <!-- 模型标识 -->
        <a-form-item :label="$t('risk.modelInstance.base.field.modelId')" name="modelId">
          <a-select
            v-model:value="formState.modelId"
            :options="modelTemplateOptions"
            :placeholder="$t('risk.modelInstance.form.add.modelIdPlaceholder')"
            :disabled="isEdit"
            allow-clear
          />
        </a-form-item>
        <!-- 实例名称 -->
        <a-form-item :label="$t('risk.modelInstance.base.field.instanceName')" name="instanceName">
          <a-input
            v-model:value="formState.instanceName"
            :placeholder="$t('risk.modelInstance.form.add.instanceNamePlaceholder')"
          />
        </a-form-item>
        <!-- 状态 -->
        <a-form-item :label="$t('risk.modelInstance.base.field.status')" name="status">
          <a-select
            v-model:value="formState.status"
            :options="statusOptions"
            :placeholder="$t('risk.modelInstance.form.add.statusPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
