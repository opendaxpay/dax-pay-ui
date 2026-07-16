<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    SensitiveWordApi,
    type SensitiveWordParam,
    type SensitiveWordVo,
  } from '#/api/system/sensitive-word.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, showable, formEditType } =
    useFormEdit();

  const isAdd = computed(() => formEditType.value === FormEditType.Add);

  const formState = ref<SensitiveWordParam>({
    id: '',
    word: '',
    category: 'custom',
    matchMode: 'contains',
    status: 'enable',
    remark: '',
  });

  function resetForm() {
    formState.value = {
      id: '',
      word: '',
      category: 'custom',
      matchMode: 'contains',
      status: 'enable',
      remark: '',
    };
    formRef.value?.resetFields();
  }

  async function fillForm(record: SensitiveWordVo) {
    confirmLoading.value = true;
    try {
      const { data } = await SensitiveWordApi.getById(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        word: row.word,
        category: row.category || 'custom',
        matchMode: row.matchMode || 'contains',
        status: row.status || 'enable',
        remark: row.remark,
      };
    } finally {
      confirmLoading.value = false;
    }
  }

  function showAdd() {
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  async function showEdit(record: SensitiveWordVo) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    await fillForm(record);
  }

  async function showView(record: SensitiveWordVo) {
    initFormEditType(FormEditType.Show);
    resetForm();
    await fillForm(record);
  }

  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    confirmLoading.value = true;
    try {
      if (isAdd.value) {
        await SensitiveWordApi.add(formState.value);
      } else {
        await SensitiveWordApi.update(formState.value);
      }
      message.success($t('common.saveSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ showAdd, showEdit, showView });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="title"
    :width="480"
    :destroy-on-close="true"
    @close="handleCancel"
  >
    <a-form ref="formRef" :model="formState" layout="vertical" :disabled="showable">
      <a-form-item
        name="word"
        :label="$t('system.sensitiveWord.word.field.word')"
        :rules="[{ required: true, message: $t('common.pleaseInput') }]"
      >
        <a-input v-model:value="formState.word" :maxlength="64" allow-clear />
      </a-form-item>
      <a-form-item name="category" :label="$t('system.sensitiveWord.word.field.category')">
        <a-select v-model:value="formState.category">
          <a-select-option value="politic">{{ $t('system.sensitiveWord.word.category.politic') }}</a-select-option>
          <a-select-option value="porn">{{ $t('system.sensitiveWord.word.category.porn') }}</a-select-option>
          <a-select-option value="violence">{{ $t('system.sensitiveWord.word.category.violence') }}</a-select-option>
          <a-select-option value="ad">{{ $t('system.sensitiveWord.word.category.ad') }}</a-select-option>
          <a-select-option value="custom">{{ $t('system.sensitiveWord.word.category.custom') }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item name="matchMode" :label="$t('system.sensitiveWord.word.field.matchMode')">
        <a-radio-group v-model:value="formState.matchMode" button-style="solid">
          <a-radio-button value="contains">{{ $t('system.sensitiveWord.word.matchMode.contains') }}</a-radio-button>
          <a-radio-button value="exact">{{ $t('system.sensitiveWord.word.matchMode.exact') }}</a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item name="status" :label="$t('system.sensitiveWord.word.field.status')">
        <a-radio-group v-model:value="formState.status" button-style="solid">
          <a-radio-button value="enable">{{ $t('system.sensitiveWord.word.status.enable') }}</a-radio-button>
          <a-radio-button value="disable">{{ $t('system.sensitiveWord.word.status.disable') }}</a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item name="remark" :label="$t('system.sensitiveWord.word.field.remark')">
        <a-textarea v-model:value="formState.remark" :rows="3" :maxlength="255" allow-clear />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button v-if="!showable" type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
