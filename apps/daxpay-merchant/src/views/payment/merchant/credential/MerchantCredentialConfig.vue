<script lang="ts" setup>
  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useClipboard } from '@vueuse/core';

  import {
    MerchantCredentialApi,
    type MerchantCredentialParam,
    type MerchantCredentialResult,
  } from '#/api/payment/merchant/credential.api';
  import { KeyGenApi } from '#/api/payment/merchant/key-gen.api';
  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'MerchantCredentialConfig' });

  const { diffForm } = useFormEdit();
  const { copy } = useClipboard();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const saving = ref(false);
  // 编辑模式
  const isEditing = ref(false);
  // 当前商户号（MerchantApi.get）
  const mchNo = ref('');
  const merchantInfo = ref<MerchantInfo>({});
  // 表单数据
  const formState = ref<MerchantCredentialResult>({});
  // 原始脱敏数据，用于 diffForm 比对
  const originalForm = ref<MerchantCredentialResult>({});
  // RSA 密钥对弹窗
  const keyPairVisible = ref(false);
  const privateKeyContent = ref('');

  /**
   * 加载当前商户信息并取 mchNo
   */
  async function loadMerchantInfo() {
    const { data } = await MerchantApi.get();
    merchantInfo.value = data || {};
    mchNo.value = data?.mchNo || '';
  }

  /**
   * 加载对接配置（findByMchNo 需要 mchNo）
   */
  async function loadConfig() {
    if (!mchNo.value) return;
    loading.value = true;
    const { data } = await MerchantCredentialApi.findByMchNo(mchNo.value);
    formState.value = data || {};
    originalForm.value = { ...data };
    loading.value = false;
  }

  /**
   * 进入编辑模式
   */
  function handleEdit() {
    isEditing.value = true;
  }

  /**
   * 取消编辑
   */
  function handleCancel() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        await loadConfig();
        isEditing.value = false;
      },
    });
  }

  /**
   * 生成 RSA 密钥对
   */
  async function handleGenRsaKeyPair() {
    // 如果公钥已存在，需要二次确认
    if (formState.value.publicKey) {
      confirm({
        title: $t('common.confirm'),
        content: $t('payment.merchant.credential.credential.confirmGenPublicKey'),
        okText: $t('common.okText'),
        cancelText: $t('common.cancelText'),
        onOk: async () => {
          await doGenRsaKeyPair();
        },
      });
    } else {
      await doGenRsaKeyPair();
    }
  }

  /**
   * 执行生成 RSA 密钥对
   */
  async function doGenRsaKeyPair() {
    const { data } = await KeyGenApi.genRsaKeyPair();
    if (data) {
      // 公钥填入表单
      formState.value.publicKey = data.publicKey;
      // 私钥弹窗展示
      privateKeyContent.value = data.privateKey!;
      keyPairVisible.value = true;
    }
  }

  /**
   * 生成 AES 通信密钥
   */
  async function handleGenAesSecretKey() {
    // 如果密钥已存在，需要二次确认
    if (formState.value.secretKey) {
      confirm({
        title: $t('common.confirm'),
        content: $t('payment.merchant.credential.credential.confirmGenSecretKey'),
        okText: $t('common.okText'),
        cancelText: $t('common.cancelText'),
        onOk: async () => {
          await doGenAesSecretKey();
        },
      });
    } else {
      await doGenAesSecretKey();
    }
  }

  /**
   * 执行生成 AES 通信密钥
   */
  async function doGenAesSecretKey() {
    const { data } = await KeyGenApi.genAesSecretKey();
    if (data) {
      formState.value.secretKey = data;
    }
  }

  /**
   * 复制到剪贴板
   */
  function handleCopy(text: string) {
    copy(text);
    message.success($t('payment.merchant.credential.credential.copySuccess'));
  }

  /**
   * 保存配置
   */
  function handleSave() {
    confirm({
      title: $t('common.confirm'),
      content: $t('payment.merchant.credential.credential.confirmSave'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        saving.value = true;
        // 使用 diffForm 处理敏感字段，未修改的字段返回 undefined（公钥可公开，仅通信密钥需脱敏防回写）
        const sensitiveData = diffForm(originalForm, formState, 'secretKey');
        const submitData: MerchantCredentialParam = {
          ...formState.value,
          ...sensitiveData,
          mchNo: mchNo.value,
        };
        await MerchantCredentialApi.update(submitData);
        message.success($t('payment.merchant.credential.credential.saveSuccess'));
        saving.value = false;
        isEditing.value = false;
        // 重新加载配置
        await loadConfig();
      },
    });
  }

  onMounted(async () => {
    await loadMerchantInfo();
    if (!mchNo.value) {
      message.error($t('common.loadFailed'));
      return;
    }
    await loadConfig();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <!-- 对接配置（与菜单 menu.payment.merchant.credential 一致） -->
          <span class="text-lg font-bold text-foreground">{{ $t('menu.payment.merchant.credential') }}</span>
          <span v-if="merchantInfo.mchName" class="text-sm text-muted-foreground">({{ merchantInfo.mchName }})</span>
        </div>
      </template>

      <template #extra>
        <template v-if="!isEditing">
          <a-button v-if="hasPermission(PermCodes.Merchant.Credential.MANAGE)" type="primary" @click="handleEdit">{{
            $t('common.edit')
          }}</a-button>
        </template>
        <template v-else>
          <a-space>
            <a-button @click="handleCancel">{{ $t('common.cancelText') }}</a-button>
            <a-button
              v-if="hasPermission(PermCodes.Merchant.Credential.MANAGE)"
              type="primary"
              :loading="saving"
              @click="handleSave"
            >
              {{ $t('common.save') }}
            </a-button>
          </a-space>
        </template>
      </template>

      <a-spin :spinning="loading">
        <div class="credential-form-container max-w-4xl px-4 py-2">
          <!-- 信息提示 -->
          <div class="info-banner">
            <IconifyIcon icon="ant-design:info-circle-filled" />
            <!-- 商户 API 配置用于接口调用时的身份验证与数据加解密，请妥善保管密钥信息 -->
            <span>{{ $t('payment.merchant.credential.credential.infoBanner') }}</span>
          </div>

          <a-form layout="vertical" class="module-form">
            <!-- 平台公钥（只读） -->
            <a-form-item
              :label="$t('payment.merchant.credential.credential.platformPublicKey')"
              :tooltip="$t('payment.merchant.credential.credential.platformPublicKeyTooltip')"
            >
              <div class="textarea-wrapper">
                <a-textarea
                  :value="formState.platformPublicKey"
                  :placeholder="$t('payment.merchant.credential.credential.platformPublicKeyPlaceholder')"
                  :rows="6"
                  readonly
                  class="readonly-textarea"
                />
                <div class="textarea-actions">
                  <a-button type="link" size="small" @click="handleCopy(formState.platformPublicKey || '')">
                    <template #icon>
                      <IconifyIcon icon="ant-design:copy-outlined" />
                    </template>
                    <!-- 复制 -->
                    {{ $t('payment.merchant.credential.credential.copy') }}
                  </a-button>
                </div>
              </div>
            </a-form-item>

            <!-- 商户公钥 -->
            <a-form-item
              :label="$t('payment.merchant.credential.credential.publicKey')"
              :tooltip="$t('payment.merchant.credential.credential.publicKeyTooltip')"
            >
              <div class="textarea-wrapper">
                <a-textarea
                  v-model:value="formState.publicKey"
                  :placeholder="$t('payment.merchant.credential.credential.publicKeyPlaceholder')"
                  :rows="6"
                  :disabled="!isEditing"
                  allow-clear
                />
                <div class="textarea-actions">
                  <a-button type="link" size="small" :disabled="!isEditing" @click="handleGenRsaKeyPair">
                    <template #icon>
                      <IconifyIcon icon="ant-design:key-outlined" />
                    </template>
                    <!-- 生成密钥对 -->
                    {{ $t('payment.merchant.credential.credential.genRsaKeyPair') }}
                  </a-button>
                </div>
              </div>
            </a-form-item>

            <!-- 通信密钥 -->
            <a-form-item
              :label="$t('payment.merchant.credential.credential.secretKey')"
              :tooltip="$t('payment.merchant.credential.credential.secretKeyTooltip')"
            >
              <div class="flex gap-2">
                <a-input
                  v-model:value="formState.secretKey"
                  :placeholder="$t('payment.merchant.credential.credential.secretKeyPlaceholder')"
                  :disabled="!isEditing"
                  class="flex-1"
                  allow-clear
                />
                <a-button type="primary" ghost :disabled="!isEditing" @click="handleGenAesSecretKey">
                  <!-- 生成密钥 -->
                  {{ $t('payment.merchant.credential.credential.genAesSecretKey') }}
                </a-button>
              </div>
            </a-form-item>
          </a-form>
        </div>
      </a-spin>
    </a-card>

    <!-- RSA 密钥对弹窗 -->
    <a-modal
      v-model:open="keyPairVisible"
      :title="$t('payment.merchant.credential.credential.genKeyPairTitle')"
      :footer="null"
      width="640px"
      :mask-closable="false"
    >
      <div class="space-y-4">
        <div class="info-banner warning">
          <IconifyIcon icon="ant-design:warning-filled" />
          <!-- 私钥仅在此处展示一次，请务必妥善保管，丢失无法找回 -->
          <span>{{ $t('payment.merchant.credential.credential.privateKeyWarning') }}</span>
        </div>
        <div>
          <div class="mb-2 flex items-center justify-between">
            <!-- 私钥 -->
            <span class="font-medium text-foreground">{{ $t('payment.merchant.credential.credential.privateKey') }}</span>
            <a-button size="small" type="primary" ghost @click="handleCopy(privateKeyContent)">
              <template #icon>
                <IconifyIcon icon="ant-design:copy-outlined" />
              </template>
              <!-- 复制 -->
              {{ $t('payment.merchant.credential.credential.copy') }}
            </a-button>
          </div>
          <div class="textarea-wrapper">
            <a-textarea :value="privateKeyContent" :rows="10" readonly class="readonly-textarea font-mono" />
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
  .credential-form-container {
    margin: 0 auto;
  }

  .module-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background-color: hsl(var(--primary) / 5%);
    border: 1px solid hsl(var(--primary) / 20%);
    border-radius: 8px;
    margin-bottom: 24px;
    color: hsl(var(--foreground));
    font-size: 13px;

    :deep(.iconify) {
      color: hsl(var(--primary));
      font-size: 18px;
    }

    &.warning {
      background-color: hsl(var(--warning) / 5%);
      border-color: hsl(var(--warning) / 20%);
      :deep(.iconify) {
        color: hsl(var(--warning));
      }
    }
  }

  .textarea-wrapper {
    position: relative;
    border: 1px solid hsl(var(--border));
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.3s;
    background: hsl(var(--card));

    &:hover {
      border-color: hsl(var(--primary) / 50%);
    }

    &:focus-within {
      border-color: hsl(var(--primary));
      box-shadow: 0 0 0 2px hsl(var(--primary) / 20%);
    }

    :deep(.ant-input) {
      border: none;
      box-shadow: none;
      padding: 12px;
      font-size: 13px;
      resize: none;
      background: transparent;
      color: hsl(var(--foreground));

      &:focus {
        box-shadow: none;
      }

      &::placeholder {
        color: hsl(var(--muted-foreground));
      }
    }

    .readonly-textarea {
      background-color: hsl(var(--muted) / 50%);
      cursor: default;

      :deep(.ant-input) {
        cursor: default;
      }
    }

    .textarea-actions {
      background: hsl(var(--muted) / 30%);
      padding: 6px 12px;
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid hsl(var(--border));
    }
  }

  :deep(.ant-form-item) {
    margin-bottom: 24px;

    .ant-form-item-label {
      padding-bottom: 8px;

      label {
        font-weight: 600;
        color: hsl(var(--foreground));
      }
    }
  }

  :deep(.ant-input-disabled) {
    background-color: hsl(var(--muted) / 30%);
    color: hsl(var(--muted-foreground));
    cursor: not-allowed;

    &:hover {
      border-color: hsl(var(--border));
    }
  }

  :deep(.ant-btn-disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .font-mono {
    font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  }
</style>
