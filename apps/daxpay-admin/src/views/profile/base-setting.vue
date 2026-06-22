<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { useUserStore } from '@vben/stores';

  import { UserCommonApi } from '#/api/core/user.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ProfileBaseSetting' });

  const { message } = useMessage();
  const userStore = useUserStore();

  const loading = ref(false);
  const saving = ref(false);
  const isEditing = ref(false);
  const formRef = ref();

  /** 登录账号（从 userStore 获取） */
  const account = computed(() => userStore.userInfo?.account || '');

  /** 用户基础信息（canonical 数据源） */
  const baseInfo = reactive({
    name: '',
    sex: '',
    email: '',
    phone: '',
  });

  /** 邮箱显示值（空值显示"暂未设置"） */
  const emailDisplay = computed(() => baseInfo.email || $t('profile.notSet'));

  /** 手机号显示值（空值显示"暂未设置"） */
  const phoneDisplay = computed(() => baseInfo.phone || $t('profile.notSet'));

  /** 表单数据（name/sex 可编辑） */
  const formState = reactive({
    name: '',
    sex: 'unknown',
  });

  /** 性别选项 */
  const sexOptions = computed(() => [
    { label: $t('profile.sexMale'), value: 'male' },
    { label: $t('profile.sexFemale'), value: 'female' },
    { label: $t('profile.sexUnknown'), value: 'unknown' },
  ]);

  /** 表单校验规则 */
  const formRules = computed(() => ({
    name: [{ required: true, message: `${$t('common.pleaseInput')}${$t('profile.name')}` }],
  }));

  /** 进入编辑模式 */
  function handleEdit() {
    formState.name = baseInfo.name;
    formState.sex = baseInfo.sex || 'unknown';
    isEditing.value = true;
  }

  /** 从后端重新获取数据 */
  async function fetchData() {
    loading.value = true;
    try {
      const { data } = await UserCommonApi.getUserBaseInfo();
      baseInfo.name = data.name || '';
      baseInfo.sex = data.sex || '';
      baseInfo.email = data.email || '';
      baseInfo.phone = data.phone || '';
      // 同步表单数据
      formState.name = baseInfo.name;
      formState.sex = baseInfo.sex || 'unknown';
    } finally {
      loading.value = false;
    }
  }

  /** 取消编辑 */
  async function handleCancel() {
    isEditing.value = false;
    formRef.value?.clearValidate();
    // 重新获取数据，恢复服务端最新状态
    await fetchData();
  }

  /** 保存 */
  async function handleSave() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    saving.value = true;
    try {
      await UserCommonApi.updateBaseInfo({
        name: formState.name,
        sex: formState.sex,
      });
      // 同步更新 store 中的用户名（影响顶栏显示）
      if (userStore.userInfo) {
        userStore.userInfo.name = formState.name;
      }
      message.success($t('profile.updateSuccess'));
      isEditing.value = false;
      // 保存成功后重新获取数据
      await fetchData();
    } finally {
      saving.value = false;
    }
  }

  onMounted(fetchData);
</script>

<template>
  <a-spin :spinning="loading">
    <a-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 16 }"
      class="max-w-2xl"
    >
      <!-- 登录账号（始终只读） -->
      <a-form-item :label="$t('profile.loginAccount')">
        <a-input :value="account" disabled />
      </a-form-item>
      <!-- 姓名（查看禁用/编辑可写） -->
      <a-form-item :label="$t('profile.name')" name="name">
        <a-input
          v-model:value="formState.name"
          :disabled="!isEditing"
          :placeholder="`${$t('common.pleaseInput')}${$t('profile.name')}`"
        />
      </a-form-item>
      <!-- 性别（查看禁用/编辑可写） -->
      <a-form-item :label="$t('profile.sex')" name="sex">
        <a-select
          v-model:value="formState.sex"
          :options="sexOptions"
          :disabled="!isEditing"
          :placeholder="$t('common.pleaseSelect')"
        />
      </a-form-item>
      <!-- 邮箱（始终只读） -->
      <a-form-item :label="$t('profile.email')">
        <a-input :value="emailDisplay" disabled />
      </a-form-item>
      <!-- 手机号（始终只读） -->
      <a-form-item :label="$t('profile.phone')">
        <a-input :value="phoneDisplay" disabled />
      </a-form-item>
      <!-- 操作按钮 -->
      <a-form-item :wrapper-col="{ offset: 5 }">
        <template v-if="!isEditing">
          <a-button type="primary" @click="handleEdit">
            {{ $t('common.edit') }}
          </a-button>
        </template>
        <a-space v-else>
          <a-button type="primary" :loading="saving" @click="handleSave">
            {{ $t('common.save') }}
          </a-button>
          <a-button @click="handleCancel">
            {{ $t('common.cancel') }}
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </a-spin>
</template>
