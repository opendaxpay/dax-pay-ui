<script setup lang="ts">
  import type { WebAuthnConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';
  import { getRawSystemName } from '#/logics/init-website-config';

  defineOptions({ name: 'WebAuthnConfig' });

  const { confirm, message } = useMessage();

  // rpId 必须为纯域名(点分标签, 不带协议/端口/路径), 如 localhost 或 admin.example.com,
  // 带端口(如 localhost:6999)会被浏览器 WebAuthn 校验直接拒绝, 导致通行密钥注册必败
  const RP_ID_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

  const loading = ref(false);
  const formRef = ref();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<WebAuthnConfig>({} as WebAuthnConfig);

  /** origins 标签输入(a-select tags 模式) */
  const originTags = computed({
    get: () => formState.value.origins ?? [],
    set: (value: string[]) => {
      formState.value.origins = value;
    },
  });

  const summaryItems = computed(() => {
    return [
      // 通行密钥启用状态
      formState.value.enabled
        ? $t('system.security.webauthn.summary.enabled')
        : $t('system.security.webauthn.summary.disabled'),
      // 依赖方ID
      formState.value.rpId
        ? `${$t('system.security.webauthn.rpId.label')}: ${formState.value.rpId}`
        : $t('system.security.webauthn.summary.unconfigured'),
    ];
  });

  /**
   * 加载通行密钥配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SecurityApi.getWebAuthnConfig();
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
   * 保存通行密钥配置
   */
  function handleSave() {
    confirm({
      // 确认保存
      title: $t('system.security.common.confirmSave'),
      // 确定要保存当前配置吗？rpId 变更将导致已注册凭据失效
      content: $t('system.security.webauthn.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        try {
          await formRef.value?.validate();
        } catch {
          // 校验失败：表单已显示错误提示
          return;
        }
        // 依赖方ID格式校验: 只要填写就必须为纯域名, 防止误存非法值留坑
        if (formState.value.rpId && !RP_ID_PATTERN.test(formState.value.rpId)) {
          message.warning($t('system.security.webauthn.rpId.invalid'));
          return;
        }
        // 启用时校验关键配置完整性
        if (formState.value.enabled) {
          if (!formState.value.rpId) {
            message.warning($t('system.security.webauthn.rpId.required'));
            return;
          }
          if (originTags.value.length === 0) {
            message.warning($t('system.security.webauthn.origins.required'));
            return;
          }
        }
        loading.value = true;
        try {
          await SecurityApi.updateWebAuthnConfig(formState.value);
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
          <!-- 通行密钥标题 -->
          <div class="module-overview__title">{{ $t('system.security.webauthn.title') }}</div>
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
        <!-- 通行密钥描述 -->
        <div class="module-overview__desc">{{ $t('system.security.webauthn.description') }}</div>
        <a-space wrap size="small" class="module-overview__tags">
          <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
        </a-space>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
        <div class="config-section">
          <!-- 基础设置 -->
          <div class="config-section__title">{{ $t('system.security.webauthn.section.basic') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 启用通行密钥标签 -->
              <div class="config-item__label">{{ $t('system.security.webauthn.enabled.label') }}</div>
              <!-- 启用通行密钥描述 -->
              <div class="config-item__desc">{{ $t('system.security.webauthn.enabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.enabled" :disabled="!isEditing" />
          </div>
        </div>

        <div class="config-section">
          <!-- 依赖方配置 -->
          <div class="config-section__title">{{ $t('system.security.webauthn.section.rp') }}</div>

          <div class="config-grid">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 依赖方ID标签 -->
                <div class="config-item__label">{{ $t('system.security.webauthn.rpId.label') }}</div>
                <!-- 依赖方ID描述(变更失效警示) -->
                <div class="config-item__desc">{{ $t('system.security.webauthn.rpId.desc') }}</div>
              </div>
              <a-input
                v-model:value="formState.rpId"
                :placeholder="$t('system.security.webauthn.rpId.placeholder')"
                :disabled="!isEditing"
                style="width: 220px"
              />
            </div>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 显示名称标签 -->
                <div class="config-item__label">{{ $t('system.security.webauthn.rpName.label') }}</div>
                <!-- 显示名称描述 -->
                <div class="config-item__desc">{{ $t('system.security.webauthn.rpName.desc') }}</div>
              </div>
              <a-input
                v-model:value="formState.rpName"
                :placeholder="$t('system.security.webauthn.rpName.placeholder', { name: getRawSystemName() })"
                :disabled="!isEditing"
                style="width: 220px"
              />
            </div>

            <div class="config-item config-item--block config-item--full">
              <div class="config-item__main">
                <!-- 允许来源标签 -->
                <div class="config-item__label">{{ $t('system.security.webauthn.origins.label') }}</div>
                <!-- 允许来源描述 -->
                <div class="config-item__desc">{{ $t('system.security.webauthn.origins.desc') }}</div>
              </div>
              <a-select
                v-model:value="originTags"
                mode="tags"
                :open="false"
                :disabled="!isEditing"
                :placeholder="$t('system.security.webauthn.origins.placeholder')"
                style="width: 100%"
                :token-separators="[',', ' ', '\n']"
              />
            </div>
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

  .config-item--full {
    grid-column: span 2;
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

  .module-actions {
    flex-shrink: 0;
  }
</style>
