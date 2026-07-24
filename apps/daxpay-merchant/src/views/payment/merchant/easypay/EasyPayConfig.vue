<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useClipboard } from '@vueuse/core';

  import {
    EasyPayCredentialApi,
    type EasyPayCredentialParam,
    type EasyPayCredentialResult,
  } from '#/api/payment/merchant/easypay-credential.api';
  import { KeyGenApi } from '#/api/payment/merchant/key-gen.api';
  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'EasyPayConfig' });
  const { copy } = useClipboard();
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();
  const { diffForm } = useFormEdit();

  const router = useRouter();

  // 商户端无 mchNo URL 维度，仅校验 appId
  const routeContext = useRequiredRouteQuery({
    keys: ['appId'],
    messageKey: 'payment.common.route.missingAppContext',
    fallbackPath: '/mch/app',
  });

  const appId = computed(() => routeContext.query.value.appId);

  const canManage = computed(() => hasPermission(PermCodes.Merchant.EasyPay.MANAGE));

  const loading = ref(false);
  const saving = ref(false);
  // 编辑模式
  const isEditing = ref(false);
  const appInfo = ref<MchAppInfoResult>({});
  const appName = computed(() => appInfo.value.appName || '');
  const form = reactive<EasyPayCredentialResult>({
    enable: false,
    enableV1: false,
    enableV2: true,
    useSystemKey: true,
  });
  // 原始脱敏数据，用于 diffForm 比对
  const originalForm = ref<EasyPayCredentialResult>({});
  // RSA 密钥对弹窗
  const keyPairVisible = ref(false);
  const privateKeyContent = ref('');

  /**
   * 公钥规范化：去掉 PEM 头尾与空白，得到可直接复制的纯 Base64
   */
  function normalizePublicKey(pem?: string) {
    if (!pem) {
      return pem;
    }
    return pem
      .replaceAll('-----BEGIN PUBLIC KEY-----', '')
      .replaceAll('-----END PUBLIC KEY-----', '')
      .replaceAll(/\s+/g, '');
  }

  /**
   * 私钥规范化：去掉 PEM 头尾与空白，得到可直接复制的纯 Base64（易支付要求）
   */
  function normalizePrivateKey(pem?: string) {
    if (!pem) {
      return pem;
    }
    return pem
      .replaceAll('-----BEGIN PRIVATE KEY-----', '')
      .replaceAll('-----END PRIVATE KEY-----', '')
      .replaceAll('-----BEGIN RSA PRIVATE KEY-----', '')
      .replaceAll('-----END RSA PRIVATE KEY-----', '')
      .replaceAll(/\s+/g, '');
  }

  /**
   * 重置表单默认值后合并服务端数据
   */
  function applyCredential(data?: EasyPayCredentialResult | null) {
    Object.assign(
      form,
      {
        id: undefined,
        pid: undefined,
        appId: appId.value,
        enable: false,
        enableV1: false,
        enableV2: true,
        useSystemKey: true,
        md5Key: undefined,
        publicKey: undefined,
        platformPublicKey: undefined,
        easyPayV1ApiUrl: undefined,
        easyPayV2ApiUrl: undefined,
      },
      data || {},
    );
    // 展示/复制用纯 Base64（与商业版、后端 Result 一致；前端再兜底一次）
    form.platformPublicKey = normalizePublicKey(form.platformPublicKey);
    originalForm.value = { ...form };
  }

  /**
   * 加载应用信息（页头展示名）
   */
  /** 加载当前应用信息 */
  async function loadAppInfo() {
    if (!appId.value) return;
    const { data } = await MchAppInfoApi.getByAppId(appId.value);
    appInfo.value = data || {};
  }

  /** 返回应用工作台 */
  function handleBack() {
    router.push({ path: '/mch/app/manage', query: { appId: appId.value } });
  }

  /**
   * 加载易支付凭证
   */
  async function loadCredential() {
    if (!appId.value) {
      return;
    }
    loading.value = true;
    try {
      const { data } = await EasyPayCredentialApi.getByAppId(appId.value);
      applyCredential(data);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 返回应用工作台
   */
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
        await loadCredential();
        isEditing.value = false;
      },
    });
  }

  /**
   * 复制文本
   */
  function handleCopy(text?: null | number | string) {
    if (text === undefined || text === null || text === '') {
      return;
    }
    copy(String(text));
    message.success($t('common.operationSuccess'));
  }

  /**
   * 生成 RSA 密钥对（公钥已存在时二次确认）
   */
  async function handleGenRsaKeyPair() {
    if (form.publicKey) {
      confirm({
        title: $t('common.confirm'),
        content: $t('payment.merchant.app.easypay.confirmGenPublicKey'),
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
   * 执行生成 RSA 密钥对：公钥去 PEM 头尾后填入表单，私钥弹窗展示
   */
  async function doGenRsaKeyPair() {
    const { data } = await KeyGenApi.genRsaKeyPair();
    if (data) {
      // 公钥去注释与换行（纯 Base64 存储），前端处理
      form.publicKey = normalizePublicKey(data.publicKey);
      // 私钥同样去 PEM 头尾与换行（易支付要求纯 Base64），弹窗展示
      privateKeyContent.value = normalizePrivateKey(data.privateKey) ?? '';
      keyPairVisible.value = true;
    }
  }

  /**
   * 保存配置
   */
  function handleSave() {
    if (!form.appId || !canManage.value) {
      return;
    }
    confirm({
      title: $t('common.confirm'),
      content: $t('payment.merchant.app.easypay.confirmSave'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        saving.value = true;
        try {
          // 商户公钥去 PEM 头尾与换行（纯 Base64 存储），保存时兜底处理
          if (form.publicKey) {
            form.publicKey = normalizePublicKey(form.publicKey);
          }
          // 敏感字段未修改时不提交
          const sensitiveData = diffForm(originalForm.value, form, 'md5Key', 'publicKey');
          const submitData: EasyPayCredentialParam = {
            id: form.id || undefined,
            appId: form.appId || appId.value,
            enable: form.enable,
            enableV1: form.enableV1,
            enableV2: form.enableV2,
            useSystemKey: form.useSystemKey,
            ...sensitiveData,
          };
          await EasyPayCredentialApi.update(submitData);
          message.success($t('common.operationSuccess'));
          isEditing.value = false;
          await loadCredential();
        } finally {
          saving.value = false;
        }
      },
    });
  }

  async function bootstrap() {
    isEditing.value = false;
    await loadAppInfo();
    await loadCredential();
  }

  onMounted(async () => {
    if (!routeContext.isValid.value) return;
    await bootstrap();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingAppContext')"
    :back-text="$t('payment.merchant.app.app.backToAppList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <a-button type="text" @click="handleBack">
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" />
            </template>
          </a-button>
          <!-- 页头与菜单 i18n_key 一致 -->
          <span class="text-lg font-bold text-foreground">
            {{ $t('menu.payment.merchant.easypay') }}
          </span>
          <span v-if="appName" class="text-sm text-muted-foreground"> ({{ appName }}) </span>
        </div>
      </template>

      <template #extra>
        <template v-if="canManage">
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
      </template>

      <a-spin :spinning="loading">
        <div class="easypay-form-container max-w-6xl px-4 py-2">
          <!-- 信息提示 -->
          <div class="info-banner">
            <IconifyIcon icon="ant-design:info-circle-filled" />
            <span>{{ $t('payment.merchant.app.easypay.desc') }}</span>
          </div>
          <div class="info-banner warning">
            <IconifyIcon icon="ant-design:warning-filled" />
            <span>{{ $t('payment.merchant.app.easypay.notifyHint') }}</span>
          </div>

          <a-form layout="vertical" class="module-form">
            <!-- ① 基础对接 -->
            <div class="config-section">
              <div class="config-section__title">
                {{ $t('payment.merchant.app.easypay.section.endpoint') }}
              </div>
              <div class="config-grid">
                <!-- 总开关：半列 -->
                <div class="config-item config-item--block">
                  <div class="config-item__main">
                    <div class="config-item__label">
                      {{ $t('payment.merchant.app.easypay.enable') }}
                    </div>
                    <div class="config-item__desc">
                      {{ $t('payment.merchant.app.easypay.enableDesc') }}
                    </div>
                  </div>
                  <a-radio-group v-model:value="form.enable" button-style="solid" :disabled="!isEditing">
                    <a-radio-button :value="true">{{ $t('common.enable') }}</a-radio-button>
                    <a-radio-button :value="false">{{ $t('common.disable') }}</a-radio-button>
                  </a-radio-group>
                </div>

                <!-- pid：半列 -->
                <div class="config-item config-item--block">
                  <div class="config-item__main">
                    <div class="config-item__label">
                      {{ $t('payment.merchant.app.easypay.pid') }}
                    </div>
                    <div class="config-item__desc">
                      {{ $t('payment.merchant.app.easypay.pidDesc') }}
                    </div>
                  </div>
                  <div class="readonly-field">
                    <a-input :value="form.pid" disabled class="font-mono text-sm" />
                    <a-button type="link" size="small" @click="handleCopy(form.pid)">
                      <template #icon>
                        <IconifyIcon icon="ant-design:copy-outlined" />
                      </template>
                      {{ $t('common.copy') }}
                    </a-button>
                  </div>
                </div>

                <!-- V2 URL：整行 -->
                <div class="config-item config-item--block config-item--full">
                  <div class="config-item__main">
                    <div class="config-item__label">
                      {{ $t('payment.merchant.app.easypay.v2Url') }}
                    </div>
                    <div class="config-item__desc">
                      {{ $t('payment.merchant.app.easypay.v2UrlDesc') }}
                    </div>
                  </div>
                  <div class="readonly-field">
                    <a-input :value="form.easyPayV2ApiUrl" disabled class="font-mono text-sm" />
                    <a-button type="link" size="small" @click="handleCopy(form.easyPayV2ApiUrl)">
                      <template #icon>
                        <IconifyIcon icon="ant-design:copy-outlined" />
                      </template>
                      {{ $t('common.copy') }}
                    </a-button>
                  </div>
                </div>

                <!-- V1 URL：整行 -->
                <div class="config-item config-item--block config-item--full">
                  <div class="config-item__main">
                    <div class="config-item__label">
                      {{ $t('payment.merchant.app.easypay.v1Url') }}
                    </div>
                    <div class="config-item__desc">
                      {{ $t('payment.merchant.app.easypay.v1UrlDesc') }}
                    </div>
                  </div>
                  <div class="readonly-field">
                    <a-input :value="form.easyPayV1ApiUrl" disabled class="font-mono text-sm" />
                    <a-button type="link" size="small" @click="handleCopy(form.easyPayV1ApiUrl)">
                      <template #icon>
                        <IconifyIcon icon="ant-design:copy-outlined" />
                      </template>
                      {{ $t('common.copy') }}
                    </a-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- ② V1 协议配置 -->
            <div class="config-section">
              <div class="config-section__title">
                {{ $t('payment.merchant.app.easypay.section.v1') }}
              </div>
              <div class="config-grid">
                <!-- 开启 V1：半列 -->
                <div class="config-item config-item--block">
                  <div class="config-item__main">
                    <div class="config-item__label">
                      {{ $t('payment.merchant.app.easypay.enableV1') }}
                    </div>
                    <div class="config-item__desc">
                      {{ $t('payment.merchant.app.easypay.enableV1Desc') }}
                    </div>
                  </div>
                  <a-radio-group v-model:value="form.enableV1" button-style="solid" :disabled="!isEditing">
                    <a-radio-button :value="true">{{ $t('common.enable') }}</a-radio-button>
                    <a-radio-button :value="false">{{ $t('common.disable') }}</a-radio-button>
                  </a-radio-group>
                </div>

                <!-- MD5：半列，仅 V1 开启时显示 -->
                <div v-if="form.enableV1" class="config-item config-item--block">
                  <div class="config-item__main">
                    <div class="config-item__label">
                      {{ $t('payment.merchant.app.easypay.md5Key') }}
                    </div>
                    <div class="config-item__desc">
                      {{ $t('payment.merchant.app.easypay.md5KeyDesc') }}
                    </div>
                  </div>
                  <a-input
                    v-model:value="form.md5Key"
                    :disabled="!isEditing"
                    :placeholder="$t('payment.merchant.app.easypay.md5KeyPh')"
                    allow-clear
                  />
                </div>
              </div>
            </div>

            <!-- ③ V2 协议配置 -->
            <div class="config-section">
              <div class="config-section__title">
                {{ $t('payment.merchant.app.easypay.section.v2') }}
              </div>
              <div class="config-grid">
                <!-- 开启 V2：半列 -->
                <div class="config-item config-item--block">
                  <div class="config-item__main">
                    <div class="config-item__label">
                      {{ $t('payment.merchant.app.easypay.enableV2') }}
                    </div>
                    <div class="config-item__desc">
                      {{ $t('payment.merchant.app.easypay.enableV2Desc') }}
                    </div>
                  </div>
                  <a-radio-group v-model:value="form.enableV2" button-style="solid" :disabled="!isEditing">
                    <a-radio-button :value="true">{{ $t('common.enable') }}</a-radio-button>
                    <a-radio-button :value="false">{{ $t('common.disable') }}</a-radio-button>
                  </a-radio-group>
                </div>

                <!-- 使用系统密钥：半列，仅 V2 开启时显示 -->
                <div v-if="form.enableV2" class="config-item config-item--block">
                  <div class="config-item__main">
                    <div class="config-item__label">
                      {{ $t('payment.merchant.app.easypay.useSystemKey') }}
                    </div>
                    <div class="config-item__desc">
                      {{ $t('payment.merchant.app.easypay.useSystemKeyDesc') }}
                    </div>
                  </div>
                  <a-radio-group v-model:value="form.useSystemKey" button-style="solid" :disabled="!isEditing">
                    <a-radio-button :value="true">{{ $t('common.yes') }}</a-radio-button>
                    <a-radio-button :value="false">{{ $t('common.no') }}</a-radio-button>
                  </a-radio-group>
                </div>

                <!-- 平台公钥：整行，仅 V2 开启 -->
                <div v-if="form.enableV2" class="config-item config-item--block config-item--full">
                  <div class="config-item__main">
                    <div class="config-item__label">
                      {{ $t('payment.merchant.app.easypay.platformPublicKey') }}
                    </div>
                    <div class="config-item__desc">
                      {{ $t('payment.merchant.app.easypay.platformPublicKeyDesc') }}
                    </div>
                  </div>
                  <div class="textarea-wrapper">
                    <a-textarea
                      :value="form.platformPublicKey"
                      :rows="4"
                      readonly
                      class="readonly-textarea font-mono text-sm"
                    />
                    <div class="textarea-actions">
                      <a-button type="link" size="small" @click="handleCopy(form.platformPublicKey)">
                        <template #icon>
                          <IconifyIcon icon="ant-design:copy-outlined" />
                        </template>
                        {{ $t('common.copy') }}
                      </a-button>
                    </div>
                  </div>
                </div>

                <!-- 商户公钥：整行，V2 开启且不使用系统密钥 -->
                <div
                  v-if="form.enableV2 && !form.useSystemKey"
                  class="config-item config-item--block config-item--full"
                >
                  <div class="config-item__main">
                    <div class="config-item__label">
                      {{ $t('payment.merchant.app.easypay.publicKey') }}
                    </div>
                    <div class="config-item__desc">
                      {{ $t('payment.merchant.app.easypay.publicKeyDesc') }}
                    </div>
                  </div>
                  <div class="textarea-wrapper">
                    <a-textarea
                      v-model:value="form.publicKey"
                      :rows="4"
                      :disabled="!isEditing"
                      allow-clear
                      class="font-mono text-sm"
                    />
                    <div class="textarea-actions">
                      <a-button type="link" size="small" :disabled="!isEditing" @click="handleGenRsaKeyPair">
                        <template #icon>
                          <IconifyIcon icon="ant-design:key-outlined" />
                        </template>
                        {{ $t('payment.merchant.app.easypay.genRsaKeyPair') }}
                      </a-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a-form>
        </div>
      </a-spin>
    </a-card>

    <!-- RSA 密钥对弹窗 -->
    <a-modal
      v-model:open="keyPairVisible"
      :title="$t('payment.merchant.app.easypay.genKeyPairTitle')"
      :footer="null"
      width="640px"
      :mask-closable="false"
    >
      <div class="space-y-4">
        <div class="info-banner warning">
          <IconifyIcon icon="ant-design:warning-filled" />
          <span>{{ $t('payment.merchant.app.easypay.privateKeyWarning') }}</span>
        </div>
        <div>
          <div class="mb-2 flex items-center justify-between">
            <span class="font-medium text-foreground">
              {{ $t('payment.merchant.app.easypay.privateKey') }}
            </span>
            <a-button size="small" type="primary" ghost @click="handleCopy(privateKeyContent)">
              <template #icon>
                <IconifyIcon icon="ant-design:copy-outlined" />
              </template>
              {{ $t('common.copy') }}
            </a-button>
          </div>
          <div class="textarea-wrapper">
            <a-textarea :value="privateKeyContent" :rows="10" readonly class="readonly-textarea font-mono text-sm" />
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
  .easypay-form-container {
    margin: 0 auto;
  }

  .module-form {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .info-banner {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 16px;
    margin-bottom: 12px;
    font-size: 13px;
    line-height: 1.6;
    color: hsl(var(--foreground));
    background-color: hsl(var(--primary) / 5%);
    border: 1px solid hsl(var(--primary) / 20%);
    border-radius: 8px;

    :deep(.iconify) {
      flex-shrink: 0;
      margin-top: 2px;
      font-size: 18px;
      color: hsl(var(--primary));
    }

    &.warning {
      margin-bottom: 24px;
      background-color: hsl(var(--warning) / 5%);
      border-color: hsl(var(--warning) / 20%);

      :deep(.iconify) {
        color: hsl(var(--warning));
      }
    }
  }

  .config-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .config-section__title {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  /* 两列栅格：默认半列，整行用 --full */
  .config-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .config-item {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 14px 16px;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 12px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: hsl(var(--primary) / 30%);
      box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
    }
  }

  .config-item--block {
    flex-direction: column;
    align-items: stretch;
  }

  .config-item--full {
    grid-column: 1 / -1;
  }

  .config-item__main {
    flex: 1;
    min-width: 0;
  }

  .config-item__label {
    font-size: 14px;
    font-weight: 500;
    color: hsl(var(--foreground));
  }

  .config-item__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .readonly-field {
    display: flex;
    gap: 4px;
    align-items: center;
    width: 100%;
    margin-top: 10px;

    :deep(.ant-input) {
      flex: 1;
    }
  }

  .config-item--block > .ant-radio-group {
    margin-top: 10px;
  }

  .config-item--block > .ant-input,
  .config-item--block > .ant-input-affix-wrapper {
    margin-top: 10px;
  }

  .textarea-wrapper {
    position: relative;
    width: 100%;
    margin-top: 10px;
    overflow: hidden;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 6px;
    transition: all 0.3s;

    &:hover {
      border-color: hsl(var(--primary) / 50%);
    }

    &:focus-within {
      border-color: hsl(var(--primary));
      box-shadow: 0 0 0 2px hsl(var(--primary) / 20%);
    }

    :deep(.ant-input) {
      padding: 12px;
      font-size: 13px;
      color: hsl(var(--foreground));
      resize: none;
      background: transparent;
      border: none;
      box-shadow: none;

      &:focus {
        box-shadow: none;
      }

      &::placeholder {
        color: hsl(var(--muted-foreground));
      }
    }

    .readonly-textarea {
      cursor: default;
      background-color: hsl(var(--muted) / 50%);

      :deep(.ant-input) {
        cursor: default;
      }
    }

    .textarea-actions {
      display: flex;
      justify-content: flex-end;
      padding: 6px 12px;
      background: hsl(var(--muted) / 30%);
      border-top: 1px solid hsl(var(--border));
    }
  }

  :deep(.ant-input-disabled),
  :deep(.ant-input[disabled]) {
    color: hsl(var(--muted-foreground));
    cursor: not-allowed;
    background-color: hsl(var(--muted) / 30%);

    &:hover {
      border-color: hsl(var(--border));
    }
  }

  @media (max-width: 768px) {
    .config-grid {
      grid-template-columns: 1fr;
    }

    .config-item--full {
      grid-column: auto;
    }
  }
</style>
