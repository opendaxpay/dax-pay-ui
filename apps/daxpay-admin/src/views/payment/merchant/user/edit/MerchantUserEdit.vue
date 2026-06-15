<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type MerchantUserParam, MerchantUserApi, type UserInfoResult } from '#/api/payment/merchant/merchant-user.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  // 表单引用
  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel } = useFormEdit();
  // 用户ID
  const userId = ref<string>('');

  // 表单数据
  const formState = ref<UserInfoResult>({
    id: '',
    name: '',
    phone: '',
    email: '',
  });

  // 表单校验规则
  const formRules = {
    name: [{ required: true, message: $t('common.pleaseInput') }],
  };

  function resetForm() {
    formState.value = {
      id: '',
      name: '',
      phone: '',
      email: '',
    };
    formRef.value?.resetFields();
  }

  async function show(id: string) {
    userId.value = id;
    initFormEditType(FormEditType.Edit);
    resetForm();
    // 加载用户信息
    const { data } = await MerchantUserApi.findById(id);
    if (data) {
      formState.value = {
        id: data.id || '',
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
      };
    }
  }

  async function handleOk() {
    await formRef.value?.validate();
    confirmLoading.value = true;

    try {
      await MerchantUserApi.update({
        id: userId.value,
        name: formState.value.name,
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
  <a-drawer
    :open="visible"
    :title="title"
    :size="500"
    :styles="{ footer: { textAlign: 'right' } }"
    @close="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      class="form-compact"
    >
      <!-- 名称 -->
      <a-form-item :label="$t('iam.user.field.name')" name="name">
        <a-input v-model:value="formState.name" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
      <!-- 手机号 -->
      <a-form-item :label="$t('iam.user.field.phone')" name="phone">
        <a-input v-model:value="formState.phone" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
      <!-- 邮箱 -->
      <a-form-item :label="$t('iam.user.field.email')" name="email">
        <a-input v-model:value="formState.email" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
