<script setup lang="ts">
  import { ref } from 'vue';

  import { $t } from '#/locales';

  import ApiSecurityConfig from './components/ApiSecurityConfig.vue';
  import RiskConfig from './components/RiskConfig.vue';

  defineOptions({ name: 'PaySecurityConfig' });

  const activeKey = ref<string>('apiSecurity');

  // 左侧导航: 接口安全 + 风控配置
  const tabGroup = [
    {
      key: 'apiSecurity',
      // API安全配置标题
      label: $t('system.security.api-security.title'),
      // API安全配置描述
      description: $t('system.security.api-security.description'),
    },
    {
      key: 'riskConfig',
      // 支付风控标题
      label: $t('system.security.pay-security.risk.title'),
      // 支付风控描述
      description: $t('system.security.pay-security.risk.description'),
    },
  ] as const;
</script>

<template>
  <div class="security-config-page">
    <div class="security-layout">
      <aside class="security-sidebar">
        <!-- 支付安全配置标题 -->
        <div class="security-sidebar__title">{{ $t('system.security.pay-security.title') }}</div>
        <!-- 支付安全配置描述 -->
        <div class="security-sidebar__desc">{{ $t('system.security.pay-security.description') }}</div>

        <div class="security-tab-list">
          <div class="security-tab-group">
            <!-- 支付安全组标题 -->
            <div class="security-tab-group__title">{{ $t('system.security.pay-security.group.paySecurity') }}</div>
            <button
              v-for="tab in tabGroup"
              :key="tab.key"
              type="button"
              class="security-tab-item"
              :class="{ 'security-tab-item--active': activeKey === tab.key }"
              @click="activeKey = tab.key"
            >
              <div class="security-tab-item__label">{{ tab.label }}</div>
              <div class="security-tab-item__desc">{{ tab.description }}</div>
            </button>
          </div>
        </div>
      </aside>

      <section class="security-content">
        <div class="security-content__scroll">
          <ApiSecurityConfig v-if="activeKey === 'apiSecurity'" />
          <RiskConfig v-else-if="activeKey === 'riskConfig'" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
  .security-config-page {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    padding: 12px;
  }

  .security-layout {
    display: flex;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: hsl(var(--card));
    border-radius: 16px;
    box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
  }

  .security-sidebar {
    display: flex;
    flex: 0 0 280px;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    min-height: 0;
    padding: 24px 20px;
    overflow-y: auto;
    background: hsl(var(--card));
    border-right: 1px solid hsl(var(--border));
  }

  .security-sidebar__title {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .security-sidebar__desc {
    font-size: 13px;
    line-height: 1.7;
    color: hsl(var(--muted-foreground));
  }

  .security-tab-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .security-tab-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .security-tab-group__title {
    padding: 0 16px 2px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: hsl(var(--muted-foreground));
  }

  .security-tab-item {
    width: 100%;
    padding: 14px 16px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 12px;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .security-tab-item:hover {
    background: hsl(var(--accent));
  }

  .security-tab-item--active {
    background: hsl(var(--primary) / 10%);
    border-color: hsl(var(--primary) / 30%);
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  }

  .security-tab-item__label {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .security-tab-item__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .security-content {
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 24px 28px;
    background: hsl(var(--card));
  }

  .security-content__scroll {
    height: 100%;
    min-height: 0;
    padding-right: 4px;
    overflow-y: auto;
  }
</style>
