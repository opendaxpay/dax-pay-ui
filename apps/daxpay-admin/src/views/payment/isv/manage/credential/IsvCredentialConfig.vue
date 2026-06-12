<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useClipboard } from '@vueuse/core';

  import {
    IsvCredentialConfigApi,
    type IsvCredentialConfigParam,
    type IsvCredentialConfigResult,
    IsvInfoApi,
  } from '#/api/payment/isv.api';
  import { KeyGenApi } from '#/api/payment/keyGen.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'IsvCredentialConfig' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['isvNo'],
    messageKey: 'payment.common.route.missingIsvNo',
    fallbackPath: '/payment/isv',
  });
  const { diffForm } = useFormEdit();
  const { copy } = useClipboard();
  const { confirm, message } = useMessage();

  const loading = ref(false);
  const saving = ref(false);
  // 编辑模式
  const isEditing = ref(false);
  const isvNo = computed(() => routeContext.query.value.isvNo);
  const isvName = ref('');
  // 表单数据
  const formState = ref<IsvCredentialConfigResult>({});
  // 原始脱敏数据，用于 diffForm 比对
  const originalForm = ref<IsvCredentialConfigResult>({});
  // RSA密钥对弹窗
  const keyPairVisible = ref(false);
  const privateKeyContent = ref('');

  /**
   * 加载服务商信息
   */
  async function loadIsvInfo() {
    if (!isvNo.value) return;
    const { data } = await IsvInfoApi.findByIsvNo(isvNo.value);
    isvName.value = data?.name || '';
  }

  /**
   * 加载对接配置
   */
  async function loadConfig() {
    if (!isvNo.value) return;
    loading.value = true;
    const { data } = await IsvCredentialConfigApi.findByIsvNo(isvNo.value);
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
   * 生成RSA密钥对
   */
  async function handleGenRsaKeyPair() {
    // 如果公钥已存在，需要二次确认
    if (formState.value.publicKey) {
      confirm({
        // 国际化：确认
        title: $t('common.confirm'),
        // 国际化：公钥已存在，重新生成将覆盖原有公钥，确定要重新生成吗？
        content: $t('payment.isv.credential.credential.confirmGenPublicKey'),
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
   * 执行生成RSA密钥对
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
   * 生成AES通信密钥
   */
  async function handleGenAesSecretKey() {
    // 如果密钥已存在，需要二次确认
    if (formState.value.secretKey) {
      confirm({
        // 国际化：确认
        title: $t('common.confirm'),
        // 国际化：通信密钥已存在，重新生成将覆盖原有密钥，确定要重新生成吗？
        content: $t('payment.isv.credential.credential.confirmGenSecretKey'),
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
   * 执行生成AES通信密钥
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
    // 国际化：复制成功
    message.success($t('payment.isv.credential.credential.copySuccess'));
  }

  /**
   * 保存配置
   */
  function handleSave() {
    confirm({
      title: $t('common.confirm'),
      // 国际化：确定要保存对接配置吗？
      content: $t('payment.isv.credential.credential.confirmSave'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        saving.value = true;
        // 使用 diffForm 处理敏感字段，未修改的字段返回 undefined
        const sensitiveData = diffForm(originalForm, formState, 'publicKey', 'secretKey');
        const submitData: IsvCredentialConfigParam = {
          ...formState.value,
          ...sensitiveData,
          isvNo: isvNo.value,
        };
        await IsvCredentialConfigApi.update(submitData);
        // 国际化：保存成功
        message.success($t('payment.isv.credential.credential.saveSuccess'));
        saving.value = false;
        isEditing.value = false;
        // 重新加载配置
        await loadConfig();
      },
    });
  }

  /**
   * 返回工作台
   */
  function handleBack() {
    router.push({
      path: '/payment/isv/manage',
      query: { isvNo: isvNo.value },
    });
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    loadIsvInfo();
    loadConfig();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingIsvNo')"
    :back-text="$t('payment.isv.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <a-button
            type="text"
            class="flex items-center justify-center rounded-full hover:bg-accent"
            @click="handleBack"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
            </template>
          </a-button>
          <!-- 国际化：对接配置 -->
          <span class="text-lg font-bold text-foreground">{{ $t('payment.isv.credential.credential.title') }}</span>
          <span v-if="isvName" class="text-sm text-muted-foreground">({{ isvName }})</span>
        </div>
      </template>

      <template #extra>
        <template v-if="!isEditing">
          <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
        </template>
        <template v-else>
          <a-space>
            <a-button @click="handleCancel">{{ $t('common.cancelText') }}</a-button>
            <a-button type="primary" :loading="saving" @click="handleSave">
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
            <!-- 国际化：服务商 API 配置用于接口调用时的身份验证与数据加解密，请妥善保管密钥信息 -->
            <span>{{ $t('payment.isv.credential.credential.infoBanner') }}</span>
          </div>

          <a-form layout="vertical" class="module-form">
            <!-- 平台公钥（只读） -->
            <!-- 国际化：平台公钥 -->
            <a-form-item
              :label="$t('payment.isv.credential.credential.platformPublicKey')"
              :tooltip="$t('payment.isv.credential.credential.platformPublicKeyTooltip')"
            >
              <div class="textarea-wrapper">
                <a-textarea
                  :value="formState.platformPublicKey"
                  :placeholder="$t('payment.isv.credential.credential.platformPublicKeyPlaceholder')"
                  :rows="6"
                  readonly
                  class="readonly-textarea"
                />
                <div class="textarea-actions">
                  <a-button type="link" size="small" @click="handleCopy(formState.platformPublicKey || '')">
                    <template #icon>
                      <IconifyIcon icon="ant-design:copy-outlined" />
                    </template>
                    <!-- 国际化：复制 -->
                    {{ $t('payment.isv.credential.credential.copy') }}
                  </a-button>
                </div>
              </div>
            </a-form-item>

            <!-- 服务商公钥 -->
            <!-- 国际化：服务商公钥 -->
            <a-form-item
              :label="$t('payment.isv.credential.credential.publicKey')"
              :tooltip="$t('payment.isv.credential.credential.publicKeyTooltip')"
            >
              <div class="textarea-wrapper">
                <a-textarea
                  v-model:value="formState.publicKey"
                  :placeholder="$t('payment.isv.credential.credential.publicKeyPlaceholder')"
                  :rows="6"
                  :disabled="!isEditing"
                  allow-clear
                />
                <div class="textarea-actions">
                  <a-button type="link" size="small" :disabled="!isEditing" @click="handleGenRsaKeyPair">
                    <template #icon>
                      <IconifyIcon icon="ant-design:key-outlined" />
                    </template>
                    <!-- 国际化：生成密钥对 -->
                    {{ $t('payment.isv.credential.credential.genRsaKeyPair') }}
                  </a-button>
                </div>
              </div>
            </a-form-item>

            <!-- 通信密钥 -->
            <!-- 国际化：通信密钥 -->
            <a-form-item
              :label="$t('payment.isv.credential.credential.secretKey')"
              :tooltip="$t('payment.isv.credential.credential.secretKeyTooltip')"
            >
              <div class="flex gap-2">
                <a-input
                  v-model:value="formState.secretKey"
                  :placeholder="$t('payment.isv.credential.credential.secretKeyPlaceholder')"
                  :disabled="!isEditing"
                  class="flex-1"
                  allow-clear
                />
                <a-button type="primary" ghost :disabled="!isEditing" @click="handleGenAesSecretKey">
                  <!-- 国际化：生成密钥 -->
                  {{ $t('payment.isv.credential.credential.genAesSecretKey') }}
                </a-button>
              </div>
            </a-form-item>
          </a-form>
        </div>
      </a-spin>
    </a-card>

    <!-- RSA密钥对弹窗 -->
    <!-- 国际化：RSA密钥对 -->
    <a-modal
      v-model:open="keyPairVisible"
      :title="$t('payment.isv.credential.credential.genKeyPairTitle')"
      :footer="null"
      width="640px"
      :mask-closable="false"
    >
      <div class="space-y-4">
        <div class="info-banner warning">
          <IconifyIcon icon="ant-design:warning-filled" />
          <!-- 国际化：私钥仅在此处展示一次，请务必妥善保管，丢失无法找回 -->
          <span>{{ $t('payment.isv.credential.credential.privateKeyWarning') }}</span>
        </div>
        <div>
          <div class="mb-2 flex items-center justify-between">
            <!-- 国际化：私钥 -->
            <span class="font-medium text-foreground">{{ $t('payment.isv.credential.credential.privateKey') }}</span>
            <a-button size="small" type="primary" ghost @click="handleCopy(privateKeyContent)">
              <template #icon>
                <IconifyIcon icon="ant-design:copy-outlined" />
              </template>
              <!-- 国际化：复制 -->
              {{ $t('payment.isv.credential.credential.copy') }}
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
