<script lang="ts" setup>
  import type { Dict } from '#/api/system/dict/dict.api';

  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type DictItem, DictItemApi } from '#/api/system/dict/dict-item.api';
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
  // 字典项表单数据
  const form = ref<DictItem>({});

  // 当前字典ID
  let currentDictId: string | undefined;

  // 字典项编码防抖判重校验
  const validateCodeDebounced = useDebounceValidator(formRef, 'code', validateCode, 500);

  // 表单校验规则
  const rules = {
    // 字典项编码（含防抖判重）
    code: [{ required: true, message: $t('system.dict.item.inputItemCode') }, { validator: validateCodeDebounced }],
    // 国际化Key
    i18nKey: [{ required: true, message: $t('system.dict.item.inputI18nKey') }],
  };

  /**
   * 入口
   */
  function init(id: string | undefined, editType: FormEditType, dict?: Dict) {
    initFormEditType(editType);
    resetForm();
    currentDictId = dict?.id!;
    getInfo(id, editType);
  }

  /**
   * 获取信息
   */
  function getInfo(id: string | undefined, editType: FormEditType) {
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true;
      DictItemApi.findById(id!).then(({ data }) => {
        form.value = data;
        currentDictId = data.dictId;
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
      () => DictItemApi.existsByCode(code!, currentDictId!),
      (value, excludeId) => DictItemApi.existsByCodeNotId(value, currentDictId!, excludeId!),
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
          await DictItemApi.add(form.value).finally(() => (confirmLoading.value = false));
          message.success($t('common.saveSuccess'));
        } else if (formEditType.value === FormEditType.Edit) {
          await DictItemApi.update(form.value).finally(() => (confirmLoading.value = false));
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
        <!-- 字典ID -->
        <a-form-item :label="$t('system.dict.dictId')" name="dictId" :hidden="true">
          <a-input v-model:value="form.dictId" :disabled="showable" />
        </a-form-item>
        <!-- 字典项编码 -->
        <a-form-item :label="$t('system.dict.item.code')" name="code" validate-first>
          <a-input v-model:value="form.code" :disabled="showable" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 国际化Key -->
        <a-form-item :label="$t('system.dict.item.i18nKey')" name="i18nKey">
          <a-input v-model:value="form.i18nKey" :disabled="showable" :placeholder="$t('system.dict.item.inputI18nKey')" />
        </a-form-item>
        <!-- 排序 -->
        <a-form-item :label="$t('system.dict.item.sortNo')" name="sortNo">
          <a-input-number v-model:value="form.sortNo" :precision="2" :disabled="showable" style="width: 100%" />
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
        <!-- 备注 -->
        <a-form-item v-if="editable || showable" :label="$t('system.dict.remark')" name="remark">
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
