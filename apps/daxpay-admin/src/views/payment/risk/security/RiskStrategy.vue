<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { PaySecurityConfig } from '#/api/payment/risk/risk-security.api';

  import { computed, onMounted, ref } from 'vue';

  import { RiskSecurityApi } from '#/api/payment/risk/risk-security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'RiskStrategy' });

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const formRef = ref<FormInstance>();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<PaySecurityConfig>({} as PaySecurityConfig);

  // 概要标签：总开关关闭仅展示关闭态；开启时同步展示各维度开关状态
  const summaryItems = computed(() => {
    if (!formState.value.riskEnabled) {
      // 风控：已关闭
      return [$t('payment.risk.risk-strategy.summary.disabled')];
    }
    const items = [
      // 风控：已开启
      $t('payment.risk.risk-strategy.summary.enabled'),
      // 命中：拦截下单 / 仅记录
      formState.value.riskBlockBeforePay
        ? $t('payment.risk.risk-strategy.summary.blockOn')
        : $t('payment.risk.risk-strategy.summary.blockOff'),
      // 事后补录：开 / 关
      formState.value.riskCheckAfterPay
        ? $t('payment.risk.risk-strategy.summary.afterOn')
        : $t('payment.risk.risk-strategy.summary.afterOff'),
      // 用户标识拦截级别
      formState.value.riskOpenIdLevel === 'enhanced'
        ? $t('payment.risk.risk-strategy.summary.levelEnhanced')
        : $t('payment.risk.risk-strategy.summary.levelNormal'),
    ];
    // 黑名单拦截（默认开启, 仅开启时展示）
    if (formState.value.blacklistEnabled) {
      items.push($t('payment.risk.risk-strategy.summary.blacklistOn'));
    }
    // 海外 IP 拦截（默认关闭, 仅开启时展示）
    if (formState.value.blockOverseasIp) {
      items.push($t('payment.risk.risk-strategy.summary.overseasOn'));
    }
    // 省级地区拦截（默认关闭, 仅开启时展示）
    if (formState.value.provinceBlacklistEnabled) {
      items.push($t('payment.risk.risk-strategy.summary.provinceOn'));
    }
    // 地理围栏（默认关闭, 仅开启时展示）
    if (formState.value.geoFenceEnabled) {
      items.push($t('payment.risk.risk-strategy.summary.geoFenceOn'));
      // 围栏开启时展示当前全局策略
      const strategyKey = `payment.risk.risk-strategy.geoFenceStrategy.${formState.value.geoFenceStrategy}`;
      const strategyLabel = $t(strategyKey);
      // 策略 key 未命中时回退显示原始值
      items.push(
        `${$t('payment.risk.risk-strategy.summary.strategy')}${
          strategyLabel === strategyKey ? formState.value.geoFenceStrategy : strategyLabel
        }`,
      );
    }
    return items;
  });

  // 当前选中的围栏策略说明（未命中 i18n key 时显示空）
  const geoFenceStrategyDesc = computed(() => {
    const strategyDescKey = `payment.risk.risk-strategy.geoFenceStrategy.${formState.value.geoFenceStrategy}Desc`;
    const strategyDesc = $t(strategyDescKey);
    return strategyDesc === strategyDescKey ? '' : strategyDesc;
  });

  /**
   * 加载风控配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await RiskSecurityApi.getPaySecurityConfig();
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
          await RiskSecurityApi.updatePaySecurityConfig(formState.value);
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
  <div class="risk-security-page">
    <a-spin :spinning="loading" class="w-full">
      <div class="security-module-page">
        <div class="module-overview">
          <div class="module-overview__header">
            <!-- 风控策略标题 -->
            <div class="module-overview__title">{{ $t('payment.risk.risk-strategy.title') }}</div>
            <div class="module-actions">
              <a-space>
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
              </a-space>
            </div>
          </div>
          <!-- 风控策略描述 -->
          <div class="module-overview__desc">{{ $t('payment.risk.risk-strategy.description') }}</div>
          <a-space wrap size="small" class="module-overview__tags">
            <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
          </a-space>
        </div>

        <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
          <!-- 风控开关 -->
          <div class="config-section">
            <div class="config-section__title">{{ $t('payment.risk.risk-strategy.section.switch') }}</div>
            <div class="config-grid">
              <!-- 风控总开关（占满两列） -->
              <div class="config-item config-item--full">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('payment.risk.risk-strategy.riskEnabled.label') }}</div>
                  <div class="config-item__desc">{{ $t('payment.risk.risk-strategy.riskEnabled.desc') }}</div>
                </div>
                <a-switch v-model:checked="formState.riskEnabled" :disabled="!isEditing" />
              </div>

              <!-- 黑名单拦截 -->
              <div class="config-item">
                <div class="config-item__main">
                  <div class="config-item__label">{{
                    $t('payment.risk.risk-strategy.blacklistEnabled.label')
                  }}</div>
                  <div class="config-item__desc">{{
                    $t('payment.risk.risk-strategy.blacklistEnabled.desc')
                  }}</div>
                </div>
                <a-switch
                  v-model:checked="formState.blacklistEnabled"
                  :disabled="!isEditing || !formState.riskEnabled"
                />
              </div>

              <!-- 用户标识拦截级别 -->
              <div class="config-item">
                <div class="config-item__main">
                  <div class="config-item__label">{{
                    $t('payment.risk.risk-strategy.riskOpenIdLevel.label')
                  }}</div>
                  <div class="config-item__desc">{{
                    $t('payment.risk.risk-strategy.riskOpenIdLevel.desc')
                  }}</div>
                </div>
                <a-radio-group
                  v-model:value="formState.riskOpenIdLevel"
                  button-style="solid"
                  :disabled="!isEditing || !formState.riskEnabled || !formState.blacklistEnabled"
                >
                  <a-radio-button value="normal">
                    {{ $t('payment.risk.risk-strategy.riskOpenIdLevel.normal') }}
                  </a-radio-button>
                  <a-radio-button value="enhanced">
                    {{ $t('payment.risk.risk-strategy.riskOpenIdLevel.enhanced') }}
                  </a-radio-button>
                </a-radio-group>
              </div>

              <!-- 海外 IP 拦截 -->
              <div class="config-item">
                <div class="config-item__main">
                  <div class="config-item__label">{{
                    $t('payment.risk.risk-strategy.blockOverseasIp.label')
                  }}</div>
                  <div class="config-item__desc">{{
                    $t('payment.risk.risk-strategy.blockOverseasIp.desc')
                  }}</div>
                </div>
                <a-switch
                  v-model:checked="formState.blockOverseasIp"
                  :disabled="!isEditing || !formState.riskEnabled"
                />
              </div>

              <!-- 省级地区拦截 -->
              <div class="config-item">
                <div class="config-item__main">
                  <div class="config-item__label">{{
                    $t('payment.risk.risk-strategy.provinceBlacklistEnabled.label')
                  }}</div>
                  <div class="config-item__desc">{{
                    $t('payment.risk.risk-strategy.provinceBlacklistEnabled.desc')
                  }}</div>
                </div>
                <a-switch
                  v-model:checked="formState.provinceBlacklistEnabled"
                  :disabled="!isEditing || !formState.riskEnabled"
                />
              </div>

              <!-- 地理围栏 -->
              <div class="config-item">
                <div class="config-item__main">
                  <div class="config-item__label">{{
                    $t('payment.risk.risk-strategy.geoFenceEnabled.label')
                  }}</div>
                  <div class="config-item__desc">{{
                    $t('payment.risk.risk-strategy.geoFenceEnabled.desc')
                  }}</div>
                </div>
                <a-switch
                  v-model:checked="formState.geoFenceEnabled"
                  :disabled="!isEditing || !formState.riskEnabled"
                />
              </div>

              <!-- 围栏策略（仅围栏开启时展示，与开关同行两列；左侧随选中项展示说明） -->
              <div v-if="formState.geoFenceEnabled" class="config-item">
                <div class="config-item__main">
                  <div class="config-item__label">{{
                    $t('payment.risk.risk-strategy.geoFenceStrategy.label')
                  }}</div>
                  <div class="config-item__desc">{{ geoFenceStrategyDesc }}</div>
                </div>
                <a-radio-group
                  v-model:value="formState.geoFenceStrategy"
                  button-style="solid"
                  :disabled="!isEditing || !formState.riskEnabled"
                >
                  <a-radio-button value="strict">
                    {{ $t('payment.risk.risk-strategy.geoFenceStrategy.strict') }}
                  </a-radio-button>
                  <a-radio-button value="balanced">
                    {{ $t('payment.risk.risk-strategy.geoFenceStrategy.balanced') }}
                  </a-radio-button>
                  <a-radio-button value="loose">
                    {{ $t('payment.risk.risk-strategy.geoFenceStrategy.loose') }}
                  </a-radio-button>
                </a-radio-group>
              </div>
            </div>
          </div>

          <!-- 拦截策略 -->
          <div class="config-section">
            <div class="config-section__title">
              {{ $t('payment.risk.risk-strategy.section.strategy') }}
            </div>
            <div class="config-grid">
              <!-- 命中阻断下单 -->
              <div class="config-item">
                <div class="config-item__main">
                  <div class="config-item__label">{{
                    $t('payment.risk.risk-strategy.riskBlockBeforePay.label')
                  }}</div>
                  <div class="config-item__desc">{{
                    $t('payment.risk.risk-strategy.riskBlockBeforePay.desc')
                  }}</div>
                </div>
                <a-switch
                  v-model:checked="formState.riskBlockBeforePay"
                  :disabled="!isEditing || !formState.riskEnabled"
                />
              </div>

              <!-- 事后补录命中 -->
              <div class="config-item">
                <div class="config-item__main">
                  <div class="config-item__label">{{
                    $t('payment.risk.risk-strategy.riskCheckAfterPay.label')
                  }}</div>
                  <div class="config-item__desc">{{
                    $t('payment.risk.risk-strategy.riskCheckAfterPay.desc')
                  }}</div>
                </div>
                <a-switch
                  v-model:checked="formState.riskCheckAfterPay"
                  :disabled="!isEditing || !formState.riskEnabled"
                />
              </div>
            </div>
          </div>
        </a-form>
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
  .risk-security-page {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    padding: 12px;
  }

  .security-module-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px 28px;
    background: hsl(var(--card));
    border-radius: 16px;
    box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
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
    grid-template-columns: 1fr 1fr;
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

  .config-item--full {
    grid-column: span 2;
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
