<script lang="ts" setup>
  import type { UrlConfig } from '#/api/system/url-config.api';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { UrlConfigApi } from '#/api/system/url-config.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const { confirm, message } = useMessage();
  const { diffForm } = useFormEdit();

  const formRef = ref();
  const loading = ref(false);
  const saving = ref(false);
  // 各字段检查中状态
  const checking = ref<Record<string, boolean>>({});
  // 是否处于编辑状态
  const isEditing = ref(false);
  // 记录原始值(端点配置均为普通 URL 字符串, 无敏感字段, diffForm 仅用于检测变化)
  const originalValues = ref<UrlConfig>({});
  // 表单数据
  const formState = ref<UrlConfig>({});

  onMounted(() => {
    loadConfig();
  });

  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await UrlConfigApi.get();
      if (data) {
        formState.value = data;
        // 记录原始值, 用于后续比较
        originalValues.value = { ...data };
      }
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
   * 保存配置
   */
  function handleSave() {
    formRef.value
      ?.validate()
      .then(() => {
        confirm({
          cancelText: $t('common.cancelText'),
          content: $t('system.platform.url.confirmSaveContent'),
          okText: $t('common.okText'),
          onOk: async () => {
            saving.value = true;
            try {
              // URL 字段非敏感, 直接提交 formState
              const submitData: UrlConfig = {
                ...formState.value,
                ...diffForm(originalValues, formState),
              };
              await UrlConfigApi.update(submitData);
              message.success($t('common.saveSuccess'));
              isEditing.value = false;
              // 重新加载以获取最新数据
              await loadConfig();
            } finally {
              saving.value = false;
            }
          },
          title: $t('common.confirm'),
        });
      })
      .catch(() => {});
  }

  /**
   * 检查单个端点连通性
   * @param urlType 端点类型
   * @param field 表单字段名
   */
  async function handleCheck(urlType: string, field: keyof UrlConfig) {
    const url = formState.value[field];
    checking.value = { ...checking.value, [field]: true };
    try {
      const { data } = await UrlConfigApi.check({
        urlType,
        url: url || undefined,
      });
      if (data?.success) {
        const latency = data.latencyMs != null ? ` (${data.latencyMs}ms)` : '';
        message.success(`${data.message || $t('system.platform.url.checkSuccess')}${latency}`);
      } else {
        message.error(data?.message || $t('system.platform.url.checkFailed'));
      }
    } finally {
      checking.value = { ...checking.value, [field]: false };
    }
  }
</script>

<template>
  <div class="url-config-page">
    <a-spin :spinning="loading" class="w-full">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- 端点配置标题 -->
          <div class="module-overview__title">{{ $t('system.platform.url.title') }}</div>
          <div class="module-actions">
            <a-space>
              <!-- 非编辑状态: 显示编辑按钮 -->
              <template v-if="!isEditing">
                <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
              </template>
              <!-- 编辑状态: 显示取消和确认按钮 -->
              <template v-else>
                <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
                <a-button type="primary" :loading="saving" @click="handleSave">
                  {{ $t('common.save') }}
                </a-button>
              </template>
            </a-space>
          </div>
        </div>
        <!-- 端点配置描述 -->
        <div class="module-overview__desc">{{ $t('system.platform.url.description') }}</div>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
        <!-- 各端访问地址 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.platform.url.section.endpoint') }}</div>

          <a-form-item name="adminBaseUrl">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 管理端访问地址 -->
                <div class="config-item__label">{{ $t('system.platform.url.adminBaseUrl') }}</div>
                <div class="config-item__desc">{{ $t('system.platform.url.adminBaseUrlDesc') }}</div>
              </div>
              <div class="url-field">
                <!-- 国际化: 请输入管理端访问地址 -->
                <a-input
                  v-model:value="formState.adminBaseUrl"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.url.inputAdminBaseUrl')"
                />
                <a-button
                  type="primary"
                  :loading="checking.adminBaseUrl"
                  @click="handleCheck('admin', 'adminBaseUrl')"
                >
                  {{ $t('system.platform.url.check') }}
                </a-button>
              </div>
            </div>
          </a-form-item>

          <a-form-item name="merchantBaseUrl">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 商户端访问地址 -->
                <div class="config-item__label">{{ $t('system.platform.url.merchantBaseUrl') }}</div>
                <div class="config-item__desc">{{ $t('system.platform.url.merchantBaseUrlDesc') }}</div>
              </div>
              <div class="url-field">
                <!-- 国际化: 请输入商户端访问地址 -->
                <a-input
                  v-model:value="formState.merchantBaseUrl"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.url.inputMerchantBaseUrl')"
                />
                <a-button
                  type="primary"
                  :loading="checking.merchantBaseUrl"
                  @click="handleCheck('merchant', 'merchantBaseUrl')"
                >
                  {{ $t('system.platform.url.check') }}
                </a-button>
              </div>
            </div>
          </a-form-item>

          <a-form-item name="paymentGatewayBaseUrl">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 支付网关前端地址 -->
                <div class="config-item__label">{{ $t('system.platform.url.paymentGatewayBaseUrl') }}</div>
                <div class="config-item__desc">{{ $t('system.platform.url.paymentGatewayBaseUrlDesc') }}</div>
              </div>
              <div class="url-field">
                <!-- 国际化: 请输入支付网关前端地址 -->
                <a-input
                  v-model:value="formState.paymentGatewayBaseUrl"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.url.inputPaymentGatewayBaseUrl')"
                />
                <a-button
                  type="primary"
                  :loading="checking.paymentGatewayBaseUrl"
                  @click="handleCheck('paymentGateway', 'paymentGatewayBaseUrl')"
                >
                  {{ $t('system.platform.url.check') }}
                </a-button>
              </div>
            </div>
          </a-form-item>

          <a-form-item name="backendBaseUrl">
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 后端 API 地址 -->
                <div class="config-item__label">{{ $t('system.platform.url.backendBaseUrl') }}</div>
                <div class="config-item__desc">{{ $t('system.platform.url.backendBaseUrlDesc') }}</div>
              </div>
              <div class="url-field">
                <!-- 国际化: 请输入后端 API 地址 -->
                <a-input
                  v-model:value="formState.backendBaseUrl"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.url.inputBackendBaseUrl')"
                />
                <a-button
                  type="primary"
                  :loading="checking.backendBaseUrl"
                  @click="handleCheck('backend', 'backendBaseUrl')"
                >
                  {{ $t('system.platform.url.check') }}
                </a-button>
              </div>
            </div>
          </a-form-item>
        </div>
      </a-form>
    </a-spin>
  </div>
</template>

<style scoped>
  .url-config-page {
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

  .url-field {
    display: flex;
    gap: 8px;
    width: 100%;
    margin-top: 4px;
  }

  .url-field :deep(.ant-input) {
    flex: 1;
  }

  .module-actions {
    flex-shrink: 0;
  }
</style>
