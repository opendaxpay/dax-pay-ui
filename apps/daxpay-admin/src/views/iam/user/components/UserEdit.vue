<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type User, UserApi } from '#/api/iam/user.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  // 表单引用
  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel } = useFormEdit();
  // 用户ID
  const userId = ref('');

  // 表单数据
  const formState = ref<User>({});

  // 表单校验规则
  const formRules = {
    // 姓名
    name: [{ required: true, message: $t('common.pleaseInput') }],
  };

  function resetForm() {
    formState.value = {};
    formRef.value?.resetFields();
  }

  async function show(id: string) {
    initFormEditType(FormEditType.Edit);
    userId.value = id;
    resetForm();

    confirmLoading.value = true;
    try {
      const res = await UserApi.findById(id);
      formState.value = res.data;
    } finally {
      confirmLoading.value = false;
    }
  }

  async function handleOk() {
    await formRef.value?.validate();
    confirmLoading.value = true;

    try {
      await UserApi.update({
        id: userId.value,
        name: formState.value.name,
        account: formState.value.account,
        clientCode: formState.value.clientCode,
        phone: formState.value.phone,
        email: formState.value.email,
      });

      message.success($t('common.success'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show });
</script>

<template>
  <a-modal
    :open="visible"
    :title="title"
    :width="600"
    :confirm-loading="confirmLoading"
    :ok-text="$t('common.save')"
    :cancel-text="$t('common.cancel')"
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
        <!-- 姓名 -->
        <a-form-item :label="$t('iam.user.field.name')" name="name">
          <a-input v-model:value="formState.name" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 账号（不可编辑） -->
        <a-form-item :label="$t('iam.user.field.account')">
          <a-input v-model:value="formState.account" disabled />
        </a-form-item>
        <!-- 手机号 -->
        <a-form-item :label="$t('iam.user.field.phone')">
          <a-input v-model:value="formState.phone" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 邮箱 -->
        <a-form-item :label="$t('iam.user.field.email')">
          <a-input v-model:value="formState.email" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
