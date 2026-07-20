<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { PaySecurityConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'RiskConfig' });

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const formRef = ref<FormInstance>();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<PaySecurityConfig>({} as PaySecurityConfig);

  // 概要标签：总开关关闭仅展示关闭态；开启时同步展示阻断/事后补录/拦截级别
  const summaryItems = computed(() => {
    if (!formState.value.riskEnabled) {
      // 风控：已关闭
      return [$t('system.security.pay-security.risk.summary.disabled')];
    }
    const items = [
      // 风控：已开启
      $t('system.security.pay-security.risk.summary.enabled'),
      // 命中：拦截下单 / 仅记录
      formState.value.riskBlockBeforePay
        ? $t('system.security.pay-security.risk.summary.blockOn')
        : $t('system.security.pay-security.risk.summary.blockOff'),
      // 事后补录：开 / 关
      formState.value.riskCheckAfterPay
        ? $t('system.security.pay-security.risk.summary.afterOn')
        : $t('system.security.pay-security.risk.summary.afterOff'),
      // 用户标识拦截级别
      formState.value.riskOpenIdLevel === 'enhanced'
        ? $t('system.security.pay-security.risk.summary.levelEnhanced')
        : $t('system.security.pay-security.risk.summary.levelNormal'),
    ];
    // 海外 IP 拦截（占位, 默认关闭, 仅开启时展示）
    if (formState.value.blockOverseasIp) {
      items.push($t('system.security.pay-security.risk.summary.overseasOn'));
    }
    return items;
  });

  /**
   * 加载风控配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SecurityApi.getPaySecurityConfig();
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
   * 保存风控配置
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
          await SecurityApi.updatePaySecurityConfig(formState.value);
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
          <!-- 支付风控标题 -->
          <div class="module-overview__title">{{ $t('system.security.pay-security.risk.title') }}</div>
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
        <!-- 支付风控描述 -->
        <div class="module-overview__desc">{{ $t('system.security.pay-security.risk.description') }}</div>
        <a-space wrap size="small" class="module-overview__tags">
          <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
        </a-space>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
        <div class="config-section">
          <!-- 风控开关 -->
          <div class="config-section__title">{{ $t('system.security.pay-security.risk.section.switch') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 风控总开关标签 -->
              <div class="config-item__label">{{ $t('system.security.pay-security.risk.riskEnabled.label') }}</div>
              <!-- 风控总开关描述 -->
              <div class="config-item__desc">{{ $t('system.security.pay-security.risk.riskEnabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.riskEnabled" :disabled="!isEditing" />
          </div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 命中阻断下单标签 -->
              <div class="config-item__label">{{
                $t('system.security.pay-security.risk.riskBlockBeforePay.label')
              }}</div>
              <!-- 命中阻断下单描述 -->
              <div class="config-item__desc">{{ $t('system.security.pay-security.risk.riskBlockBeforePay.desc') }}</div>
            </div>
            <a-switch
              v-model:checked="formState.riskBlockBeforePay"
              :disabled="!isEditing || !formState.riskEnabled"
            />
          </div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 事后补录标签 -->
              <div class="config-item__label">{{
                $t('system.security.pay-security.risk.riskCheckAfterPay.label')
              }}</div>
              <!-- 事后补录描述 -->
              <div class="config-item__desc">{{ $t('system.security.pay-security.risk.riskCheckAfterPay.desc') }}</div>
            </div>
            <a-switch
              v-model:checked="formState.riskCheckAfterPay"
              :disabled="!isEditing || !formState.riskEnabled"
            />
          </div>
        </div>

        <!-- 拦截策略 -->
        <div class="config-section">
          <div class="config-section__title">
            {{ $t('system.security.pay-security.risk.section.strategy') }}
          </div>

          <!-- 用户标识拦截级别 -->
          <div class="config-item">
            <div class="config-item__main">
              <!-- 用户标识拦截级别标签 -->
              <div class="config-item__label">{{
                $t('system.security.pay-security.risk.riskOpenIdLevel.label')
              }}</div>
              <!-- 用户标识拦截级别描述 -->
              <div class="config-item__desc">{{ $t('system.security.pay-security.risk.riskOpenIdLevel.desc') }}</div>
            </div>
            <a-radio-group
              v-model:value="formState.riskOpenIdLevel"
              button-style="solid"
              :disabled="!isEditing || !formState.riskEnabled"
            >
              <!-- 正常拦截 -->
              <a-radio-button value="normal">
                {{ $t('system.security.pay-security.risk.riskOpenIdLevel.normal') }}
              </a-radio-button>
              <!-- 增强拦截 -->
              <a-radio-button value="enhanced">
                {{ $t('system.security.pay-security.risk.riskOpenIdLevel.enhanced') }}
              </a-radio-button>
            </a-radio-group>
          </div>

          <!-- 海外 IP 拦截（占位, 后续接入） -->
          <div class="config-item">
            <div class="config-item__main">
              <!-- 海外 IP 拦截标签 -->
              <div class="config-item__label">{{
                $t('system.security.pay-security.risk.blockOverseasIp.label')
              }}</div>
              <!-- 海外 IP 拦截描述 -->
              <div class="config-item__desc">{{ $t('system.security.pay-security.risk.blockOverseasIp.desc') }}</div>
            </div>
            <!-- 海外 IP 拦截: 后续版本接入, 当前禁用 -->
            <a-tooltip :title="$t('system.security.pay-security.risk.blockOverseasIp.comingSoon')">
              <a-switch v-model:checked="formState.blockOverseasIp" disabled />
            </a-tooltip>
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
