<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { ApiSecurityConfig } from '#/api/payment/risk/risk-security.api';

  import { computed, onMounted, ref } from 'vue';

  import { PageShell } from '@daxpay/ui-biz/components/page-shell';

  import { RiskSecurityApi } from '#/api/payment/risk/risk-security.api';
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
        ? $t('payment.risk.api-security.summary.nonceEnabled')
        : $t('payment.risk.api-security.summary.nonceDisabled'),
      // 请求时间窗口状态
      formState.value.reqTimeoutEnabled
        ? $t('payment.risk.api-security.summary.reqTimeoutEnabled')
        : $t('payment.risk.api-security.summary.reqTimeoutDisabled'),
    ];
  });

  /**
   * 加载 API 安全配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await RiskSecurityApi.getApiSecurityConfig();
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
      title: $t('payment.risk.common.confirmSave'),
      // 确定要保存当前配置吗？
      content: $t('payment.risk.common.confirmSaveContent'),
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
          await RiskSecurityApi.updateApiSecurityConfig(formState.value);
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
  <PageShell
    :title="$t('payment.risk.api-security.title')"
    :description="$t('payment.risk.api-security.description')"
    :tags="summaryItems"
    :loading="loading"
  >
    <!-- 配置页外壳: 右栏 header(标题/描述/状态标签/操作按钮)常驻, 内容区内部滚动 -->
    <!-- 右上操作区: 编辑/取消/确认按钮常驻 -->
    <template #actions>
      <!-- 非编辑状态：显示编辑按钮 -->
      <template v-if="!isEditing">
        <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
      </template>
      <!-- 编辑状态：显示取消和确认按钮 -->
      <template v-else>
        <a-button @click="handleCancel">{{ $t('payment.risk.common.cancel') }}</a-button>
        <a-button type="primary" :loading="loading" @click="handleSave">{{
          $t('payment.risk.common.confirm')
        }}</a-button>
      </template>
    </template>

    <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
      <div class="config-section">
        <!-- 防重放校验 -->
        <div class="config-section__title">{{ $t('payment.risk.api-security.section.replay') }}</div>

        <div class="config-item">
          <div class="config-item__main">
            <!-- Nonce防重放标签 -->
            <div class="config-item__label">{{ $t('payment.risk.api-security.nonceVerifyEnabled.label') }}</div>
            <!-- Nonce防重放描述 -->
            <div class="config-item__desc">{{ $t('payment.risk.api-security.nonceVerifyEnabled.desc') }}</div>
          </div>
          <a-switch v-model:checked="formState.nonceVerifyEnabled" :disabled="!isEditing" />
        </div>

        <div class="config-item">
          <div class="config-item__main">
            <!-- 请求时间窗口标签 -->
            <div class="config-item__label">{{ $t('payment.risk.api-security.reqTimeoutEnabled.label') }}</div>
            <!-- 请求时间窗口描述 -->
            <div class="config-item__desc">{{ $t('payment.risk.api-security.reqTimeoutEnabled.desc') }}</div>
          </div>
          <a-switch v-model:checked="formState.reqTimeoutEnabled" :disabled="!isEditing" />
        </div>
      </div>

      <div class="config-section">
        <!-- 参数设置 -->
        <div class="config-section__title">{{ $t('payment.risk.api-security.section.params') }}</div>

        <div class="config-grid">
          <a-form-item name="reqTimeoutSeconds">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 时间窗口容差标签 -->
                <div class="config-item__label">{{ $t('payment.risk.api-security.reqTimeoutSeconds.label') }}</div>
                <!-- 时间窗口容差描述 -->
                <div class="config-item__desc">{{ $t('payment.risk.api-security.reqTimeoutSeconds.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 请输入时间窗口容差 -->
                <a-input-number
                  v-model:value="formState.reqTimeoutSeconds"
                  :min="1"
                  :max="3600"
                  :placeholder="$t('payment.risk.api-security.reqTimeoutSeconds.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：秒 -->
                <span class="number-field__suffix">{{ $t('payment.risk.common.unit.second') }}</span>
              </div>
            </div>
          </a-form-item>

          <a-form-item name="nonceTtlSeconds">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- Nonce有效期标签 -->
                <div class="config-item__label">{{ $t('payment.risk.api-security.nonceTtlSeconds.label') }}</div>
                <!-- Nonce有效期描述 -->
                <div class="config-item__desc">{{ $t('payment.risk.api-security.nonceTtlSeconds.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 请输入Nonce有效期 -->
                <a-input-number
                  v-model:value="formState.nonceTtlSeconds"
                  :min="1"
                  :max="3600"
                  :placeholder="$t('payment.risk.api-security.nonceTtlSeconds.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：秒 -->
                <span class="number-field__suffix">{{ $t('payment.risk.common.unit.second') }}</span>
              </div>
            </div>
          </a-form-item>
        </div>
      </div>
    </a-form>
  </PageShell>
</template>
