<script lang="ts" setup>
  import type { UserPasskeyItem } from '#/api/core/passkey.api';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { startRegistration } from '@simplewebauthn/browser';

  import { PasskeyApi } from '#/api/core/passkey.api';
  import { useMessage } from '#/hooks/useMessage';
  import { encryptPassword } from '#/utils/rsa-encrypt';

  defineOptions({ name: 'ProfilePasskeySetting' });

  const { message } = useMessage();

  /** 已绑定凭据列表 */
  const passkeyList = ref<UserPasskeyItem[]>([]);
  const loading = ref(false);

  /** 当前浏览器是否支持通行密钥 */
  const passkeySupported =
    typeof window !== 'undefined' && window.PublicKeyCredential !== undefined && window.isSecureContext === true;

  // ===== 添加流程(密码确认 → 系统注册弹窗 → 命名) =====
  /** 密码确认弹窗 */
  const passwordVisible = ref(false);
  const passwordValue = ref('');
  const passwordLoading = ref(false);

  /** 系统注册完成待命名的凭据 */
  interface PendingCredential {
    challengeId: string;
    credentialJson: string;
    transports?: string[];
  }

  const pendingCredential = ref<null | PendingCredential>(null);

  /** 命名弹窗 */
  const namingVisible = ref(false);
  const deviceName = ref('');
  const namingLoading = ref(false);

  // ===== 重命名 =====
  const renameVisible = ref(false);
  const renameTarget = ref<null | UserPasskeyItem>(null);
  const renameName = ref('');
  const renameLoading = ref(false);

  // ===== 删除(需密码确认) =====
  const deleteVisible = ref(false);
  const deleteTarget = ref<null | UserPasskeyItem>(null);
  const deletePassword = ref('');
  const deleteLoading = ref(false);

  /** 拉取已绑定凭据列表 */
  async function fetchData() {
    loading.value = true;
    try {
      const { data } = await PasskeyApi.list();
      passkeyList.value = data ?? [];
    } finally {
      loading.value = false;
    }
  }

  /** 打开添加流程(密码确认) */
  function handleAddStart() {
    passwordValue.value = '';
    passwordVisible.value = true;
  }

  /**
   * 密码确认通过后唤起系统注册弹窗
   */
  async function handlePasswordConfirm() {
    if (!passwordValue.value) {
      message.warning($t('profile.passkeyPasswordRequired'));
      return;
    }
    passwordLoading.value = true;
    try {
      // RSA 加密传输(与登录/改密一致)
      const encrypted = await encryptPassword(passwordValue.value);
      const { data } = await PasskeyApi.registerOptions(encrypted);
      if (!data) {
        return;
      }
      passwordVisible.value = false;
      // 唤起系统注册弹窗
      const credential = await startRegistration({ optionsJSON: data.options });
      pendingCredential.value = {
        challengeId: data.challengeId,
        credentialJson: JSON.stringify(credential),
        transports: credential.response.transports ?? undefined,
      };
      deviceName.value = '';
      namingVisible.value = true;
    } catch (error: unknown) {
      // NotAllowedError/AbortError 多为用户在系统弹窗主动取消, 静默返回;
      // 其余为环境错误(如平台 rpId 与访问域名不匹配), 给出提示便于定位
      const name = (error as { name?: string })?.name ?? '';
      console.warn('[passkey] 注册流程中断:', name, error);
      if (name !== 'NotAllowedError' && name !== 'AbortError') {
        message.error($t('profile.passkeyCreateFailed'));
      }
    } finally {
      passwordLoading.value = false;
    }
  }

  /** 命名并提交注册 */
  async function handleNamingConfirm() {
    if (!pendingCredential.value) {
      namingVisible.value = false;
      return;
    }
    if (!deviceName.value.trim()) {
      message.warning($t('profile.passkeyNameRequired'));
      return;
    }
    namingLoading.value = true;
    try {
      await PasskeyApi.register({
        challengeId: pendingCredential.value.challengeId,
        credentialJson: pendingCredential.value.credentialJson,
        deviceName: deviceName.value.trim(),
        transports: pendingCredential.value.transports,
      });
      message.success($t('profile.passkeyAddSuccess'));
      namingVisible.value = false;
      pendingCredential.value = null;
      await fetchData();
    } finally {
      namingLoading.value = false;
    }
  }

  /** 打开重命名弹窗 */
  function handleRenameStart(item: UserPasskeyItem) {
    renameTarget.value = item;
    renameName.value = item.deviceName ?? '';
    renameVisible.value = true;
  }

  /** 提交重命名 */
  async function handleRenameConfirm() {
    if (!renameTarget.value) {
      renameVisible.value = false;
      return;
    }
    if (!renameName.value.trim()) {
      message.warning($t('profile.passkeyNameRequired'));
      return;
    }
    renameLoading.value = true;
    try {
      await PasskeyApi.rename({
        id: renameTarget.value.id,
        deviceName: renameName.value.trim(),
      });
      message.success($t('profile.passkeyRenameSuccess'));
      renameVisible.value = false;
      await fetchData();
    } finally {
      renameLoading.value = false;
    }
  }

  /** 打开删除弹窗 */
  function handleDeleteStart(item: UserPasskeyItem) {
    deleteTarget.value = item;
    deletePassword.value = '';
    deleteVisible.value = true;
  }

  /** 提交删除(密码确认) */
  async function handleDeleteConfirm() {
    if (!deleteTarget.value) {
      deleteVisible.value = false;
      return;
    }
    if (!deletePassword.value) {
      message.warning($t('profile.passkeyPasswordRequired'));
      return;
    }
    deleteLoading.value = true;
    try {
      const encrypted = await encryptPassword(deletePassword.value);
      await PasskeyApi.remove({
        id: deleteTarget.value.id,
        password: encrypted,
      });
      message.success($t('profile.passkeyDeleteSuccess'));
      deleteVisible.value = false;
      await fetchData();
    } finally {
      deleteLoading.value = false;
    }
  }

  onMounted(() => {
    fetchData();
  });
