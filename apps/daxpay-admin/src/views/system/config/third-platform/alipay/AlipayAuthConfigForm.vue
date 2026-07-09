<script lang="ts" setup>
  import type { PlatformAlipayAuthConfig } from '#/api/system/platform-alipay-config.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';
  import { IconifyIcon } from '@vben-core/icons';

  import { PlatformAlipayAuthConfigApi } from '#/api/system/platform-alipay-config.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { readFileAsText } from '#/utils/file';

  defineOptions({ name: 'AlipayAuthConfigForm' });

  const { confirm, message } = useMessage();
  const { diffForm } = useFormEdit();

  const formRef = ref();
  const loading = ref(false);
  const saving = ref(false);
  // 是否处于编辑状态
  const isEditing = ref(false);
  // 记录原始值(脱敏), 用于检测敏感字段是否被修改
  const originalValues = ref<PlatformAlipayAuthConfig>({});
  const formState = ref<PlatformAlipayAuthConfig>({});

  // 鉴权方式: public_key(公钥模式) / cert(证书模式)
  const AUTH_TYPE_KEY = 'public_key';
  const AUTH_TYPE_CERT = 'cert';

  // 是否证书模式
  const isCertMode = computed(() => formState.value.authType === AUTH_TYPE_CERT);

  // 表单校验规则
  const formRules = computed(() => ({
    appId: [{ required: true, message: $t('system.thirdPlatform.alipay.validate.appId') }],
    authType: [{ required: true, message: $t('system.thirdPlatform.alipay.validate.authType') }],
    privateKey: [{ required: true, message: $t('system.thirdPlatform.alipay.validate.privateKey') }],
    alipayPublicKey: isCertMode.value
      ? []
      : [{ required: true, message: $t('system.thirdPlatform.alipay.validate.alipayPublicKey') }],
    appCert: !isCertMode.value
      ? []
      : [{ required: true, message: $t('system.thirdPlatform.alipay.validate.appCert') }],
    alipayCert: !isCertMode.value
      ? []
      : [{ required: true, message: $t('system.thirdPlatform.alipay.validate.alipayCert') }],
    alipayRootCert: !isCertMode.value
      ? []
      : [{ required: true, message: $t('system.thirdPlatform.alipay.validate.alipayRootCert') }],
  }));

  onMounted(() => {
    loadConfig();
  });

  /**
   * 加载配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await PlatformAlipayAuthConfigApi.get();
      // 默认公钥模式(平台级配置不再支持沙箱)
      const merged = { authType: AUTH_TYPE_KEY, ...data, sandbox: false };
      formState.value = merged;
      originalValues.value = { ...merged };
    } finally {
      loading.value = false;
    }
  }

  /**
   * 进入编辑模式
   */
  function handleEdit() {
    isEditing.value = true;
    formRef.value?.clearValidate();
  }

  /**
   * 取消编辑, 重新加载数据
   */
  function handleCancel() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        isEditing.value = false;
        await loadConfig();
        formRef.value?.clearValidate();
      },
    });
  }

  /**
   * 上传证书文件, 读取文本内容写入对应字段
   */
  function handleUpload(info: { file: File }, fieldName: string) {
    const file = info.file;
    if (!file) {
      return;
    }
    readFileAsText(file).then((content) => {
      (formState.value as Record<string, string>)[fieldName] = content;
      message.success($t('components.upload.uploadSuccess', { name: file.name }));
      formRef.value?.validateFields(fieldName);
    });
  }

  /**
   * 截断证书内容用于 tooltip 预览
   */
  function truncateContent(content: string, maxLength = 500): string {
    if (!content) {
      return '';
    }
    if (content.length <= maxLength) {
      return content;
    }
    return `${content.slice(0, Math.max(0, maxLength))}...`;
  }

  /**
   * 保存配置(敏感字段用 diffForm 处理: 未修改返回 undefined, 后端 NOT_NULL 策略跳过更新)
   */
  function handleSave() {
    formRef.value?.validate().then(() => {
      confirm({
        cancelText: $t('common.cancelText'),
        content: $t('system.thirdPlatform.alipay.confirmSaveContent'),
        okText: $t('common.okText'),
        onOk: async () => {
          saving.value = true;
          try {
            const sensitiveData = diffForm(
              originalValues.value,
              formState.value,
              'privateKey',
              'alipayPublicKey',
              'appCert',
              'alipayCert',
              'alipayRootCert',
            );
            const submitData: PlatformAlipayAuthConfig = {
              ...formState.value,
              ...sensitiveData,
              // 平台级配置固定生产环境
              sandbox: false,
            };
            await PlatformAlipayAuthConfigApi.update(submitData);
            message.success($t('common.saveSuccess'));
            isEditing.value = false;
            await loadConfig();
          } finally {
            saving.value = false;
          }
        },
        title: $t('common.confirm'),
      });
    }).catch(() => {});
  }
