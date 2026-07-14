<script lang="ts" setup>
  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type Dict, DictApi } from '#/api/system/dict/dict.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  const emits = defineEmits(['ok']);

  const { message } = useMessage();
  const { existsByServer, useDebounceValidator } = useValidate();

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
    editable,
    formEditType,
  } = useFormEdit();

  const formRef = ref();
  // 字典表单数据
  const form = ref<Dict>({ enable: true });

  // 字典编码防抖判重校验
  const validateCodeDebounced = useDebounceValidator(formRef, 'code', validateCode, 500);

  // 表单校验规则
  const rules = {
    code: [{ required: true, message: $t('system.dict.inputCode') }, { validator: validateCodeDebounced }],
    name: [{ required: true, message: $t('system.dict.inputName') }],
    // 国际化Key校验
    i18nKey: [{ required: true, message: $t('iam.menu.inputI18nKey') }],
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
      DictApi.findById(id!).then(({ data }) => {
        form.value = data;
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
    // 清空防抖校验缓存，避免上次（新增/编辑）判重结果污染本次会话
    validateCodeDebounced.reset();
    nextTick(() => {
      formRef.value?.resetFields();
    });
  }

  /**
   * 校验编码重复
   */
  async function validateCode() {
    const { code, id } = form.value;
    return existsByServer(
      code,
      id,
      formEditType.value,
      DictApi.existsByCode,
      DictApi.existsByCodeNotId,
      $t('system.dict.codeExists'),
    );
  }

  /**
   * 提交
   */
  function handleOk() {
    formRef.value
      ?.validate()
      .then(async () => {
        confirmLoading.value = true;
        if (formEditType.value === FormEditType.Add) {
          await DictApi.add(form.value).finally(() => (confirmLoading.value = false));
          message.success($t('common.saveSuccess'));
        } else if (formEditType.value === FormEditType.Edit) {
          console.info(form.value);
          await DictApi.update(form.value).finally(() => (confirmLoading.value = false));
          message.success($t('common.saveSuccess'));
        }
        handleCancel();
        emits('ok');
      })
      .catch(() => {});
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
        <a-form-item :label="$t('common.id')" name="id" :hidden="true">
          <a-input v-model:value="form.id" :disabled="showable" />
        </a-form-item>
        <!-- 字典编码 -->
        <a-form-item :label="$t('system.dict.code')" name="code" validate-first>
          <a-input v-model:value="form.code" :disabled="showable" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 字典名称 -->
        <a-form-item :label="$t('system.dict.name')" name="name">
          <a-input v-model:value="form.name" :disabled="showable" :placeholder="$t('system.dict.inputName')" />
        </a-form-item>
        <!-- 国际化Key -->
        <a-form-item :label="$t('iam.menu.i18nKey')" name="i18nKey">
          <a-input v-model:value="form.i18nKey" :disabled="showable" :placeholder="$t('iam.menu.inputI18nKey')" />
        </a-form-item>
        <!-- 启用状态 -->
        <a-form-item :label="$t('system.dict.enable')" name="enable">
          <!-- 国际化：停用 -->
          <a-switch
            v-model:checked="form.enable"
            :disabled="showable"
            :checked-children="$t('system.dict.enabled')"
            :un-checked-children="$t('system.dict.disabled')"
          />
        </a-form-item>
        <!-- 字典类型 -->
        <a-form-item :label="$t('system.dict.dictType')" name="dictType">
          <a-input v-model:value="form.dictType" :disabled="showable" :placeholder="$t('system.dict.inputDictType')" />
        </a-form-item>
        <!-- 内置字典 -->
        <a-form-item v-if="editable || showable" :label="$t('system.dict.internal')" name="internal">
          <!-- 国际化：否 -->
          <a-switch
            v-model:checked="form.internal"
            disabled
            :checked-children="$t('system.dict.yes')"
            :un-checked-children="$t('system.dict.no')"
          />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item :label="$t('system.dict.remark')" name="remark">
          <!-- 国际化：请输入备注 -->
          <a-textarea
            v-model:value="form.remark"
            :rows="3"
            :disabled="showable"
            :placeholder="$t('system.dict.inputRemark')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
