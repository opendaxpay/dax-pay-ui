<script lang="ts" setup>
  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type Role, RoleApi } from '#/api/iam/perm/role.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useClientOptions } from '#/hooks/useClientOptions';
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
  // 角色表单数据
  const form = ref<Role>({});

  // 终端类型选项(主数据, 排除网关端)
  const { options: clientCodeSelectOptions } = useClientOptions(true);

  // 防抖判重校验
  const validateCodeDebounced = useDebounceValidator(formRef, 'code', validateCode, 500);

  // 表单校验规则
  const rules = {
    // 角色编码（含防抖判重）
    code: [{ required: true, message: $t('iam.role.inputCode') }, { validator: validateCodeDebounced }],
    // 国际化Key
    i18nKey: [{ required: true, message: $t('iam.menu.inputI18nKey') }],
    // 终端类型
    clientCode: [{ required: true, message: $t('iam.role.selectClientCode') }],
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
      RoleApi.findById(id!).then(({ data }) => {
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
      RoleApi.existsByCode,
      RoleApi.existsByCodeNotId,
      $t('iam.role.codeExists'),
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
          await RoleApi.add(form.value).finally(() => (confirmLoading.value = false));
          message.success($t('common.saveSuccess'));
        } else if (formEditType.value === FormEditType.Edit) {
          await RoleApi.update(form.value).finally(() => (confirmLoading.value = false));
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
        <!-- 角色编码 -->
        <a-form-item :label="$t('iam.role.code')" name="code" validate-first>
          <a-input v-model:value="form.code" :disabled="showable" :placeholder="$t('iam.role.inputCode')" />
        </a-form-item>
        <!-- 国际化Key -->
        <a-form-item :label="$t('iam.menu.i18nKey')" name="i18nKey">
          <a-input v-model:value="form.i18nKey" :disabled="showable" :placeholder="$t('iam.menu.inputI18nKey')" />
        </a-form-item>
        <!-- 终端类型 -->
        <a-form-item :label="$t('common.clientType')" name="clientCode">
          <!-- 国际化：请选择终端类型 -->
          <a-select
            v-model:value="form.clientCode"
            :disabled="showable"
            :options="clientCodeSelectOptions"
            :placeholder="$t('iam.role.selectClientCode')"
          />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item v-if="editable || showable" :label="$t('iam.role.remark')" name="remark">
          <!-- 国际化：请输入备注 -->
          <a-textarea
            v-model:value="form.remark"
            :rows="3"
            :disabled="showable"
            :placeholder="$t('iam.role.inputRemark')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