</script>

<template>
  <a-spin :spinning="loading">
    <a-card :title="$t('profile.passkey')" variant="borderless">
      <template #extra>
        <a-button v-if="passkeySupported" type="primary" size="small" @click="handleAddStart">
          <!-- 国际化：添加通行密钥 -->
          {{ $t('profile.passkeyAdd') }}
        </a-button>
      </template>

      <!-- 浏览器不支持提示(仅说明, 列表仍可管理) -->
      <div v-if="!passkeySupported" class="mb-3">
        <a-alert :message="$t('profile.passkeyUnsupported')" show-icon type="warning" />
      </div>

      <a-empty v-if="passkeyList.length === 0" :description="$t('profile.passkeyEmpty')" />
      <div v-else class="space-y-1">
        <div
          v-for="item in passkeyList"
          :key="item.id"
          class="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
        >
          <div class="flex items-center gap-3">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="text-base font-medium">{{ item.deviceName }}</span>
                <!-- 同步状态标签 -->
                <a-tag v-if="item.backupEligible" color="blue">
                  <!-- 国际化：多设备同步 -->
                  {{ $t('profile.passkeySynced') }}
                </a-tag>
                <a-tag v-else color="default">
                  <!-- 国际化：仅此设备 -->
                  {{ $t('profile.passkeyLocal') }}
                </a-tag>
              </div>
              <div class="text-xs text-gray-400">
                <!-- 国际化：创建时间 -->
                {{ $t('profile.passkeyCreated') }}: {{ formatDateTime(item.createTime) || '-' }}
                ·
                <!-- 国际化：最后使用 -->
                {{ $t('profile.passkeyLastUsed') }}:
                {{ item.lastUsedTime ? formatDateTime(item.lastUsedTime) || '-' : $t('profile.passkeyNeverUsed') }}
              </div>
            </div>
          </div>
          <a-space :size="2">
            <template #separator>
              <a-divider type="vertical" />
            </template>
            <a-button size="small" type="link" @click="handleRenameStart(item)">
              <!-- 国际化：重命名 -->
              {{ $t('profile.passkeyRename') }}
            </a-button>
            <a-button size="small" type="link" danger @click="handleDeleteStart(item)">
              <!-- 国际化：删除 -->
              {{ $t('profile.passkeyDelete') }}
            </a-button>
          </a-space>
        </div>
      </div>
    </a-card>

    <!-- 添加-密码确认弹窗 -->
    <a-modal
      v-model:open="passwordVisible"
      :title="$t('profile.passkeyPasswordTitle')"
      :confirm-loading="passwordLoading"
      :ok-text="$t('common.confirm')"
      :cancel-text="$t('common.cancel')"
      @ok="handlePasswordConfirm"
    >
      <a-form layout="vertical">
        <a-form-item :label="$t('profile.passkeyPasswordLabel')" required>
          <a-input-password
            v-model:value="passwordValue"
            :placeholder="$t('authentication.passwordTip')"
            @keypress.enter="handlePasswordConfirm"
          />
        </a-form-item>
        <div class="text-xs text-gray-400">{{ $t('profile.passkeyPasswordHint') }}</div>
      </a-form>
    </a-modal>

    <!-- 添加-命名弹窗 -->
    <a-modal
      v-model:open="namingVisible"
      :title="$t('profile.passkeyNamingTitle')"
      :confirm-loading="namingLoading"
      :ok-text="$t('common.confirm')"
      :cancel-text="$t('common.cancel')"
      @ok="handleNamingConfirm"
    >
      <a-form layout="vertical">
        <a-form-item :label="$t('profile.passkeyNameLabel')" required>
          <a-input
            v-model:value="deviceName"
            :placeholder="$t('profile.passkeyNamePlaceholder')"
            :maxlength="128"
            @keypress.enter="handleNamingConfirm"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 重命名弹窗 -->
    <a-modal
      v-model:open="renameVisible"
      :title="$t('profile.passkeyRename')"
      :confirm-loading="renameLoading"
      :ok-text="$t('common.confirm')"
      :cancel-text="$t('common.cancel')"
      @ok="handleRenameConfirm"
    >
      <a-form layout="vertical">
        <a-form-item :label="$t('profile.passkeyNameLabel')" required>
          <a-input
            v-model:value="renameName"
            :placeholder="$t('profile.passkeyNamePlaceholder')"
            :maxlength="128"
            @keypress.enter="handleRenameConfirm"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除弹窗(密码确认) -->
    <a-modal
      v-model:open="deleteVisible"
      :title="$t('profile.passkeyDeleteTitle')"
      :confirm-loading="deleteLoading"
      :ok-text="$t('profile.passkeyDelete')"
      :ok-button-props="{ danger: true }"
      :cancel-text="$t('common.cancel')"
      @ok="handleDeleteConfirm"
    >
      <a-form layout="vertical">
        <div class="mb-3">{{ $t('profile.passkeyDeleteConfirm', { name: deleteTarget?.deviceName ?? '' }) }}</div>
        <a-form-item :label="$t('profile.passkeyPasswordLabel')" required>
          <a-input-password
            v-model:value="deletePassword"
            :placeholder="$t('authentication.passwordTip')"
            @keypress.enter="handleDeleteConfirm"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-spin>
</template>
