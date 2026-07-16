<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { ApiSecurityConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'ApiSecurityConfig' });

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const formRef = ref<FormInstance>();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<ApiSecurityConfig>({} as ApiSecurityConfig);

  // 概要标签
  const summaryItems = computed(() => {
    return [
      // Nonce 防重放状态
      formState.value.nonceVerifyEnabled
        ? $t('system.security.api-security.summary.nonceEnabled')
        : $t('system.security.api-security.summary.nonceDisabled'),
      // 请求时间窗口状态
      formState.value.reqTimeoutEnabled
        ? $t('system.security.api-security.summary.reqTimeoutEnabled')
        : $t('system.security.api-security.summary.reqTimeoutDisabled'),
    ];
  });

  /**
   * 加载 API 安全配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SecurityApi.getApiSecurityConfig();
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
   * 保存 API 安全配置
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
          await SecurityApi.updateApiSecurityConfig(formState.value);
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
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
    <div class="security-module-page">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- API安全配置标题 -->
          <div class="module-overview__title">{{ $t('system.security.api-security.title') }}</div>
          <div class="module-actions">
            <a-space>
              <!-- 非编辑状态：显示编辑按钮 -->
              <template v-if="!isEditing">
                <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
              </template>
              <!-- 编辑状态：显示取消和确认按钮 -->
              <template v-else>
                <a-button @click="handleCancel">{{ $t('system.security.common.cancel') }}</a-button>
                <a-button type="primary" :loading="loading" @click="handleSave">{{
                  $t('system.security.common.confirm')
                }}</a-button>
              </template>
            </a-space>
          </div>
        </div>
        <!-- API安全配置描述 -->
        <div class="module-overview__desc">{{ $t('system.security.api-security.description') }}</div>
        <a-space wrap size="small" class="module-overview__tags">
          <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
        </a-space>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
        <div class="config-section">
          <!-- 防重放校验 -->
          <div class="config-section__title">{{ $t('system.security.api-security.section.replay') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- Nonce防重放标签 -->
              <div class="config-item__label">{{ $t('system.security.api-security.nonceVerifyEnabled.label') }}</div>
              <!-- Nonce防重放描述 -->
              <div class="config-item__desc">{{ $t('system.security.api-security.nonceVerifyEnabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.nonceVerifyEnabled" :disabled="!isEditing" />
          </div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 请求时间窗口标签 -->
              <div class="config-item__label">{{ $t('system.security.api-security.reqTimeoutEnabled.label') }}</div>
              <!-- 请求时间窗口描述 -->
              <div class="config-item__desc">{{ $t('system.security.api-security.reqTimeoutEnabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.reqTimeoutEnabled" :disabled="!isEditing" />
          </div>
        </div>

        <div class="config-section">
          <!-- 参数设置 -->
          <div class="config-section__title">{{ $t('system.security.api-security.section.params') }}</div>

          <div class="config-grid">
            <a-form-item name="reqTimeoutSeconds">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 时间窗口容差标签 -->
                  <div class="config-item__label">{{ $t('system.security.api-security.reqTimeoutSeconds.label') }}</div>
                  <!-- 时间窗口容差描述 -->
                  <div class="config-item__desc">{{ $t('system.security.api-security.reqTimeoutSeconds.desc') }}</div>
                </div>
                <div class="number-field">
                  <!-- 请输入时间窗口容差 -->
                  <a-input-number
                    v-model:value="formState.reqTimeoutSeconds"
                    :min="1"
                    :max="3600"
                    :placeholder="$t('system.security.api-security.reqTimeoutSeconds.placeholder')"
                    :disabled="!isEditing"
                    style="width: 180px"
                  />
                  <!-- 单位：秒 -->
                  <span class="number-field__suffix">{{ $t('system.security.common.unit.second') }}</span>
                </div>
              </div>
            </a-form-item>

            <a-form-item name="nonceTtlSeconds">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- Nonce有效期标签 -->
                  <div class="config-item__label">{{ $t('system.security.api-security.nonceTtlSeconds.label') }}</div>
                  <!-- Nonce有效期描述 -->
                  <div class="config-item__desc">{{ $t('system.security.api-security.nonceTtlSeconds.desc') }}</div>
                </div>
                <div class="number-field">
                  <!-- 请输入Nonce有效期 -->
                  <a-input-number
                    v-model:value="formState.nonceTtlSeconds"
                    :min="1"
                    :max="3600"
                    :placeholder="$t('system.security.api-security.nonceTtlSeconds.placeholder')"
                    :disabled="!isEditing"
                    style="width: 180px"
                  />
                  <!-- 单位：秒 -->
                  <span class="number-field__suffix">{{ $t('system.security.common.unit.second') }}</span>
                </div>
              </div>
            </a-form-item>
          </div>
        </div>
      </a-form>
    </div>
  </a-spin>
</template>

<style scoped>
  .security-module-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 4px;
  }

  .module-overview {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .module-overview__header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .module-overview__title {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .module-overview__desc {
    font-size: 13px;
    line-height: 1.7;
    color: hsl(var(--muted-foreground));
  }

  .module-overview__tags {
    padding-top: 2px;
  }

  .module-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .module-form :deep(.ant-form-item) {
    margin-bottom: 0;
  }

  .config-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .config-section__title {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .config-item {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 12px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .config-item:hover {
    border-color: hsl(var(--primary) / 30%);
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  }

  .config-item--block {
    flex-direction: column;
    align-items: flex-start;
  }

  .config-item__main {
    flex: 1;
    min-width: 0;
  }

  .config-item__label {
    font-size: 14px;
    font-weight: 500;
    color: hsl(var(--foreground));
  }

  .config-item__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .number-field {
    display: inline-flex;
    gap: 8px;
    align-items: center;
  }

  .number-field__suffix {
    flex: 0 0 auto;
    font-size: 13px;
    color: hsl(var(--muted-foreground));
  }

  .module-actions {
    flex-shrink: 0;
  }
</style>
