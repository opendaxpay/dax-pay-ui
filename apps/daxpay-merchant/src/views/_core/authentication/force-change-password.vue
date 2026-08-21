<script setup lang="ts">
  import { computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { HOME_PATH } from '#/router/routes';
  import { useAuthStore } from '#/store';
  import PasswordChangeForm from '#/views/profile/components/password-change-form.vue';

  defineOptions({
    name: 'ForceChangePassword',
  });

  const router = useRouter();
  const authStore = useAuthStore();

  // 场景说明: 初始密码优先于密码过期展示
  const sceneDesc = computed(() => {
    if (authStore.passwordStatus?.initialPassword) {
      // 当前密码为管理员设置的初始密码, 修改后才能进入系统
      return $t('authentication.forceChangePassword.initialDesc');
    }
    return $t('authentication.forceChangePassword.expiredDesc');
  });

  /** 改密成功: 刷新密码状态后进入系统 */
  async function handleSuccess() {
    await authStore.fetchUserInfo();
    if (!authStore.needChangePassword) {
      await router.push(HOME_PATH);
    }
  }

  /** 退出登录 */
  async function handleLogout() {
    await authStore.logout(false);
  }

  onMounted(() => {
    // 直接访问本页(无用户信息缓存)时拉取一次, 确保场景文案与状态可用
    if (!authStore.passwordStatus) {
      authStore.fetchUserInfo();
    }
  });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-[#101014]">
    <div class="w-full max-w-xl px-4">
      <a-card>
        <template #title>
          {{ $t('authentication.forceChangePassword.title') }}
        </template>
        <template #extra>
          <a-button type="link" @click="handleLogout">
            {{ $t('authentication.forceChangePassword.logout') }}
          </a-button>
        </template>
        <div class="mb-6">
          <a-alert :message="sceneDesc" show-icon type="warning" />
        </div>
        <PasswordChangeForm @success="handleSuccess" />
      </a-card>
    </div>
  </div>
</template>
