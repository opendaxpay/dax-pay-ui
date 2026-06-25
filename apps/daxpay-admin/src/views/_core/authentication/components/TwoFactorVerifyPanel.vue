<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { useMessage } from '#/hooks/useMessage';
  import { useAuthStore } from '#/store';

  defineOptions({ name: 'TwoFactorVerifyPanel' });

  const authStore = useAuthStore();
  const { message } = useMessage();

  // 验证码类型: TOTP 动态码 / BACKUP 备用码
  const codeType = ref<'BACKUP' | 'TOTP'>('TOTP');
  const code = ref('');

  /** 提交二次验证 */
  async function handleSubmit() {
    if (!code.value) {
      message.warning($t('authentication.twoFactor.codePlaceholder'));
      return;
    }
    await authStore.twoFactorVerify(code.value, codeType.value);
  }

  /** 取消, 返回账号密码登录 */
  function handleCancel() {
    authStore.cancelTwoFactor();
    code.value = '';
  }
</script>

<template>
  <div>
    <!-- 验证码类型切换 -->
    <a-radio-group v-model:value="codeType" class="mb-3 w-full">
      <a-radio-button value="TOTP" class="w-1/2 text-center">
        {{ $t('authentication.twoFactor.totp') }}
      </a-radio-button>
      <a-radio-button value="BACKUP" class="w-1/2 text-center">
        {{ $t('authentication.twoFactor.backup') }}
      </a-radio-button>
    </a-radio-group>
    <!-- 验证码输入 -->
    <a-input
      v-model:value="code"
      :placeholder="
        codeType === 'TOTP'
          ? $t('authentication.twoFactor.codePlaceholder')
          : $t('authentication.twoFactor.backupPlaceholder')
      "
      size="large"
      allow-clear
      style="text-align: center; font-size: 18px; letter-spacing: 4px"
      @keypress.enter="handleSubmit"
    />
    <!-- 验证并登录 -->
    <a-button type="primary" block size="large" class="mt-4" :loading="authStore.loginLoading" @click="handleSubmit">
      {{ $t('authentication.twoFactor.submit') }}
    </a-button>
    <!-- 返回 -->
    <a-button block size="large" class="mt-2" @click="handleCancel">
      {{ $t('authentication.twoFactor.cancel') }}
    </a-button>
  </div>
</template>
