<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t, i18n } from '@vben/locales';

  import { useMessage } from '#/hooks/useMessage';
  import { useAuthStore } from '#/store';

  defineOptions({ name: 'TwoFactorVerifyPanel' });

  const authStore = useAuthStore();
  const { message } = useMessage();

  // 中文环境备用码字符保持 4px 间距更易读, 英文环境不使用间距避免占位符字母被撑开
  const isZhLocale = computed(() => i18n.global.locale.value.startsWith('zh'));

  // 验证码类型: TOTP 动态码 / BACKUP 备用码
  const codeType = ref<'BACKUP' | 'TOTP'>('TOTP');
  const code = ref('');

  // 切换验证码类型时清空, 两者格式不同(动态码6位数字 / 备用码8位含连字符)避免错位
  watch(codeType, () => {
    code.value = '';
  });

  /** 提交二次验证 */
  async function handleSubmit() {
    if (!code.value) {
      message.warning(
        codeType.value === 'TOTP'
          ? $t('_core.authentication.twoFactor.codePlaceholder')
          : $t('_core.authentication.twoFactor.backupPlaceholder'),
      );
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
    <!-- TOTP 动态码: 一次性密码框(6位分格) -->
    <div v-if="codeType === 'TOTP'" style="display: flex; justify-content: center">
      <a-input-otp v-model:value="code" :length="6" size="large" />
    </div>
    <!-- 备用码: 普通输入框(格式如 K7MQ-AB3X, 保持不变) -->
    <a-input
      v-else
      v-model:value="code"
      :placeholder="$t('_core.authentication.twoFactor.backupPlaceholder')"
      size="large"
      allow-clear
      :style="{
        textAlign: 'center',
        fontSize: '18px',
        letterSpacing: isZhLocale ? '4px' : 'normal',
      }"
      @keypress.enter="handleSubmit"
    />
    <!-- 验证并登录 (动态码输满6位方可点击) -->
    <a-button
      type="primary"
      block
      size="large"
      class="mt-4"
      :disabled="codeType === 'TOTP' && code.length < 6"
      :loading="authStore.loginLoading"
      @click="handleSubmit"
    >
      {{ $t('_core.authentication.twoFactor.submit') }}
    </a-button>
    <!-- 返回 -->
    <a-button block size="large" class="mt-2" @click="handleCancel">
      {{ $t('_core.authentication.twoFactor.cancel') }}
    </a-button>
  </div>
</template>
