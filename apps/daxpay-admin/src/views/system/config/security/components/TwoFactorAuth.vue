<script setup lang="ts">
  import type { TwoFactorAuthConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'TwoFactorAuth' });

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const formRef = ref();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<TwoFactorAuthConfig>({} as TwoFactorAuthConfig);

  const summaryItems = computed(() => {
    return [
      // 双因素认证启用状态
      formState.value.enabled
        ? $t('system.security.two-factor-auth.summary.enabled')
        : $t('system.security.two-factor-auth.summary.disabled'),
    ];
  });

  /**
   * 加载双因素认证配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SecurityApi.getTwoFactorAuthConfig();
      formState.value = data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 进入编辑模式
   */
  function handleEdit() {
    isEditing.value = true;
  }

  /**
   * 取消编辑
   */
  function handleCancel() {
    loadConfig();
    isEditing.value = false;
  }

  /**
   * 保存双因素认证配置
   */
  function handleSave() {
    confirm({
      // 确认保存
      title: $t('system.security.common.confirmSave'),
      // 确定要保存当前配置吗？
      content: $t('system.security.common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        try {
          await formRef.value?.validate();
        } catch {
          // 校验失败：表单已显示错误提示
          return;
        }
        loading.value = true;
        try {
          await SecurityApi.updateTwoFactorAuthConfig(formState.value);
          // 保存成功提示
          message.success($t('common.saveSuccess'));
          await loadConfig();
          isEditing.value = false;
        } finally {
          loading.value = false;
        }
      },
    });
  }

  onMounted(() => {
    loadConfig();
  });

  // 供外壳 PageShell 常驻 header 渲染编辑操作(标题/描述由外壳 tabs 数据提供)
  defineExpose({
    isEditing,
    saving: loading,
    summaryTags: summaryItems,
    handleEdit,
    handleCancel,
    handleSave,
  });
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
    <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
      <div class="config-section">
        <!-- 基础设置 -->
        <div class="config-section__title">{{ $t('system.security.two-factor-auth.section.basic') }}</div>

        <div class="config-item">
          <div class="config-item__main">
            <!-- 启用双因素认证标签 -->
            <div class="config-item__label">{{ $t('system.security.two-factor-auth.enabled.label') }}</div>
            <!-- 启用双因素认证描述 -->
            <div class="config-item__desc">{{ $t('system.security.two-factor-auth.enabled.desc') }}</div>
          </div>
          <a-switch v-model:checked="formState.enabled" :disabled="!isEditing" />
        </div>
      </div>

      <div class="config-section">
        <!-- 其他配置 -->
        <div class="config-section__title">{{ $t('system.security.two-factor-auth.section.other') }}</div>

        <div class="config-grid">
          <div class="config-item config-item--block">
            <div class="config-item__main">
              <!-- 发行者名称标签 -->
              <div class="config-item__label">{{ $t('system.security.two-factor-auth.issuer.label') }}</div>
              <!-- 发行者名称描述 -->
              <div class="config-item__desc">{{ $t('system.security.two-factor-auth.issuer.desc') }}</div>
            </div>
            <a-input
              v-model:value="formState.issuer"
              :placeholder="$t('system.security.two-factor-auth.issuer.placeholder')"
              :disabled="!isEditing"
              style="width: 220px"
            />
          </div>

          <div class="config-item config-item--block">
            <div class="config-item__main">
              <!-- 备用验证码数量标签 -->
              <div class="config-item__label">{{ $t('system.security.two-factor-auth.backupCodesCount.label') }}</div>
              <!-- 备用验证码数量描述 -->
              <div class="config-item__desc">{{ $t('system.security.two-factor-auth.backupCodesCount.desc') }}</div>
            </div>
            <div class="number-field">
              <!-- 国际化：请输入备用验证码数量 -->
              <a-input-number
                v-model:value="formState.backupCodesCount"
                :min="10"
                :max="20"
                :placeholder="$t('system.security.two-factor-auth.backupCodesCount.placeholder')"
                :disabled="!isEditing"
                style="width: 180px"
              />
              <!-- 单位：个 -->
              <span class="number-field__suffix">{{ $t('system.security.common.unit.count') }}</span>
            </div>
          </div>
        </div>
      </div>
    </a-form>
  </a-spin>
</template>
