<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '#/locales';

  import AlipayAuthConfigForm from './alipay/AlipayAuthConfigForm.vue';
  import DouyinH5AuthConfigForm from './douyin-h5/DouyinH5AuthConfigForm.vue';
  import WechatMpAuthConfigForm from './wechat-mp/WechatMpAuthConfigForm.vue';
  import SocialLoginConfigList from '#/views/iam/social/social-login-config.vue';

  defineOptions({ name: 'ThirdPlatform' });

  // 默认展示"三方平台登录配置"(基础配置优先)
  const activeKey = ref<string>('loginConfig');

  // 左侧 tab 清单
  const tabs = [
    {
      key: 'loginConfig',
      // 三方平台登录配置标题
      label: $t('system.thirdPlatform.loginConfig.title'),
      // 三方平台登录配置描述
      description: $t('system.thirdPlatform.loginConfig.description'),
    },
    {
      key: 'alipay',
      // 支付宝应用标题
      label: $t('system.thirdPlatform.alipay.tabTitle'),
      // 支付宝应用描述
      description: $t('system.thirdPlatform.alipay.tabDescription'),
    },
    {
      key: 'wechatMp',
      // 微信公众号标题
      label: $t('system.thirdPlatform.wechatMp.tabTitle'),
      // 微信公众号描述
      description: $t('system.thirdPlatform.wechatMp.tabDescription'),
    },
    {
      key: 'douyinH5',
      // 抖音 H5 应用标题
      label: $t('system.thirdPlatform.douyinH5.tabTitle'),
      // 抖音 H5 应用描述
      description: $t('system.thirdPlatform.douyinH5.tabDescription'),
    },
  ] as const;

  /**
   * 跳转型平台卡片点击时, 切换到对应平台级配置 tab
   * 目前仅支付宝仍属于三方登录跳转型
   */
  function handleJump(source: string) {
    if (source === 'alipay') {
      activeKey.value = 'alipay';
    }
  }
</script>

<template>
  <div class="third-platform-page">
    <div class="platform-layout">
      <aside class="platform-sidebar">
        <!-- 三方平台管理标题 -->
        <div class="platform-sidebar__title">{{ $t('system.thirdPlatform.common.title') }}</div>
        <!-- 三方平台管理描述 -->
        <div class="platform-sidebar__desc">{{ $t('system.thirdPlatform.common.description') }}</div>

        <div class="platform-tab-list">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="platform-tab-item"
            :class="{ 'platform-tab-item--active': activeKey === tab.key }"
            @click="activeKey = tab.key"
          >
            <div class="platform-tab-item__label">{{ tab.label }}</div>
            <div class="platform-tab-item__desc">{{ tab.description }}</div>
          </button>
        </div>
      </aside>

      <section class="platform-content">
        <div class="platform-content__scroll">
          <SocialLoginConfigList
            v-show="activeKey === 'loginConfig'"
            @jump="handleJump"
          />
          <AlipayAuthConfigForm v-if="activeKey === 'alipay'" />
          <WechatMpAuthConfigForm v-if="activeKey === 'wechatMp'" />
          <DouyinH5AuthConfigForm v-if="activeKey === 'douyinH5'" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
  .third-platform-page {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    padding: 12px;
  }

  .platform-layout {
    display: flex;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: hsl(var(--card));
    border-radius: 16px;
    box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
  }

  .platform-sidebar {
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

  .platform-sidebar__title {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .platform-sidebar__desc {
    font-size: 13px;
    line-height: 1.7;
    color: hsl(var(--muted-foreground));
  }

  .platform-tab-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .platform-tab-item {
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

  .platform-tab-item:hover {
    background: hsl(var(--accent));
  }

  .platform-tab-item--active {
    background: hsl(var(--primary) / 10%);
    border-color: hsl(var(--primary) / 30%);
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  }

  .platform-tab-item__label {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .platform-tab-item__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .platform-content {
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 24px 28px;
    overflow-y: auto;
    background: hsl(var(--card));
  }

  .platform-content__scroll {
    min-height: 0;
  }
</style>
