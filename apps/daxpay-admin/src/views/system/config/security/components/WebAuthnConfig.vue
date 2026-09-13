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
  </a-spin>
</template>
