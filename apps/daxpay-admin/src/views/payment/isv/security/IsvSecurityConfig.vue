<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { IconifyIcon } from '@vben-core/icons';

  import { IsvInfoApi } from '#/api/payment/isv.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';
  import { $t } from '#/locales';

  import IsvLoginSecurityConfig from './components/IsvLoginSecurityConfig.vue';
  import IsvPasswordPolicyConfig from './components/IsvPasswordPolicyConfig.vue';
  import IsvSessionConfig from './components/IsvSessionConfig.vue';

  defineOptions({ name: 'IsvSecurityConfig' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['isvNo'],
    messageKey: 'payment.common.route.missingIsvNo',
    fallbackPath: '/payment/isv',
  });

  const isvInfo = ref<any>({});

  const isvNo = computed(() => routeContext.query.value.isvNo);
  const activeKey = ref<string>('passwordPolicy');

  const tabs = [
    {
      key: 'passwordPolicy',
      // 国际化：密码策略
      label: $t('payment.isv.manage.manage.passwordPolicy'),
      // 国际化：维护密码复杂度、有效期与历史限制
      description: $t('system.security.password-policy.description'),
    },
    {
      key: 'loginSecurity',
      // 国际化：登录安全
      label: $t('payment.isv.manage.manage.loginSecurity'),
      // 国际化：维护失败锁定与统计窗口配置
      description: $t('system.security.login-security.description'),
    },
    {
      key: 'sessionManagement',
      // 国际化：会话管理
      label: $t('payment.isv.manage.manage.sessionManagement'),
      // 国际化：维护在线时长、并发数量与清理策略
      description: $t('system.security.session-management.description'),
    },
  ] as const;

  /**
   * 加载服务商信息
   */
  async function loadIsvInfo() {
    if (!isvNo.value) return;
    try {
      const { data } = await IsvInfoApi.findByIsvNo(isvNo.value);
      isvInfo.value = data || {};
    } catch {
      // ignore
    }
  }

  function handleBack() {
    router.push({
      path: '/payment/isv/manage',
      query: { isvNo: isvNo.value },
    });
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    loadIsvInfo();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingIsvNo')"
    :back-text="$t('payment.isv.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <a-button
            type="text"
            class="flex items-center justify-center rounded-full hover:bg-accent"
            @click="handleBack"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
            </template>
          </a-button>
          <!-- 国际化：安全配置 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.isv.manage.manage.security.title') }}</span>
          <span v-if="isvInfo.name" class="text-sm text-muted-foreground">({{ isvInfo.name }})</span>
        </div>
      </template>

      <div class="security-config-page">
        <div class="security-layout">
          <aside class="security-sidebar">
            <div class="security-tab-list">
              <button
                v-for="tab in tabs"
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
          </aside>

          <section class="security-content">
            <div class="security-content__scroll">
              <IsvPasswordPolicyConfig v-if="activeKey === 'passwordPolicy'" :isv-no="isvNo" />
              <IsvLoginSecurityConfig v-else-if="activeKey === 'loginSecurity'" :isv-no="isvNo" />
              <IsvSessionConfig v-else-if="activeKey === 'sessionManagement'" :isv-no="isvNo" />
            </div>
          </section>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
  .security-config-page {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
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
    gap: 4px;
    height: 100%;
    min-height: 0;
    padding: 24px 20px;
    overflow-y: auto;
    background: hsl(var(--card));
    border-right: 1px solid hsl(var(--border));
  }

  .security-tab-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
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
