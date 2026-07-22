<script lang="ts" setup>
  import type { WebsiteConfig } from '#/api/system/website-config.api';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { WebsiteConfigApi } from '#/api/system/website-config.api';
  import { BUploadImage } from '#/components/b-upload-image';
  import { useMessage } from '#/hooks/useMessage';
  import { persistWebsiteConfig } from '#/logics/init-website-config';

  const { confirm, message } = useMessage();

  const formRef = ref();
  const loading = ref(false);
  const saving = ref(false);
  // 是否处于编辑状态
  const isEditing = ref(false);
  // 表单数据
  const formState = ref<WebsiteConfig>({});

  // 备案链接: 空可过, 有值须以 http:// 或 https:// 开头
  const httpLinkRule = {
    validator: (_: unknown, value: string) => {
      if (!value) {
        return Promise.resolve();
      }
      if (/^https?:\/\/.+$/.test(value)) {
        return Promise.resolve();
      }
      // 链接必须以 http:// 或 https:// 开头
      return Promise.reject($t('system.platform.website.linkMustHttp'));
    },
    trigger: 'blur',
  };

  // 选填校验: 空可过; 有值才校邮箱/链接/长度 (对齐后端 Bean Validation)
  const formRules = {
    // 系统名称最长 50
    systemName: [{ max: 50, message: $t('system.platform.website.systemNameMax'), trigger: 'blur' }],
    // 公司全称最长 100
    companyName: [{ max: 100, message: $t('system.platform.website.companyNameMax'), trigger: 'blur' }],
    // 公司邮箱: 空可过, 有值须合法邮箱
    companyEmail: [
      {
        type: 'email',
        // 空串转 undefined, 避免 antd type:email 把空值当非法
        transform: (value: string) => (value ? value : undefined),
        // 邮箱格式不正确
        message: $t('system.platform.website.emailInvalid'),
        trigger: 'blur',
      },
    ],
    // 微信号最长 50
    companyWechat: [{ max: 50, message: $t('system.platform.website.companyWechatMax'), trigger: 'blur' }],
    icpLink: [httpLinkRule],
    mpsLink: [httpLinkRule],
    pcacLink: [httpLinkRule],
    icpPlusLink: [httpLinkRule],
    // 版权信息最长 200
    copyright: [{ max: 200, message: $t('system.platform.website.copyrightMax'), trigger: 'blur' }],
  };

  onMounted(() => {
    loadConfig();
  });

  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await WebsiteConfigApi.get();
      formState.value = data ? { ...data } : {};
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
          content: $t('system.platform.website.confirmSaveContent'),
          okText: $t('common.okText'),
          onOk: async () => {
            saving.value = true;
            try {
              await WebsiteConfigApi.update({ ...formState.value });
              message.success($t('common.saveSuccess'));
              isEditing.value = false;
              // 再拉一次以拿到服务端 contentHash, 避免本地 clientHash 与 MD5 不一致导致下次启动多余 re-apply
              const { data } = await WebsiteConfigApi.get();
              formState.value = data ? { ...data } : {};
              persistWebsiteConfig(formState.value);
            } finally {
              saving.value = false;
            }
          },
          title: $t('common.confirm'),
        });
      })
      .catch(() => {});
  }
</script>

