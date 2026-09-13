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
        const latency = data.latencyMs == null ? '' : ` (${data.latencyMs}ms)`;
        message.success(`${data.message || $t('system.platform.url.checkSuccess')}${latency}`);
      } else {
        message.error(data?.message || $t('system.platform.url.checkFailed'));
      }
    } finally {
      checking.value = { ...checking.value, [field]: false };
    }
  }

  // 供外壳 PageShell 常驻 header 渲染编辑操作(标题/描述由外壳 tabs 数据提供)
  defineExpose({
    isEditing,
    saving,
    handleEdit,
    handleCancel,
    handleSave,
  });
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
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
              <a-button type="primary" :loading="checking.adminBaseUrl" @click="handleCheck('admin', 'adminBaseUrl')">
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
</template>

<style scoped>
  /* 端点地址行: 输入框 + 连通性检查按钮(config-* 与 module-* 公共样式随 PageShell 引入) */
  .url-field {
    display: flex;
    gap: 8px;
    width: 100%;
    margin-top: 4px;
  }

  .url-field :deep(.ant-input) {
    flex: 1;
  }
</style>
