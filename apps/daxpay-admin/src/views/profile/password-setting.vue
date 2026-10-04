<script setup lang="ts">
  import { $t } from '@vben/locales';

  import PasswordChangeForm from './components/password-change-form.vue';
  import PasswordExpiryTip from './components/password-expiry-tip.vue';

  defineOptions({ name: 'ProfilePasswordSetting' });
</script>

<template>
  <a-card :title="$t('profile.changePassword')" variant="borderless">
    <div class="max-w-lg">
      <!-- 密码有效期 / 即将过期提示 -->
      <PasswordExpiryTip />
      <!-- 个人设置场景改密成功后停留当前页 -->
      <PasswordChangeForm />
    </div>
  </a-card>
</template>
