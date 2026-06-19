<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type AlipayIsvApp, AlipayIsvAppApi } from '#/api/payment/channel/alipay/isv-app.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const { existsByServer, useDebounceValidator } = useValidate();

  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  /** 表单数据 */
  const formState = ref<AlipayIsvApp>({
    appName: '',
    aliAppId: '',
  });

  /**
   * 校验应用 ID 不可重复
   */
  async function validateAliAppId() {
    const { aliAppId, id } = formState.value;
    return existsByServer(
      aliAppId,
      id,
      formEditType.value,
      (value) => AlipayIsvAppApi.existsAliAppId(value),
      (value, excludeId) => AlipayIsvAppApi.existsAliAppIdNotId(value, excludeId),
      // 国际化：应用 ID 重复
      $t('payment.channel.alipayManage.aliAppIdDuplicate'),
    );
  }

  /** 应用 ID 防抖重复校验 */
  const validateAliAppIdDebounced = useDebounceValidator(formRef, 'aliAppId', validateAliAppId, 500);

  /** 表单校验规则 */
  const formRules = {
    appName: [{ required: true, message: $t('payment.channel.alipayManage.appNameRequired') }],
    aliAppId: [
      { required: true, message: $t('payment.channel.alipayManage.aliAppIdRequired') },
      { validator: validateAliAppIdDebounced },
    ],
  };

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      appName: '',
      aliAppId: '',
    };
    formRef.value?.resetFields();
  }

  /**
   * 打开新增弹窗
   */
  function show() {
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /**
   * 打开编辑弹窗
   */
  function showEdit(record: AlipayIsvApp) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    AlipayIsvAppApi.findById(record.id!)
      .then(({ data }) => {
        if (data) {
          formState.value = {
            id: data.id,
            appName: data.appName,
            aliAppId: data.aliAppId,
          };
        }
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  /**
   * 保存
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败：表单已显示错误提示
      return;
    }
    // 提交前再次校验应用 ID，避免防抖校验尚未完成
    await validateAliAppId();
    confirmLoading.value = true;
    const payload: AlipayIsvApp = {
      ...formState.value,
    };
    const request =
      formEditType.value === FormEditType.Edit ? AlipayIsvAppApi.update(payload) : AlipayIsvAppApi.add(payload);
    request
      .then(() => {
        message.success($t('payment.channel.alipayManage.saveSuccess'));
        handleCancel();
        emit('ok');
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  defineExpose({ show, showEdit });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="480"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
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
        <!-- 应用名称 -->
        <a-form-item :label="$t('payment.channel.alipayManage.appName')" name="appName">
          <a-input
            v-model:value="formState.appName"
            :placeholder="$t('payment.channel.alipayManage.appNamePlaceholder')"
          />
        </a-form-item>
        <!-- 应用 ID -->
        <a-form-item :label="$t('payment.channel.alipayManage.aliAppId')" name="aliAppId">
          <a-input
            v-model:value="formState.aliAppId"
            :placeholder="$t('payment.channel.alipayManage.aliAppIdPlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
