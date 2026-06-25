<script lang="ts" setup>
  import type { BackupCodeResult, TwoFactorSetup, TwoFactorStatus } from '#/api/core/two-factor.api';

  import { computed, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import QRCode from 'qrcode';

  import { TwoFactorApi } from '#/api/core/two-factor.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ProfileSecuritySetting' });

  const { message, notification } = useMessage();

  // 当前 2FA 状态
  const status = ref<TwoFactorStatus>({});
  const loading = ref(false);

  // 视图状态: overview 概览 / binding 绑定分步
  const viewState = ref<'binding' | 'overview'>('overview');
  // 绑定步骤: 0 扫码 / 1 输码 / 2 备用码
  const current = ref(0);

  // 绑定过程数据
  const setupData = ref<null | TwoFactorSetup>(null);
  const qrDataUrl = ref('');
  const confirmCode = ref('');
  const backupResult = ref<BackupCodeResult | null>(null);
  const savedChecked = ref(false);
  const actionLoading = ref(false);

  // 验证码确认弹窗(disable / regenerate 共用)
  const confirmModalVisible = ref(false);
  const confirmModalAction = ref<'disable' | 'regenerate'>('disable');
  const confirmModalCode = ref('');
  // 确认弹窗验证码类型(disable / regenerate 共用)
  const confirmModalCodeType = ref<'BACKUP' | 'TOTP'>('TOTP');

  // 切换验证码类型时清空, 两者格式不同(动态码6位数字 / 备用码8位含连字符)避免错位
  watch(confirmModalCodeType, () => {
    confirmModalCode.value = '';
  });
  // 重新生成的备用码(弹窗内展示)
  const regenBackupResult = ref<BackupCodeResult | null>(null);

  // 是否已绑定
  const bound = computed(() => status.value.bound === true);
  // 平台是否开启
  const platformEnabled = computed(() => status.value.platformEnabled === true);
  // 绑定步骤条配置
  const stepItems = computed(() => [
    { title: $t('profile.twoFactor.stepScan') },
    { title: $t('profile.twoFactor.stepVerify') },
    { title: $t('profile.twoFactor.stepBackup') },
  ]);

  /** 拉取 2FA 状态 */
  async function fetchStatus() {
    loading.value = true;
    try {
      const { data } = await TwoFactorApi.status();
      status.value = data ?? {};
    } finally {
      loading.value = false;
    }
  }

  /** 开始绑定 */
  async function handleStartBind() {
    actionLoading.value = true;
    try {
      const { data } = await TwoFactorApi.setup();
      setupData.value = data;
      confirmCode.value = '';
      current.value = 0;
      // 渲染二维码
      qrDataUrl.value = data?.otpAuthUri ? await QRCode.toDataURL(data.otpAuthUri, { width: 200, margin: 1 }) : '';
      viewState.value = 'binding';
    } finally {
      actionLoading.value = false;
    }
  }

  /** 步骤1 下一步 */
  function handleNext() {
    current.value = 1;
  }

  /** 步骤2 确认绑定 */
  async function handleConfirmBind() {
    if (!confirmCode.value || !setupData.value?.secret) {
      return;
    }
    actionLoading.value = true;
    try {
      const { data } = await TwoFactorApi.confirm({
        secret: setupData.value.secret,
        code: confirmCode.value,
      });
      backupResult.value = data;
      savedChecked.value = false;
      current.value = 2;
      message.success($t('profile.twoFactor.bindSuccess'));
    } finally {
      actionLoading.value = false;
    }
  }

  /** 取消绑定 */
  function handleCancelBind() {
    viewState.value = 'overview';
    setupData.value = null;
    confirmCode.value = '';
    backupResult.value = null;
  }

  /** 完成绑定 */
  async function handleDone() {
    await fetchStatus();
    viewState.value = 'overview';
    backupResult.value = null;
  }

  /** 打开关闭确认弹窗 */
  function handleDisable() {
    confirmModalAction.value = 'disable';
    confirmModalCode.value = '';
    confirmModalCodeType.value = 'TOTP';
    regenBackupResult.value = null;
    confirmModalVisible.value = true;
  }

  /** 打开重新生成备用码确认弹窗 */
  function handleRegenerate() {
    confirmModalAction.value = 'regenerate';
    confirmModalCode.value = '';
    confirmModalCodeType.value = 'TOTP';
    regenBackupResult.value = null;
    confirmModalVisible.value = true;
  }

  /** 确认弹窗确认 */
  async function handleConfirmModalOk() {
    if (!confirmModalCode.value) {
      return;
    }
    actionLoading.value = true;
    try {
      if (confirmModalAction.value === 'disable') {
        await TwoFactorApi.disable({ code: confirmModalCode.value, codeType: confirmModalCodeType.value });
        message.success($t('profile.twoFactor.disableSuccess'));
        confirmModalVisible.value = false;
        await fetchStatus();
      } else {
        const { data } = await TwoFactorApi.regenerateBackupCodes({
          code: confirmModalCode.value,
          codeType: confirmModalCodeType.value,
        });
        regenBackupResult.value = data;
        message.success($t('profile.twoFactor.regenSuccess'));
        await fetchStatus();
      }
    } finally {
      actionLoading.value = false;
    }
  }

  /** 复制文本 */
  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      notification.success({ title: $t('profile.twoFactor.copied') });
    } catch {
      message.error($t('profile.twoFactor.copy'));
    }
  }

  /** 复制全部备用码 */
  async function copyAllBackup(codes?: string[]) {
    if (!codes?.length) {
      return;
    }
    await copyText(codes.join('\n'));
  }

  /** 下载备用码 */
  function downloadBackup(codes?: string[]) {
    if (!codes?.length) {
      return;
    }
    const blob = new Blob([codes.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  onMounted(fetchStatus);
</script>

<template>
  <a-spin :spinning="loading">
    <!-- 概览视图 -->
    <a-card v-if="viewState === 'overview'" variant="borderless">
      <template #title>
        <div class="tf-card-title">
          <span>{{ $t('profile.twoFactor.title') }}</span>
          <!-- 平台开启时显示绑定状态标签 -->
          <a-tag v-if="platformEnabled && !bound" color="default">{{ $t('profile.twoFactor.unbound') }}</a-tag>
          <a-tag v-else-if="platformEnabled && bound" color="green">{{ $t('profile.twoFactor.bound') }}</a-tag>
        </div>
      </template>
      <!-- 平台未开启 -->
      <a-alert
        v-if="!platformEnabled"
        type="info"
        show-icon
        :message="$t('profile.twoFactor.platformOff')"
        :description="$t('profile.twoFactor.platformOffDesc')"
      />
      <!-- 平台开启 + 未绑定 -->
      <div v-else-if="!bound" class="tf-overview">
        <div class="tf-overview__desc">{{ $t('profile.twoFactor.unboundDesc') }}</div>
        <a-button type="primary" :loading="actionLoading" @click="handleStartBind">
          {{ $t('profile.twoFactor.bindNow') }}
        </a-button>
      </div>
      <!-- 已绑定 -->
      <div v-else class="tf-overview">
        <div class="tf-overview__meta">
          <span>{{ $t('profile.twoFactor.remaining') }}: {{ status.backupCodesRemaining ?? 0 }}</span>
        </div>
        <div class="tf-overview__actions">
          <a-button :loading="actionLoading" @click="handleRegenerate">
            {{ $t('profile.twoFactor.regenerate') }}
          </a-button>
          <a-button danger :loading="actionLoading" @click="handleDisable">
            {{ $t('profile.twoFactor.disable') }}
          </a-button>
        </div>
      </div>
    </a-card>

    <!-- 绑定分步视图 -->
    <a-card v-else :title="$t('profile.twoFactor.bindTitle')" variant="borderless">
      <a-steps :current="current" size="small" :items="stepItems" class="tf-steps" />

      <!-- 步骤1 扫码 -->
      <div v-if="current === 0" class="tf-step">
        <p class="tf-step__tip">{{ $t('profile.twoFactor.scanTip') }}</p>
        <div class="tf-step__scan">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="tf-step__qr" />
          <div class="tf-step__manual">
            <div class="tf-step__manual-label">{{ $t('profile.twoFactor.manual') }}</div>
            <div class="tf-step__secret">
              <code>{{ setupData?.secret }}</code>
              <a-button size="small" type="link" @click="copyText(setupData?.secret ?? '')">
                {{ $t('profile.twoFactor.copy') }}
              </a-button>
            </div>
          </div>
        </div>
        <div class="tf-step__actions">
          <a-button @click="handleCancelBind">{{ $t('profile.twoFactor.cancel') }}</a-button>
          <a-button type="primary" @click="handleNext">{{ $t('profile.twoFactor.next') }}</a-button>
        </div>
      </div>

      <!-- 步骤2 输入验证码 -->
      <div v-if="current === 1" class="tf-step">
        <!-- 一次性密码框(6位分格, 中间3-3分隔) -->
        <a-input-otp v-model:value="confirmCode" :length="6" size="large">
          <template #separator>
            <span style="flex: 1; text-align: center; color: hsl(var(--muted-foreground))">-</span>
          </template>
        </a-input-otp>
        <div class="tf-step__actions">
          <a-button @click="current = 0">{{ $t('profile.twoFactor.prev') }}</a-button>
          <a-button
            type="primary"
            :disabled="confirmCode.length < 6"
            :loading="actionLoading"
            @click="handleConfirmBind"
          >
            {{ $t('profile.twoFactor.confirmBind') }}
          </a-button>
        </div>
      </div>

      <!-- 步骤3 备用码 -->
      <div v-if="current === 2" class="tf-step">
        <a-alert type="warning" show-icon :message="$t('profile.twoFactor.backupTip')" style="margin-bottom: 16px" />
        <div class="tf-backup-list">
          <div v-for="(code, idx) in backupResult?.codes" :key="idx" class="tf-backup-item">
            <code>{{ idx + 1 }}. {{ code }}</code>
          </div>
        </div>
        <div class="tf-step__actions">
          <a-button @click="copyAllBackup(backupResult?.codes)">{{ $t('profile.twoFactor.copyAll') }}</a-button>
          <a-button @click="downloadBackup(backupResult?.codes)">{{ $t('profile.twoFactor.download') }}</a-button>
        </div>
        <a-checkbox v-model:checked="savedChecked" style="margin-top: 16px">
          {{ $t('profile.twoFactor.savedConfirm') }}
        </a-checkbox>
        <div class="tf-step__actions">
          <a-button type="primary" :disabled="!savedChecked" @click="handleDone">
            {{ $t('profile.twoFactor.done') }}
          </a-button>
        </div>
      </div>
    </a-card>

    <!-- 验证码确认弹窗(disable / regenerate) -->
    <a-modal
      v-model:open="confirmModalVisible"
      :title="$t('profile.twoFactor.codeInputTitle')"
      :confirm-loading="actionLoading"
      :ok-text="$t('profile.twoFactor.confirm')"
      :cancel-text="$t('profile.twoFactor.cancel')"
      :ok-button-props="{
        disabled: !regenBackupResult && confirmModalCodeType === 'TOTP' && confirmModalCode.length < 6,
      }"
      @ok="handleConfirmModalOk"
    >
      <!-- 重新生成成功后展示新备用码 -->
      <template v-if="regenBackupResult">
        <a-alert type="warning" show-icon :message="$t('profile.twoFactor.backupTip')" style="margin-bottom: 12px" />
        <div class="tf-backup-list">
          <div v-for="(code, idx) in regenBackupResult.codes" :key="idx" class="tf-backup-item">
            <code>{{ idx + 1 }}. {{ code }}</code>
          </div>
        </div>
        <div class="tf-step__actions">
          <a-button size="small" @click="copyAllBackup(regenBackupResult.codes)">
            {{ $t('profile.twoFactor.copyAll') }}
          </a-button>
          <a-button size="small" @click="downloadBackup(regenBackupResult.codes)">
            {{ $t('profile.twoFactor.download') }}
          </a-button>
        </div>
      </template>
      <template v-else>
        <p style="margin-bottom: 12px">
          {{
            confirmModalAction === 'disable'
              ? $t('profile.twoFactor.disableConfirm')
              : $t('profile.twoFactor.regenConfirm')
          }}
        </p>
        <p style="color: hsl(var(--muted-foreground)); margin-bottom: 8px">{{
          $t('profile.twoFactor.codeInputTip')
        }}</p>
        <!-- 验证码类型切换 -->
        <a-radio-group
          v-model:value="confirmModalCodeType"
          button-style="solid"
          class="w-full"
          :style="{ display: 'block', marginBottom: '16px' }"
        >
          <a-radio-button value="TOTP" class="w-1/2 text-center">{{ $t('profile.twoFactor.totp') }}</a-radio-button>
          <a-radio-button value="BACKUP" class="w-1/2 text-center">{{ $t('profile.twoFactor.backup') }}</a-radio-button>
        </a-radio-group>
        <!-- TOTP 动态码: 一次性密码框(6位分格, 中间3-3分隔) -->
        <div v-if="confirmModalCodeType === 'TOTP'" class="tf-otp">
          <a-input-otp v-model:value="confirmModalCode" :length="6">
            <template #separator>
              <span style="flex: 1; text-align: center; color: hsl(var(--muted-foreground))">-</span>
            </template>
          </a-input-otp>
        </div>
        <!-- 备用码: 普通输入框(格式如 K7MQ-AB3X, 保持不变) -->
        <a-input
          v-else
          v-model:value="confirmModalCode"
          :placeholder="$t('profile.twoFactor.backupCodePlaceholder')"
          style="text-align: center; font-size: 16px; letter-spacing: 4px"
        />
      </template>
    </a-modal>
  </a-spin>
</template>

<style scoped>
  .tf-overview {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 0;
  }

  .tf-card-title {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .tf-overview__desc {
    color: hsl(var(--muted-foreground));
    font-size: 13px;
  }

  .tf-overview__meta {
    color: hsl(var(--muted-foreground));
    font-size: 13px;
  }

  .tf-overview__actions {
    display: flex;
    gap: 12px;
  }

  .tf-steps {
    margin-bottom: 24px;
  }

  .tf-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 0;
  }

  .tf-step__tip {
    color: hsl(var(--muted-foreground));
    font-size: 13px;
    text-align: center;
    margin-bottom: 16px;
  }

  .tf-step__scan {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }

  .tf-step__qr {
    width: 200px;
    height: 200px;
    border: 1px solid hsl(var(--border));
    border-radius: 8px;
  }

  .tf-step__manual {
    text-align: center;
  }

  .tf-step__manual-label {
    color: hsl(var(--muted-foreground));
    font-size: 12px;
    margin-bottom: 4px;
  }

  .tf-step__secret {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .tf-step__secret code {
    padding: 4px 8px;
    background: hsl(var(--accent));
    border-radius: 4px;
    font-size: 14px;
    letter-spacing: 1px;
  }

  .tf-step__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 24px;
  }

  .tf-backup-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 24px;
    padding: 12px;
    background: hsl(var(--accent));
    border-radius: 8px;
  }

  .tf-backup-item code {
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 1px;
  }

  /* OTP 6格占满宽度, 中间分隔符弹性撑开分成3-3两组
     用本组件元素(.tf-step / .tf-otp)做 :deep 锚点, teleport 后祖先仍带 scope id */
  .tf-step :deep(.ant-otp),
  .tf-otp :deep(.ant-otp) {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 4px;
    justify-content: space-between;
  }
</style>
