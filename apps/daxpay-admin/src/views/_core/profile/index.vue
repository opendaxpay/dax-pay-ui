<script setup lang="ts">
  import { ref } from 'vue';

  import { $t } from '@vben/locales';
  import { useUserStore } from '@vben/stores';

  import { UserProfile } from '#/components/user-profile';

  import ProfileBase from './base-setting.vue';
  import ProfileNotificationSetting from './notification-setting.vue';
  import ProfilePasswordSetting from './password-setting.vue';
  import ProfileSecuritySetting from './security-setting.vue';
  import ProfileSocialBind from './social-bind.vue';

  const userStore = useUserStore();

  const tabsValue = ref<string>('basic');

  const tabs = ref([
    {
      label: $t('profile.basicSetting'),
      value: 'basic',
    },
    {
      label: $t('profile.securitySetting'),
      value: 'security',
    },
    {
      label: $t('profile.changePassword'),
      value: 'password',
    },
    {
      label: $t('profile.socialAccount'),
      value: 'social',
    },
    {
      label: $t('profile.notification'),
      value: 'notice',
    },
  ]);
</script>
<template>
  <UserProfile v-model:model-value="tabsValue" :title="$t('profile.profileCenter')" :user-info="userStore.userInfo" :tabs="tabs">
    <template #content>
      <ProfileBase v-if="tabsValue === 'basic'" />
      <ProfileSecuritySetting v-if="tabsValue === 'security'" />
      <ProfilePasswordSetting v-if="tabsValue === 'password'" />
      <ProfileSocialBind v-if="tabsValue === 'social'" />
      <ProfileNotificationSetting v-if="tabsValue === 'notice'" />
    </template>
  </UserProfile>
</template>
