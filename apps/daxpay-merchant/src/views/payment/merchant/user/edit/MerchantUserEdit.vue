<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MerchantUserApi, type UserInfoResult } from '#/api/payment/merchant/merchant-user.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message, confirm } = useMessage();

  // 表单引用
  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel } = useFormEdit();
  // 用户 ID
  const userId = ref<string>('');

  // 表单数据
  const formState = ref<UserInfoResult>({
    id: '',
    name: '',
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
      email: '',
    };
    formRef.value?.resetFields();
  }

  /**
   * 打开编辑抽屉
   */
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
        email: data.email || '',
      };
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
      // phone 不随编辑提交: 手机号功能已冻结, 待接入短信验证后启用
      await MerchantUserApi.update({
        id: userId.value,
        name: formState.value.name,
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
   * 用户邮箱本体失效、无法走本人解绑流程时的管理员代管通道, 仅清空邮箱
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
          await MerchantUserApi.unbindEmail(userId.value);
          // 成功
          message.success($t('common.success'));
          // 重新拉取详情刷新邮箱展示, 并通知列表刷新
          const { data } = await MerchantUserApi.findById(userId.value);
          if (data) {
            formState.value = {
              id: data.id || '',
              name: data.name || '',
              email: data.email || '',
            };
          }
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
      <!-- 邮箱（不可编辑: 变更仅允许用户本人走绑定验证流程; 已绑定时可强制解绑） -->
      <a-form-item :label="$t('iam.user.field.email')">
        <div class="flex items-center gap-2">
          <span>{{ formState.email || $t('iam.user.field.emailNotBound') }}</span>
          <!-- 强制解绑邮箱（危险操作） -->
          <a-button v-if="formState.email" type="link" size="small" danger @click="handleUnbindEmail">
            {{ $t('iam.user.action.unbindEmail') }}
          </a-button>
        </div>
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
