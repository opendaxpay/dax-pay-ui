<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type InputParamSetParam, type InputParamSetResult, InputParamSetApi } from '#/api/risk/model.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);
  const { message } = useMessage();

  // 表单引用
  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  // 表单数据
  const formState = ref<InputParamSetParam>({});

  // 表单校验规则
  const formRules = computed(() => ({
    name: [{ required: true, message: $t('risk.inputParamSet.form.add.namePlaceholder') }],
  }));

  /** 重置表单 */
  function resetForm() {
    formState.value = {};
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
      const res = await InputParamSetApi.findById(id);
      const row = res.data;
      formState.value = {
        id: row.id,
        name: row.name || '',
        description: row.description || '',
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
      if (formEditType.value === FormEditType.Edit) {
        await InputParamSetApi.update(formState.value);
      } else {
        await InputParamSetApi.add(formState.value);
      }
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
        <!-- 名称 -->
        <a-form-item :label="$t('risk.inputParamSet.base.field.name')" name="name">
          <a-input v-model:value="formState.name" :placeholder="$t('risk.inputParamSet.form.add.namePlaceholder')" />
        </a-form-item>
        <!-- 描述 -->
        <a-form-item :label="$t('risk.inputParamSet.base.field.description')" name="description">
          <a-textarea
            v-model:value="formState.description"
            :placeholder="$t('risk.inputParamSet.form.add.descriptionPlaceholder')"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