</script>

<template>
  <div class="alipay-config-page">
    <a-spin :spinning="loading" class="w-full">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- 支付宝应用配置标题 -->
          <div class="module-overview__title">{{ $t('system.thirdPlatform.alipay.title') }}</div>
          <div class="module-actions">
            <a-space>
              <template v-if="!isEditing">
                <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
              </template>
              <template v-else>
                <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
                <a-button type="primary" :loading="saving" @click="handleSave">
                  {{ $t('common.save') }}
                </a-button>
              </template>
            </a-space>
          </div>
        </div>
        <!-- 支付宝应用配置描述 -->
        <div class="module-overview__desc">{{ $t('system.thirdPlatform.alipay.description') }}</div>
        <!-- 用途提示 -->
        <a-alert
          :message="$t('system.thirdPlatform.alipay.usageTip')"
          type="info"
          show-icon
          banner
          class="!mt-2"
        />
      </div>

      <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical" class="module-form">
        <!-- 基础配置 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.thirdPlatform.alipay.section.basic') }}</div>

          <div class="config-grid">
            <a-form-item name="appId">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 应用 appId -->
                  <div class="config-item__label">{{ $t('system.thirdPlatform.alipay.appId') }}</div>
                  <div class="config-item__desc">{{ $t('system.thirdPlatform.alipay.appIdDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.appId"
                  :disabled="!isEditing"
                  :placeholder="$t('system.thirdPlatform.alipay.inputAppId')"
                />
              </div>
            </a-form-item>

            <a-form-item name="authType">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 鉴权方式 -->
                  <div class="config-item__label">{{ $t('system.thirdPlatform.alipay.authType') }}</div>
                  <div class="config-item__desc">{{ $t('system.thirdPlatform.alipay.authTypeDesc') }}</div>
                </div>
                <a-radio-group v-model:value="formState.authType" button-style="solid" :disabled="!isEditing">
                  <a-radio-button :value="AUTH_TYPE_KEY">{{ $t('system.thirdPlatform.alipay.authTypeKey') }}</a-radio-button>
                  <a-radio-button :value="AUTH_TYPE_CERT">{{ $t('system.thirdPlatform.alipay.authTypeCert') }}</a-radio-button>
                </a-radio-group>
              </div>
            </a-form-item>
          </div>
        </div>

        <!-- 凭据配置 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.thirdPlatform.alipay.section.credential') }}</div>

          <a-form-item name="privateKey">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 应用私钥 -->
                <div class="config-item__label">{{ $t('system.thirdPlatform.alipay.privateKey') }}</div>
                <div class="config-item__desc">{{ $t('system.thirdPlatform.alipay.privateKeyDesc') }}</div>
              </div>
              <a-textarea
                v-model:value="formState.privateKey"
                :disabled="!isEditing"
                :placeholder="$t('system.thirdPlatform.alipay.inputPrivateKey')"
                :rows="4"
                allow-clear
              />
            </div>
          </a-form-item>

          <!-- 公钥模式 -->
          <a-form-item v-if="!isCertMode" name="alipayPublicKey">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 支付宝公钥 -->
                <div class="config-item__label">{{ $t('system.thirdPlatform.alipay.alipayPublicKey') }}</div>
                <div class="config-item__desc">{{ $t('system.thirdPlatform.alipay.alipayPublicKeyDesc') }}</div>
              </div>
              <a-textarea
                v-model:value="formState.alipayPublicKey"
                :disabled="!isEditing"
                :placeholder="$t('system.thirdPlatform.alipay.inputAlipayPublicKey')"
                :rows="4"
                allow-clear
              />
            </div>
          </a-form-item>

          <!-- 证书模式: 上传 .crt 文件(对齐支付宝直连通道) -->
          <template v-if="isCertMode">
            <a-form-item name="appCert">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 应用公钥证书 -->
                  <div class="config-item__label">{{ $t('system.thirdPlatform.alipay.appCert') }}</div>
                  <div class="config-item__desc">{{ $t('system.thirdPlatform.alipay.appCertDesc') }}</div>
                </div>
                <a-upload
                  v-if="!formState.appCert"
                  :disabled="!isEditing"
                  :multiple="false"
                  :show-upload-list="false"
                  accept=".crt"
                  :before-upload="() => false"
                  @change="(info: any) => handleUpload(info, 'appCert')"
                >
                  <a-button :disabled="!isEditing">
                    <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
                    {{ $t('system.thirdPlatform.alipay.uploadAppCert') }}
                  </a-button>
                </a-upload>
                <a-tooltip
                  v-else
                  :title="truncateContent(formState.appCert || '')"
                  placement="top"
                  :mouse-enter-delay="0.3"
                >
                  <a-input value="appCert.crt" disabled>
                    <template #suffix>
                      <span
                        v-if="isEditing"
                        class="cursor-pointer text-gray-400"
                        @click="formState.appCert = ''"
                      >
                        <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
                      </span>
                    </template>
                  </a-input>
                </a-tooltip>
              </div>
            </a-form-item>

            <a-form-item name="alipayCert">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 支付宝公钥证书 -->
                  <div class="config-item__label">{{ $t('system.thirdPlatform.alipay.alipayCert') }}</div>
                  <div class="config-item__desc">{{ $t('system.thirdPlatform.alipay.alipayCertDesc') }}</div>
                </div>
                <a-upload
                  v-if="!formState.alipayCert"
                  :disabled="!isEditing"
                  :multiple="false"
                  :show-upload-list="false"
                  accept=".crt"
                  :before-upload="() => false"
                  @change="(info: any) => handleUpload(info, 'alipayCert')"
                >
                  <a-button :disabled="!isEditing">
                    <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
                    {{ $t('system.thirdPlatform.alipay.uploadAlipayCert') }}
                  </a-button>
                </a-upload>
                <a-tooltip
                  v-else
                  :title="truncateContent(formState.alipayCert || '')"
                  placement="top"
                  :mouse-enter-delay="0.3"
                >
                  <a-input value="alipayCert.crt" disabled>
                    <template #suffix>
                      <span
                        v-if="isEditing"
                        class="cursor-pointer text-gray-400"
                        @click="formState.alipayCert = ''"
                      >
                        <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
                      </span>
                    </template>
                  </a-input>
                </a-tooltip>
              </div>
            </a-form-item>

            <a-form-item name="alipayRootCert">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 支付宝根证书 -->
                  <div class="config-item__label">{{ $t('system.thirdPlatform.alipay.alipayRootCert') }}</div>
                  <div class="config-item__desc">{{ $t('system.thirdPlatform.alipay.alipayRootCertDesc') }}</div>
                </div>
                <a-upload
                  v-if="!formState.alipayRootCert"
                  :disabled="!isEditing"
                  :multiple="false"
                  :show-upload-list="false"
                  accept=".crt"
                  :before-upload="() => false"
                  @change="(info: any) => handleUpload(info, 'alipayRootCert')"
                >
                  <a-button :disabled="!isEditing">
                    <template #icon><IconifyIcon icon="ant-design:upload-outlined" class="text-lg" /></template>
                    {{ $t('system.thirdPlatform.alipay.uploadRootCert') }}
                  </a-button>
                </a-upload>
                <a-tooltip
                  v-else
                  :title="truncateContent(formState.alipayRootCert || '')"
                  placement="top"
                  :mouse-enter-delay="0.3"
                >
                  <a-input value="alipayRootCert.crt" disabled>
                    <template #suffix>
                      <span
                        v-if="isEditing"
                        class="cursor-pointer text-gray-400"
                        @click="formState.alipayRootCert = ''"
                      >
                        <IconifyIcon icon="ant-design:close-circle-outlined" class="text-lg" />
                      </span>
                    </template>
                  </a-input>
                </a-tooltip>
              </div>
            </a-form-item>
          </template>
        </div>
      </a-form>
    </a-spin>
  </div>
</template>

<style scoped>
  .alipay-config-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 4px;
  }

  .module-overview {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .module-overview__header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .module-overview__title {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .module-overview__desc {
    font-size: 13px;
    line-height: 1.7;
    color: hsl(var(--muted-foreground));
  }

  .module-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 12px;
  }

  .module-form :deep(.ant-form-item) {
    margin-bottom: 0;
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

  .config-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .config-item {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 12px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .config-item:hover {
    border-color: hsl(var(--primary) / 30%);
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  }

  .config-item--block {
    flex-direction: column;
    align-items: flex-start;
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

  .module-actions {
    flex-shrink: 0;
  }
</style>
