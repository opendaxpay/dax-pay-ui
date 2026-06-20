<script setup lang="ts">
  import { ref } from 'vue';

  import { useUserStore } from '@vben/stores';

  import { UserProfile } from '#/components/user-profile';

  import ProfileBase from './base-setting.vue';
  import ProfileNotificationSetting from './notification-setting.vue';
  import ProfilePasswordSetting from './password-setting.vue';
  import ProfileSecuritySetting from './security-setting.vue';

  const userStore = useUserStore();

  const tabsValue = ref<string>('basic');

  const tabs = ref([
    {
      label: '基本设置',
      value: 'basic',
    },
    {
      label: '安全设置',
      value: 'security',
    },
    {
      label: '修改密码',
      value: 'password',
    },
    {
      label: '新消息提醒',
      value: 'notice',
    },
  ]);
</script>
<template>
  <UserProfile v-model:model-value="tabsValue" title="个人中心" :user-info="userStore.userInfo" :tabs="tabs">
    <template #content>
      <ProfileBase v-if="tabsValue === 'basic'" />
      <ProfileSecuritySetting v-if="tabsValue === 'security'" />
      <ProfilePasswordSetting v-if="tabsValue === 'password'" />
      <ProfileNotificationSetting v-if="tabsValue === 'notice'" />
    </template>
  </UserProfile>
</template>
