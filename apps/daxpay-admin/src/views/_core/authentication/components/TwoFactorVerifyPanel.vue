<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t, i18n } from '@vben/locales';

  import { useMessage } from '#/hooks/useMessage';
  import { useAuthStore } from '#/store';

  defineOptions({ name: 'TwoFactorVerifyPanel' });

  const authStore = useAuthStore();
  const { message } = useMessage();

  // 中文环境验证码字符保持 4px 间距更易读, 英文环境不使用间距避免占位符字母被撑开
  const isZhLocale = computed(() => i18n.global.locale.value.startsWith('zh'));

  // 验证码类型: TOTP 动态码 / BACKUP 备用码
  const codeType = ref<'BACKUP' | 'TOTP'>('TOTP');
  const code = ref('');

  /** 提交二次验证 */
  async function handleSubmit() {
    if (!code.value) {
      message.warning($t('_core.authentication.twoFactor.codePlaceholder'));
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
    <a-radio-group
      v-model:value="codeType"
      button-style="solid"
      class="w-full"
      :style="{ display: 'block', marginBottom: '16px' }"
    >
      <a-radio-button value="TOTP" class="w-1/2 text-center">
        {{ $t('_core.authentication.twoFactor.totp') }}
      </a-radio-button>
      <a-radio-button value="BACKUP" class="w-1/2 text-center">
        {{ $t('_core.authentication.twoFactor.backup') }}
      </a-radio-button>
    </a-radio-group>
    <!-- 验证码输入 -->
    <a-input
      v-model:value="code"
      :placeholder="
        codeType === 'TOTP'
          ? $t('_core.authentication.twoFactor.codePlaceholder')
          : $t('_core.authentication.twoFactor.backupPlaceholder')
      "
      size="large"
      allow-clear
      :style="{
        textAlign: 'center',
        fontSize: '18px',
        letterSpacing: isZhLocale ? '4px' : 'normal',
      }"
      @keypress.enter="handleSubmit"
    />
    <!-- 验证并登录 -->
    <a-button type="primary" block size="large" class="mt-4" :loading="authStore.loginLoading" @click="handleSubmit">
      {{ $t('_core.authentication.twoFactor.submit') }}
    </a-button>
    <!-- 返回 -->
    <a-button block size="large" class="mt-2" @click="handleCancel">
      {{ $t('_core.authentication.twoFactor.cancel') }}
    </a-button>
  </div>
</template>
