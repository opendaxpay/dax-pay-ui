<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type User, UserApi } from '#/api/iam/user.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message, confirm } = useMessage();

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
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败：表单已显示错误提示
      return;
    }
    confirmLoading.value = true;

    try {
      // email 不随编辑提交: 邮箱变更仅允许用户本人走绑定验证流程
      await UserApi.update({
        id: userId.value,
        name: formState.value.name,
        account: formState.value.account,
        clientCode: formState.value.clientCode,
        phone: formState.value.phone,
      });

      message.success($t('common.success'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 强制解绑邮箱
   * 用户邮箱本体失效、无法走本人解绑流程时的管理员代管通道, 仅清空邮箱与验证状态
   */
  function handleUnbindEmail() {
    confirm({
      title: $t('common.confirm'),
      // 确认要解绑该用户的邮箱吗？解绑后该邮箱不可用于找回密码，需用户重新绑定
      content: $t('iam.user.action.confirmUnbindEmail'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        try {
          await UserApi.unbindEmail(userId.value!);
          // 成功
          message.success($t('common.success'));
          // 重新拉取详情刷新邮箱展示, 并通知列表刷新
          const res = await UserApi.findById(userId.value!);
          formState.value = res.data;
          emit('ok');
        } catch {
          // 失败
          message.error($t('common.failed'));
        }
      },
    });
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
        <!-- 邮箱（不可编辑: 变更仅允许用户本人走绑定验证流程; 已绑定时可强制解绑） -->
        <a-form-item :label="$t('iam.user.field.email')">
          <div class="flex items-center gap-2">
            <span>{{ formState.email || $t('iam.user.field.emailNotBound') }}</span>
            <!-- 邮箱验证状态 -->
            <a-tag v-if="formState.email" :color="formState.emailVerified ? 'green' : 'orange'">
              {{ $t(formState.emailVerified ? 'iam.user.field.emailVerified' : 'iam.user.field.emailUnverified') }}
            </a-tag>
            <!-- 强制解绑邮箱（危险操作） -->
            <a-button v-if="formState.email" type="link" size="small" danger @click="handleUnbindEmail">
              {{ $t('iam.user.action.unbindEmail') }}
            </a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