<template>
  <div class="website-config-page">
    <a-spin :spinning="loading" class="w-full">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- 站点配置标题 -->
          <div class="module-overview__title">{{ $t('system.platform.website.title') }}</div>
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
        <!-- 站点配置描述 -->
        <div class="module-overview__desc">{{ $t('system.platform.website.description') }}</div>
      </div>

      <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical" class="module-form">
        <!-- 基础信息 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.platform.website.section.basic') }}</div>

          <div class="config-grid">
            <a-form-item name="systemName">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.systemName') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.systemNameDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.systemName"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputSystemName')"
                />
              </div>
            </a-form-item>

            <a-form-item name="companyName">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.companyName') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.companyNameDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.companyName"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputCompanyName')"
                />
              </div>
            </a-form-item>
          </div>

          <div class="config-grid">
            <a-form-item name="companyPhone">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.companyPhone') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.companyPhoneDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.companyPhone"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputCompanyPhone')"
                />
              </div>
            </a-form-item>

            <a-form-item name="companyEmail">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.companyEmail') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.companyEmailDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.companyEmail"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputCompanyEmail')"
                />
              </div>
            </a-form-item>
          </div>

          <div class="config-grid">
            <a-form-item name="companyWechat">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 国际化: 客服/商务微信号 -->
                  <div class="config-item__label">{{ $t('system.platform.website.companyWechat') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.companyWechatDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.companyWechat"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputCompanyWechat')"
                />
              </div>
            </a-form-item>
          </div>
        </div>

        <!-- Logo -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.platform.website.section.logo') }}</div>

          <div class="config-grid">
            <a-form-item name="logo">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 国际化: 亮色 Logo -->
                  <div class="config-item__label">{{ $t('system.platform.website.logo') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.logoDesc') }}</div>
                </div>
                <BUploadImage
                  v-model="formState.logo"
                  access-type="public"
                  :disabled="!isEditing"
                  :showable="!isEditing"
                />
              </div>
            </a-form-item>

            <a-form-item name="logoDark">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 国际化: 暗色 Logo -->
                  <div class="config-item__label">{{ $t('system.platform.website.logoDark') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.logoDarkDesc') }}</div>
                </div>
                <BUploadImage
                  v-model="formState.logoDark"
                  access-type="public"
                  :disabled="!isEditing"
                  :showable="!isEditing"
                />
              </div>
            </a-form-item>
          </div>
        </div>

        <!-- 备案信息 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.platform.website.section.filing') }}</div>

          <div class="config-grid">
            <a-form-item name="icpInfo">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.icpInfo') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.icpInfoDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.icpInfo"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputIcpInfo')"
                />
              </div>
            </a-form-item>

            <a-form-item name="icpLink">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.icpLink') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.icpLinkDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.icpLink"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputIcpLink')"
                />
              </div>
            </a-form-item>
          </div>

          <div class="config-grid">
            <a-form-item name="mpsInfo">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.mpsInfo') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.mpsInfoDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.mpsInfo"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputMpsInfo')"
                />
              </div>
            </a-form-item>

            <a-form-item name="mpsLink">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.mpsLink') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.mpsLinkDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.mpsLink"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputMpsLink')"
                />
              </div>
            </a-form-item>
          </div>

          <div class="config-grid">
            <a-form-item name="pcacInfo">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.pcacInfo') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.pcacInfoDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.pcacInfo"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputPcacInfo')"
                />
              </div>
            </a-form-item>

            <a-form-item name="pcacLink">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.pcacLink') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.pcacLinkDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.pcacLink"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputPcacLink')"
                />
              </div>
            </a-form-item>
          </div>

          <div class="config-grid">
            <a-form-item name="icpPlusInfo">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.icpPlusInfo') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.icpPlusInfoDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.icpPlusInfo"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputIcpPlusInfo')"
                />
              </div>
            </a-form-item>

            <a-form-item name="icpPlusLink">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.icpPlusLink') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.icpPlusLinkDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.icpPlusLink"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputIcpPlusLink')"
                />
              </div>
            </a-form-item>
          </div>
        </div>

        <!-- 版权 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.platform.website.section.copyright') }}</div>

          <div class="config-grid">
            <a-form-item name="copyright">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <div class="config-item__label">{{ $t('system.platform.website.copyright') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.website.copyrightDesc') }}</div>
                </div>
                <a-input
                  v-model:value="formState.copyright"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.website.inputCopyright')"
                />
              </div>
            </a-form-item>
          </div>
        </div>
      </a-form>
    </a-spin>
  </div>
</template>

<style scoped>
  .website-config-page {
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

  /* 校验失败时留出错误文案空间, 避免贴紧下一格 */
  .module-form :deep(.ant-form-item-with-help) {
    margin-bottom: 12px;
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
