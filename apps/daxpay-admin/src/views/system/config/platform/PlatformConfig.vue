<script setup lang="ts">
  import { ref } from 'vue';

  import { $t } from '#/locales';

  import OssConfigForm from './oss/OssConfigForm.vue';
  import UrlConfigForm from './url/UrlConfigForm.vue';
  import WebsiteConfigForm from './website/WebsiteConfigForm.vue';

  defineOptions({ name: 'PlatformConfig' });

  // 默认展示端点配置(基础配置优先)
  const activeKey = ref<string>('url');

  const tabs = [
    {
      key: 'url',
      // 端点配置标题
      label: $t('system.platform.url.title'),
      // 端点配置描述
      description: $t('system.platform.url.description'),
    },
    {
      key: 'website',
      // 站点配置标题
      label: $t('system.platform.website.title'),
      // 站点配置描述
      description: $t('system.platform.website.description'),
    },
    {
      key: 'oss',
      // OSS配置标题
      label: $t('system.platform.oss.title'),
      // OSS配置描述
      description: $t('system.platform.oss.description'),
    },
  ] as const;
</script>

<template>
  <div class="platform-config-page">
    <div class="platform-layout">
      <aside class="platform-sidebar">
        <!-- 平台配置标题 -->
        <div class="platform-sidebar__title">{{ $t('system.platform.common.title') }}</div>
        <!-- 平台配置描述 -->
        <div class="platform-sidebar__desc">{{ $t('system.platform.common.description') }}</div>

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
          <UrlConfigForm v-if="activeKey === 'url'" />
          <WebsiteConfigForm v-if="activeKey === 'website'" />
          <OssConfigForm v-if="activeKey === 'oss'" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
  .platform-config-page {
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
    background: hsl(var(--card));
  }

  .platform-content__scroll {
    height: 100%;
    min-height: 0;
    padding-right: 4px;
    overflow-y: auto;
  }
</style>
