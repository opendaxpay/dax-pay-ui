<script setup lang="ts">
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import ProfileBase from './base-setting.vue';
  import ProfilePasswordSetting from './password-setting.vue';
  import ProfileSecuritySetting from './security-setting.vue';
  import ProfileSocialBind from './social-bind.vue';

  defineOptions({ name: 'Profile' });

  const activeKey = ref<string>('basic');

  const tabs = [
    {
      key: 'basic',
      label: $t('profile.basicSetting'),
      description: $t('profile.basicSettingDesc'),
    },
    {
      key: 'password',
      label: $t('profile.changePassword'),
      description: $t('profile.changePasswordDesc'),
    },
    {
      key: 'social',
      label: $t('profile.socialAccount'),
      description: $t('profile.socialAccountDesc'),
    },
    {
      key: 'security',
      label: $t('profile.securitySetting'),
      description: $t('profile.securitySettingDesc'),
    },
  ] as const;
</script>

<template>
  <div class="profile-page">
    <div class="profile-layout">
      <aside class="profile-sidebar">
        <div class="profile-sidebar__title">{{ $t('page.auth.profile') }}</div>
        <div class="profile-sidebar__desc">{{ $t('profile.profileDesc') }}</div>
        <div class="profile-tab-list">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="profile-tab-item"
            :class="{ 'profile-tab-item--active': activeKey === tab.key }"
            @click="activeKey = tab.key"
          >
            <div class="profile-tab-item__label">{{ tab.label }}</div>
            <div class="profile-tab-item__desc">{{ tab.description }}</div>
          </button>
        </div>
      </aside>
      <section class="profile-content">
        <div class="profile-content__scroll">
          <ProfileBase v-if="activeKey === 'basic'" />
          <ProfilePasswordSetting v-else-if="activeKey === 'password'" />
          <ProfileSocialBind v-else-if="activeKey === 'social'" />
          <ProfileSecuritySetting v-else-if="activeKey === 'security'" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
  .profile-page {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    padding: 12px;
  }

  .profile-layout {
    display: flex;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: hsl(var(--card));
    border-radius: 16px;
    box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
  }

  .profile-sidebar {
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

  .profile-sidebar__title {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .profile-sidebar__desc {
    font-size: 13px;
    line-height: 1.7;
    color: hsl(var(--muted-foreground));
  }

  .profile-tab-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .profile-tab-item {
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

  .profile-tab-item:hover {
    background: hsl(var(--accent));
  }

  .profile-tab-item--active {
    background: hsl(var(--primary) / 10%);
    border-color: hsl(var(--primary) / 30%);
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  }

  .profile-tab-item__label {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .profile-tab-item__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .profile-content {
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 24px 28px;
    background: hsl(var(--card));
  }

  .profile-content__scroll {
    height: 100%;
    min-height: 0;
    padding-right: 4px;
    overflow-y: auto;
  }
</style>
