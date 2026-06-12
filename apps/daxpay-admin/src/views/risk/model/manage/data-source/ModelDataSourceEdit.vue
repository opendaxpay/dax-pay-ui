<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type ModelDataSourceParam,
    type ModelDataSourceResult,
    DataSourceDefApi,
    ModelDataSourceApi,
  } from '#/api/risk/model.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  const props = defineProps<{
    modelId: string;
  }>();

  const emit = defineEmits(['ok']);
  const { message } = useMessage();
  const { existsByServer } = useValidate();

  const formRef = ref(); // 表单引用
  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  // 数据源定义下拉选项
  const dataSourceDefOptions = ref<LabelValue[]>([]);

  // 加载类型选项
  // 国际化：加载类型选项
  const loadTypeOptions = computed(() => [
    { label: $t('risk.modelDataSource.base.loadType.immediate'), value: 'IMMEDIATE' },
    { label: $t('risk.modelDataSource.base.loadType.lazy'), value: 'LAZY' },
  ]);

  // 表单数据
  const formState = ref<ModelDataSourceParam>({
    loadType: 'IMMEDIATE',
    sortNo: 0,
  });

  // 表单校验规则
  const formRules = computed(() => ({
    dataSourceCode: [
      { required: true, message: $t('risk.modelDataSource.form.add.dataSourceCodePlaceholder') },
      { validator: validateDataSourceCode },
    ],
    loadType: [{ required: true, message: $t('risk.modelDataSource.form.add.loadTypePlaceholder') }],
  }));

  /** 加载数据源定义下拉选项 */
  function loadDataSourceDefOptions() {
    DataSourceDefApi.dropdown().then((res: any) => {
      dataSourceDefOptions.value = res.data || [];
    });
  }

  /** 数据源选择变更 */
  function onDataSourceChange(value: string) {
    const option = dataSourceDefOptions.value.find((o) => o.value === value);
    if (option) {
      formState.value.dataSourceCode = value;
      formState.value.dataSourceName = option.label;
    }
  }

  /** 数据源编码判重校验 */
  async function validateDataSourceCode() {
    // 编辑模式下编码不可修改，跳过判重校验
    if (formEditType.value === FormEditType.Edit) {
      return;
    }
    const { dataSourceCode } = formState.value;
    return existsByServer(
      dataSourceCode,
      undefined,
      formEditType,
      (value: string) => ModelDataSourceApi.existsByDataSourceCode(props.modelId, value),
      (value: string, excludeId: string) =>
        ModelDataSourceApi.existsByDataSourceCodeNotId(props.modelId, value, excludeId),
      // 国际化：数据源编码已存在
      $t('risk.modelDataSource.form.dataSourceCodeDuplicate'),
    );
  }

  /** 重置表单 */
  function resetForm() {
    formState.value = {
      loadType: 'IMMEDIATE',
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
      const res = await ModelDataSourceApi.findById(id);
      const row = res.data;
      formState.value = {
        id: row.id,
        modelId: props.modelId,
        dataSourceCode: row.dataSourceCode || '',
        dataSourceName: row.dataSourceName || '',
        loadType: row.loadType || 'IMMEDIATE',
        sortNo: row.sortNo ?? 0,
      };
    } finally {
      confirmLoading.value = false;
    }
  }

  /** 确认提交 */
  async function handleOk() {
    await formRef.value?.validate();
    confirmLoading.value = true;
    try {
      const params: ModelDataSourceParam = {
        ...formState.value,
        modelId: props.modelId,
      };
      if (formEditType.value === FormEditType.Edit) {
        await ModelDataSourceApi.update(params);
      } else {
        await ModelDataSourceApi.add(params);
      }
      message.success($t('common.success'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  onMounted(() => {
    loadDataSourceDefOptions();
  });

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
        <!-- 数据源编码 -->
        <a-form-item :label="$t('risk.modelDataSource.base.field.dataSourceCode')" name="dataSourceCode" validate-first>
          <a-select
            v-model:value="formState.dataSourceCode"
            :disabled="formEditType === FormEditType.Edit"
            :options="dataSourceDefOptions"
            :placeholder="$t('risk.modelDataSource.form.add.dataSourceCodePlaceholder')"
            @change="onDataSourceChange"
          />
        </a-form-item>
        <!-- 加载类型 -->
        <a-form-item :label="$t('risk.modelDataSource.base.field.loadType')" name="loadType">
          <a-select
            v-model:value="formState.loadType"
            :options="loadTypeOptions"
            :placeholder="$t('risk.modelDataSource.form.add.loadTypePlaceholder')"
          />
        </a-form-item>
        <!-- 排序号 -->
        <a-form-item :label="$t('risk.modelDataSource.base.field.sortNo')" name="sortNo">
          <a-input-number
            v-model:value="formState.sortNo"
            :min="0"
            :placeholder="$t('risk.modelDataSource.form.add.sortNoPlaceholder')"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
