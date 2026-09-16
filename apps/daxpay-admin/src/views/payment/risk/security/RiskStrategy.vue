<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import type { PaySecurityConfig } from '#/api/payment/risk/risk-security.api';

  import { computed, onMounted, ref } from 'vue';

  import { PageShell } from '@daxpay/ui-biz/components/page-shell';

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
    ];
    // 黑名单拦截（默认开启, 仅开启时展示）
    if (formState.value.blacklistEnabled) {
      items.push($t('payment.risk.risk-strategy.summary.blacklistOn'));
    }
    // 海外 IP 拦截（默认关闭, 仅开启时展示）
    if (formState.value.blockOverseasIp) {
      items.push($t('payment.risk.risk-strategy.summary.overseasOn'));
    }
    // 地区拦截（默认关闭, 仅开启时展示）
    if (formState.value.regionBlacklistEnabled) {
      items.push($t('payment.risk.risk-strategy.summary.regionOn'));
    }
    return items;
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
  <PageShell
    :title="$t('payment.risk.risk-strategy.title')"
    :description="$t('payment.risk.risk-strategy.description')"
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
      <!-- 风控总开关（全宽置顶, 独立于分组, 关闭后所有风控检查跳过） -->
      <div class="config-item config-item--full">
        <div class="config-item__main">
          <div class="config-item__label">{{ $t('payment.risk.risk-strategy.riskEnabled.label') }}</div>
          <div class="config-item__desc">{{ $t('payment.risk.risk-strategy.riskEnabled.desc') }}</div>
        </div>
        <a-switch v-model:checked="formState.riskEnabled" :disabled="!isEditing" />
      </div>

      <!-- 公共设置: 影响海外/地区等 IP 归属地检查的公共开关 -->
      <div class="config-section">
        <div class="config-section__title">{{ $t('payment.risk.risk-strategy.section.common') }}</div>
        <div class="config-grid">
          <!-- IPv6 地区匹配 -->
          <div class="config-item">
            <div class="config-item__main">
              <div class="config-item__label">{{ $t('payment.risk.risk-strategy.ipv6MatchEnabled.label') }}</div>
              <div class="config-item__desc">{{ $t('payment.risk.risk-strategy.ipv6MatchEnabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.ipv6MatchEnabled" :disabled="!isEditing || !formState.riskEnabled" />
          </div>

          <!-- IPv6 精度提示（开关打开时显示） -->
          <div v-if="formState.ipv6MatchEnabled" class="config-item">
            <a-alert
              type="warning"
              show-icon
              :message="$t('payment.risk.risk-strategy.ipv6MatchEnabled.precisionHint')"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- 名单拦截: 按 IP 匹配黑名单名单 -->
      <div class="config-section">
        <div class="config-section__title">{{ $t('payment.risk.risk-strategy.section.blacklist') }}</div>
        <div class="config-grid">
          <!-- 黑名单拦截 -->
          <div class="config-item">
            <div class="config-item__main">
              <div class="config-item__label">{{ $t('payment.risk.risk-strategy.blacklistEnabled.label') }}</div>
              <div class="config-item__desc">{{ $t('payment.risk.risk-strategy.blacklistEnabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.blacklistEnabled" :disabled="!isEditing || !formState.riskEnabled" />
          </div>
        </div>
      </div>

      <!-- 地域限制: 按支付 IP 归属地（海外 / 省份 / 城市）限制 -->
      <div class="config-section">
        <div class="config-section__title">{{ $t('payment.risk.risk-strategy.section.region') }}</div>
        <div class="config-grid">
          <!-- 海外 IP 拦截 -->
          <div class="config-item">
            <div class="config-item__main">
              <div class="config-item__label">{{ $t('payment.risk.risk-strategy.blockOverseasIp.label') }}</div>
              <div class="config-item__desc">{{ $t('payment.risk.risk-strategy.blockOverseasIp.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.blockOverseasIp" :disabled="!isEditing || !formState.riskEnabled" />
          </div>

          <!-- 地区拦截（含省级 + 市级名单） -->
          <div class="config-item">
            <div class="config-item__main">
              <div class="config-item__label">{{ $t('payment.risk.risk-strategy.regionBlacklistEnabled.label') }}</div>
              <div class="config-item__desc">{{ $t('payment.risk.risk-strategy.regionBlacklistEnabled.desc') }}</div>
            </div>
            <a-switch
              v-model:checked="formState.regionBlacklistEnabled"
              :disabled="!isEditing || !formState.riskEnabled"
            />
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
              <div class="config-item__label">{{ $t('payment.risk.risk-strategy.riskBlockBeforePay.label') }}</div>
              <div class="config-item__desc">{{ $t('payment.risk.risk-strategy.riskBlockBeforePay.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.riskBlockBeforePay" :disabled="!isEditing || !formState.riskEnabled" />
          </div>
        </div>
      </div>
    </a-form>
  </PageShell>
</template>
