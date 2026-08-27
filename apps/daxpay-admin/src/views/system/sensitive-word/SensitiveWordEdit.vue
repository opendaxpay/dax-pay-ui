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

  const {
    visible,
    confirmLoading,
    title,
    initFormEditType,
    handleCancel,
    showable,
    formEditType,
    labelCol,
    wrapperCol,
    modalWidth,
  } = useFormEdit();

  const isAdd = computed(() => formEditType.value === FormEditType.Add);

  // 分类下拉选项（用 options 避免子节点文案空白导致回显 code）
  const categoryOptions = computed(() => [
    { label: $t('system.sensitiveWord.word.category.politic'), value: 'politic' },
    { label: $t('system.sensitiveWord.word.category.porn'), value: 'porn' },
    { label: $t('system.sensitiveWord.word.category.violence'), value: 'violence' },
    { label: $t('system.sensitiveWord.word.category.ad'), value: 'ad' },
    { label: $t('system.sensitiveWord.word.category.custom'), value: 'custom' },
  ]);

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
      // 保存成功
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
        :model="formState"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
        class="form-compact"
        :disabled="showable"
      >
        <!-- 敏感词（tooltip 说明建议简体录入与系统规范化规则） -->
        <a-form-item
          name="word"
          :label="$t('system.sensitiveWord.word.field.word')"
          :tooltip="$t('system.sensitiveWord.tip')"
          :rules="[{ required: true, message: $t('common.pleaseInput') }]"
        >
          <a-input
            v-model:value="formState.word"
            :maxlength="64"
            allow-clear
            :placeholder="$t('system.sensitiveWord.word.placeholder.word')"
          />
        </a-form-item>
        <!-- 分类 -->
        <a-form-item
          name="category"
          :label="$t('system.sensitiveWord.word.field.category')"
          :rules="[{ required: true, message: $t('common.pleaseSelect') }]"
        >
          <a-select
            v-model:value="formState.category"
            :options="categoryOptions"
            :placeholder="$t('common.pleaseSelect')"
          />
        </a-form-item>
        <!-- 匹配模式（tooltip 说明包含 vs 精确） -->
        <a-form-item
          name="matchMode"
          :label="$t('system.sensitiveWord.word.field.matchMode')"
          :tooltip="$t('system.sensitiveWord.word.matchModeHelp')"
          :rules="[{ required: true, message: $t('common.pleaseSelect') }]"
        >
          <a-radio-group v-model:value="formState.matchMode" button-style="solid">
            <a-radio-button value="contains">
              {{ $t('system.sensitiveWord.word.matchMode.contains') }}
            </a-radio-button>
            <a-radio-button value="exact">
              {{ $t('system.sensitiveWord.word.matchMode.exact') }}
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
        <!-- 状态 -->
        <a-form-item
          name="status"
          :label="$t('system.sensitiveWord.word.field.status')"
          :rules="[{ required: true, message: $t('common.pleaseSelect') }]"
        >
          <a-radio-group v-model:value="formState.status" button-style="solid">
            <a-radio-button value="enable">
              {{ $t('system.sensitiveWord.word.status.enable') }}
            </a-radio-button>
            <a-radio-button value="disable">
              {{ $t('system.sensitiveWord.word.status.disable') }}
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
        <!-- 备注 -->
        <a-form-item name="remark" :label="$t('system.sensitiveWord.word.field.remark')">
          <a-textarea
            v-model:value="formState.remark"
            :rows="3"
            :maxlength="255"
            allow-clear
            :placeholder="$t('system.sensitiveWord.word.placeholder.remark')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
