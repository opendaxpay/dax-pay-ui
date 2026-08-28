<script lang="ts" setup>
  import { onMounted, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { EmailApi } from '#/api/core/email.api';
  import { useMessage } from '#/hooks/useMessage';
  import { encryptPassword } from '#/utils/rsa-encrypt';

  defineOptions({ name: 'ProfileEmailSetting' });

  const { message } = useMessage();

  /** 邮箱绑定状态 */
  const emailInfo = reactive({
    email: '',
    emailVerified: false,
  });
  const loading = ref(false);

  // ===== 绑定/换绑/验证流程(密码确认 + 新邮箱 → 邮箱验证码) =====
  const bindVisible = ref(false);
  // 弹窗阶段: form 填写并发送验证码 / code 输入邮箱验证码确认
  const bindPhase = ref<'code' | 'form'>('form');
  const bindSubmitting = ref(false);
  const bindForm = reactive({
    password: '',
    email: '',
  });
  const bindCode = ref('');

  /** 解绑弹窗(两阶段: 密码确认发送验证码 → 输入验证码确认解绑, 与绑定弹窗同构) */
  const unbindVisible = ref(false);
  const unbindPhase = ref<'code' | 'password'>('password');
  const unbindSubmitting = ref(false);
  const unbindPassword = ref('');
  const unbindCode = ref('');

  /** 拉取邮箱绑定状态 */
  async function fetchData() {
    loading.value = true;
    try {
      const { data } = await EmailApi.getInfo();
      emailInfo.email = data?.email ?? '';
      emailInfo.emailVerified = data?.emailVerified ?? false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 打开绑定/换绑/验证弹窗(未验证的已有邮箱预填, 密码确认在前防会话劫持)
   */
  function handleBindStart() {
    bindPhase.value = 'form';
    bindForm.password = '';
    // 已绑定但未验证时预填当前邮箱(重新验证场景)
    bindForm.email = emailInfo.email && !emailInfo.emailVerified ? emailInfo.email : '';
    bindCode.value = '';
    bindVisible.value = true;
  }

  /**
   * 第一阶段提交: 发送邮箱验证码
   */
  async function handleSendCode() {
    if (!bindForm.password || !bindForm.email) {
      // 国际化: 请完整填写表单提示
      message.warning($t('profile.emailBindFormRequired'));
      return;
    }
    bindSubmitting.value = true;
    try {
      // 登录密码 RSA 加密传输
      const encrypted = await encryptPassword(bindForm.password);
      await EmailApi.sendBindCode({
        password: encrypted,
        email: bindForm.email,
      });
      bindPhase.value = 'code';
      bindCode.value = '';
      // 国际化: 验证码已发送提示
      message.success($t('profile.emailBindCodeSent', { email: bindForm.email }));
    } finally {
      bindSubmitting.value = false;
    }
  }

  /**
   * 第二阶段提交: 确认绑定
   */
  async function handleBindConfirm() {
    if (!bindCode.value) {
      message.warning($t('profile.emailBindCodeRequired'));
      return;
    }
    bindSubmitting.value = true;
    try {
      await EmailApi.bindConfirm({ code: bindCode.value });
      message.success($t('profile.emailBindSuccess'));
      bindVisible.value = false;
      await fetchData();
    } finally {
      bindSubmitting.value = false;
    }
  }

  /**
   * 打开解绑弹窗(两阶段: 密码确认发送验证码 → 验证码确认, danger 按钮即二次确认)
   */
  function handleUnbindStart() {
    unbindPhase.value = 'password';
    unbindPassword.value = '';
    unbindCode.value = '';
    unbindVisible.value = true;
  }

  /**
   * 解绑第一阶段: 密码确认并发送验证码至当前绑定邮箱
   */
  async function handleUnbindSendCode() {
    if (!unbindPassword.value) {
      message.warning($t('profile.passkeyPasswordRequired'));
      return;
    }
    unbindSubmitting.value = true;
    try {
      const encrypted = await encryptPassword(unbindPassword.value);
      await EmailApi.sendUnbindCode({ password: encrypted });
      unbindPhase.value = 'code';
      unbindCode.value = '';
      // 国际化: 解绑验证码已发送提示
      message.success($t('profile.emailUnbindCodeSent', { email: emailInfo.email }));
    } finally {
      unbindSubmitting.value = false;
    }
  }

  /**
   * 解绑第二阶段: 确认解绑
   */
  async function handleUnbindConfirm() {
    if (!unbindCode.value) {
      message.warning($t('profile.emailBindCodeRequired'));
      return;
    }
    unbindSubmitting.value = true;
    try {
      const encrypted = await encryptPassword(unbindPassword.value);
      await EmailApi.unbind({ password: encrypted, code: unbindCode.value });
      message.success($t('profile.emailUnbindSuccess'));
      unbindVisible.value = false;
      await fetchData();
    } finally {
      unbindSubmitting.value = false;
    }
  }

  onMounted(() => {
    fetchData();
  });
</script>

<template>
  <a-spin :spinning="loading">
    <a-card variant="borderless">
      <template #title>
        <div class="email-card-title">
          <span>{{ $t('profile.emailBind') }}</span>
          <!-- 状态标签与双因素认证页签同范式: 未绑定灰 / 未验证橙 / 已验证绿 -->
          <a-tag v-if="!emailInfo.email" color="default">{{ $t('profile.emailUnboundTag') }}</a-tag>
          <a-tag v-else-if="!emailInfo.emailVerified" color="orange">{{ $t('profile.emailUnverifiedTag') }}</a-tag>
          <a-tag v-else color="green">{{ $t('profile.emailVerifiedTag') }}</a-tag>
        </div>
      </template>

      <!-- 未绑定: 描述 + 全宽主按钮(与双因素认证未绑定态同构) -->
      <div v-if="!emailInfo.email" class="email-overview">
        <div class="email-overview__desc">{{ $t('profile.emailBindTip') }}</div>
        <a-button type="primary" @click="handleBindStart">
          <!-- 国际化: 绑定邮箱 -->
          {{ $t('profile.emailBindAction') }}
        </a-button>
      </div>
      <!-- 已绑定未验证: 当前邮箱 + 验证/解绑 -->
      <div v-else-if="!emailInfo.emailVerified" class="email-overview">
        <div class="email-overview__meta">{{ $t('profile.emailBindEmailLabel') }}: {{ emailInfo.email }}</div>
        <div class="email-overview__desc">{{ $t('profile.emailVerifyTip') }}</div>
        <div class="email-overview__actions">
          <a-button type="primary" @click="handleBindStart">
            <!-- 国际化: 验证邮箱 -->
            {{ $t('profile.emailVerifyAction') }}
          </a-button>
          <a-button danger @click="handleUnbindStart">
            <!-- 国际化: 解绑 -->
            {{ $t('profile.emailUnbindAction') }}
          </a-button>
        </div>
      </div>
      <!-- 已验证: 当前邮箱 + 换绑/解绑(与双因素认证已绑定态同构) -->
      <div v-else class="email-overview">
        <div class="email-overview__meta">{{ $t('profile.emailBindEmailLabel') }}: {{ emailInfo.email }}</div>
        <div class="email-overview__actions">
          <a-button @click="handleBindStart">
            <!-- 国际化: 换绑邮箱 -->
            {{ $t('profile.emailChangeAction') }}
          </a-button>
          <a-button danger @click="handleUnbindStart">
            <!-- 国际化: 解绑 -->
            {{ $t('profile.emailUnbindAction') }}
          </a-button>
        </div>
      </div>
    </a-card>

    <!-- 绑定/换绑/验证弹窗(两阶段: 发送验证码 → 输入验证码) -->
    <a-modal
      v-model:open="bindVisible"
      :title="$t('profile.emailBindAction')"
      :confirm-loading="bindSubmitting"
      :ok-text="bindPhase === 'form' ? $t('profile.emailSendCode') : $t('common.confirm')"
      :cancel-text="$t('common.cancel')"
      @ok="bindPhase === 'form' ? handleSendCode() : handleBindConfirm()"
    >
      <a-form v-if="bindPhase === 'form'" layout="vertical">
        <!-- 国际化: 登录密码确认 -->
        <a-form-item :label="$t('profile.passkeyPasswordLabel')" required>
          <a-input-password v-model:value="bindForm.password" :placeholder="$t('authentication.passwordTip')" />
        </a-form-item>
        <!-- 国际化: 新邮箱 -->
        <a-form-item :label="$t('profile.emailBindEmailLabel')" required>
          <a-input v-model:value="bindForm.email" :placeholder="$t('profile.emailBindEmailPlaceholder')" />
        </a-form-item>
      </a-form>
      <a-form v-else layout="vertical">
        <!-- 国际化: 验证码已发送提示 -->
        <div class="mb-3">{{ $t('profile.emailBindCodeSent', { email: bindForm.email }) }}</div>
        <!-- 国际化: 邮箱验证码 -->
        <a-form-item :label="$t('profile.emailBindCodeLabel')" required>
          <a-input
            v-model:value="bindCode"
            :placeholder="$t('profile.emailBindCodePlaceholder')"
            :maxlength="6"
            @keypress.enter="handleBindConfirm"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 解绑弹窗(两阶段: 密码确认发送验证码 → 输入验证码确认解绑) -->
    <a-modal
      v-model:open="unbindVisible"
      :title="$t('profile.emailUnbindTitle')"
      :confirm-loading="unbindSubmitting"
      :ok-text="unbindPhase === 'password' ? $t('profile.emailSendCode') : $t('profile.emailUnbindAction')"
      :ok-button-props="{ danger: true }"
      :cancel-text="$t('common.cancel')"
      @ok="unbindPhase === 'password' ? handleUnbindSendCode() : handleUnbindConfirm()"
    >
      <a-form v-if="unbindPhase === 'password'" layout="vertical">
        <!-- 国际化: 解绑影响说明 -->
        <div class="mb-3">{{ $t('profile.emailUnbindConfirm') }}</div>
        <!-- 国际化: 登录密码确认 -->
        <a-form-item :label="$t('profile.passkeyPasswordLabel')" required>
          <a-input-password
            v-model:value="unbindPassword"
            :placeholder="$t('authentication.passwordTip')"
            @keypress.enter="handleUnbindSendCode"
          />
        </a-form-item>
      </a-form>
      <a-form v-else layout="vertical">
        <!-- 国际化: 解绑验证码已发送提示 -->
        <div class="mb-3">{{ $t('profile.emailUnbindCodeSent', { email: emailInfo.email }) }}</div>
        <!-- 国际化: 邮箱验证码 -->
        <a-form-item :label="$t('profile.emailBindCodeLabel')" required>
          <a-input
            v-model:value="unbindCode"
            :placeholder="$t('profile.emailBindCodePlaceholder')"
            :maxlength="6"
            @keypress.enter="handleUnbindConfirm"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-spin>
</template>

<style scoped>
  /* 标题行: 标题 + 状态标签(与双因素认证卡片标题同款) */
  .email-card-title {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  /* 概览区: 纵向排布, 未绑定态按钮随 flex 拉伸占满整行(与 tf-overview 一致) */
  .email-overview {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 0;
  }

  .email-overview__desc {
    color: hsl(var(--muted-foreground));
    font-size: 13px;
  }

  .email-overview__meta {
    color: hsl(var(--muted-foreground));
    font-size: 13px;
  }

  .email-overview__actions {
    display: flex;
    gap: 12px;
  }
</style>
