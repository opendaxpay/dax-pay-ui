<script lang="ts" setup>
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  defineOptions({ name: 'MobileAppConfig' });

  const router = useRouter();

  // 三种端类型卡片配置(收银台本期灰显)
  const cards: {
    appType: string;
    disabled: boolean;
    icon: string;
    theme: string;
  }[] = [
    {
      appType: 'merchant',
      disabled: false,
      icon: 'ant-design:shop-filled',
      theme: 'blue',
    },
    {
      appType: 'admin',
      disabled: false,
      icon: 'ant-design:control-filled',
      theme: 'green',
    },
    {
      appType: 'cashier',
      disabled: true,
      icon: 'ant-design:qrcode-outlined',
      theme: 'amber',
    },
  ];

  /**
   * 进入端详情页
   */
  function handleEnter(appType: string, disabled: boolean) {
    if (disabled) return;
    router.push({ path: `/payment/config/mobile-app/detail/${appType}` });
  }
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <span class="text-lg font-bold text-foreground">{{
          $t('payment.config.mobileApp.title')
        }}</span>
      </template>

      <div class="mobile-app-grid">
        <div
          v-for="card in cards"
          :key="card.appType"
          class="mobile-app-card"
          :class="[
            { 'mobile-app-card-disabled': card.disabled },
            `theme-${card.theme}`,
          ]"
          @click="handleEnter(card.appType, card.disabled)"
        >
          <!-- 收银台灰显角标 -->
          <div v-if="card.disabled" class="coming-soon-badge">
            {{ $t('payment.config.mobileApp.card.comingSoon') }}
          </div>

          <div class="card-icon">
            <IconifyIcon :icon="card.icon" class="text-5xl" />
          </div>

          <div class="card-name">
            {{ $t(`payment.config.mobileApp.card.${card.appType}.name`) }}
          </div>
          <div class="card-desc">
            {{ $t(`payment.config.mobileApp.card.${card.appType}.desc`) }}
          </div>

          <div v-if="!card.disabled" class="card-enter">
            <IconifyIcon icon="ant-design:setting-outlined" class="text-sm" />
            <span>{{ $t('payment.config.mobileApp.card.enter') }}</span>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
  .mobile-app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    padding: 8px;
  }

  .mobile-app-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    border-radius: 16px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--card));
    cursor: pointer;
    transition: all 0.3s;
    text-align: center;
  }

  .mobile-app-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px hsl(var(--muted) / 0.5);
  }

  .mobile-app-card.theme-blue:hover {
    border-color: hsl(var(--primary));
  }

  .mobile-app-card.theme-green:hover {
    border-color: hsl(142 71% 45%);
  }

  .mobile-app-card-disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .mobile-app-card-disabled:hover {
    transform: none;
    box-shadow: none;
  }

  .card-icon {
    margin-bottom: 16px;
  }

  .theme-blue .card-icon {
    color: hsl(var(--primary));
  }

  .theme-green .card-icon {
    color: hsl(142 71% 45%);
  }

  .theme-amber .card-icon {
    color: hsl(38 92% 50%);
  }

  .card-name {
    font-size: 18px;
    font-weight: bold;
    color: hsl(var(--foreground));
    margin-bottom: 8px;
  }

  .card-desc {
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    margin-bottom: 16px;
  }

  .card-enter {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: 9999px;
    background: hsl(var(--muted));
    color: hsl(var(--muted-foreground));
    font-size: 12px;
    font-weight: 600;
  }

  .mobile-app-card:hover .card-enter {
    background: hsl(var(--primary));
    color: #fff;
  }

  .coming-soon-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 2px 10px;
    border-radius: 9999px;
    background: hsl(38 92% 50%);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
  }
</style>
