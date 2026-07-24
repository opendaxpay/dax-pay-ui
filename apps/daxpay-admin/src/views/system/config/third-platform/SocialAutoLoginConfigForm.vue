<script lang="ts" setup>
  import type { FormInstance } from 'antdv-next';

  import type {
    SocialAutoLoginClientItem,
    SocialAutoLoginConfigResult,
    SocialLoginConfigResult,
  } from '#/api/iam/social.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { SocialLoginConfigApi } from '#/api/iam/social.api';
  import { SocialSourceEnum } from '#/enums/social/socialEnum';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'SocialAutoLoginConfigForm' });

  /** 支持应用内 UA 静默授权的平台(不含微信开放平台扫码) */
  const AUTO_LOGIN_SOURCES = new Set<string>([
    SocialSourceEnum.FEISHU,
    SocialSourceEnum.WE_CHAT,
    SocialSourceEnum.WE_COM,
  ]);

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const saving = ref(false);
  const isEditing = ref(false);
  const formRef = ref<FormInstance>();

  // 已启用的社交平台(下拉选项)
  const enabledPlatforms = ref<SocialLoginConfigResult[]>([]);

  const formState = ref<SocialAutoLoginConfigResult>({
    admin: { enabled: false, sources: [] },
    merchant: { enabled: false, sources: [] },
  });

  // 下拉选项: 仅已配置且启用、且支持应用内自动登录的平台
  const sourceOptions = computed(() =>
    enabledPlatforms.value
      .filter(
        (item) =>
          item.configured &&
          item.enabled &&
          item.source &&
          AUTO_LOGIN_SOURCES.has(item.source),
      )
      .map((item) => ({
        value: item.source as string,
        // 平台显示名走 i18n
        label: $t(`iam.social.platform.${item.source}`),
      })),
  );

  onMounted(() => {
    loadAll();
  });

  /**
   * 并行加载自动登录配置与平台列表
   */
  async function loadAll() {
    loading.value = true;
    try {
      const [configRes, platformsRes] = await Promise.all([
        SocialLoginConfigApi.getAutoLogin(),
        SocialLoginConfigApi.findAll(),
      ]);
      formState.value = normalizeConfig(configRes.data);
      enabledPlatforms.value = platformsRes.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 归一化缺省字段, 兼容旧版单字段 source
   */
  function normalizeConfig(data?: SocialAutoLoginConfigResult): SocialAutoLoginConfigResult {
    return {
      admin: normalizeClient(data?.admin),
      merchant: normalizeClient(data?.merchant),
    };
  }

  /**
   * 单端归一: sources 优先, 旧 source 回退为单元素数组
   */
  function normalizeClient(client?: SocialAutoLoginClientItem): SocialAutoLoginClientItem {
    const sources =
      client?.sources && client.sources.length > 0
        ? [...client.sources]
        : client?.source
          ? [client.source]
          : [];
    return {
      enabled: Boolean(client?.enabled),
      sources,
    };
  }

  /**
   * 进入编辑
   */
  function handleEdit() {
    isEditing.value = true;
    formRef.value?.clearValidate();
  }

  /**
   * 取消编辑并重新加载
   */
  function handleCancel() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        isEditing.value = false;
        await loadAll();
        formRef.value?.clearValidate();
      },
    });
  }

  /**
   * 单端 sources 必填校验(仅开启时)
   */
  function validateSources(
    _rule: unknown,
    value: string[] | undefined,
    client: SocialAutoLoginClientItem | undefined,
  ) {
    if (client?.enabled && (!value || value.length === 0)) {
      return Promise.reject(new Error($t('system.thirdPlatform.autoLogin.validate.source')));
    }
    return Promise.resolve();
  }

  /**
   * 保存配置
   */
  function handleSave() {
    formRef.value?.validate().then(() => {
      confirm({
        title: $t('common.confirm'),
        content: $t('system.thirdPlatform.autoLogin.confirmSaveContent'),
        okText: $t('common.okText'),
        cancelText: $t('common.cancelText'),
        onOk: async () => {
          saving.value = true;
          try {
            await SocialLoginConfigApi.updateAutoLogin({
              admin: {
                enabled: Boolean(formState.value.admin?.enabled),
                sources: formState.value.admin?.enabled
                  ? formState.value.admin?.sources || []
                  : [],
              },
              merchant: {
                enabled: Boolean(formState.value.merchant?.enabled),
                sources: formState.value.merchant?.enabled
                  ? formState.value.merchant?.sources || []
                  : [],
              },
            });
            message.success($t('common.saveSuccess'));
            isEditing.value = false;
            await loadAll();
          } finally {
            saving.value = false;
          }
        },
      });
    });
  }
</script>

<template>
  <div v-loading="loading" class="auto-login-form">
    <div class="module-overview">
      <div class="module-overview__header">
        <div>
          <!-- 应用内自动登录标题 -->
          <div class="module-overview__title">{{ $t('system.thirdPlatform.autoLogin.title') }}</div>
          <!-- 应用内自动登录描述 -->
          <div class="module-overview__desc">{{ $t('system.thirdPlatform.autoLogin.description') }}</div>
        </div>
        <div class="module-overview__actions">
          <a-button v-if="!isEditing" type="primary" @click="handleEdit">
            {{ $t('common.edit') }}
          </a-button>
          <template v-else>
            <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
            <a-button type="primary" :loading="saving" @click="handleSave">
              {{ $t('common.save') }}
            </a-button>
          </template>
        </div>
      </div>
      <div class="mb-4">
        <a-alert type="info" show-icon :message="$t('system.thirdPlatform.autoLogin.usageTip')" />
      </div>
    </div>

    <a-form ref="formRef" :model="formState" layout="vertical" :disabled="!isEditing">
      <!-- 运营端 -->
      <div class="config-section">
        <div class="config-section__title">{{ $t('system.thirdPlatform.autoLogin.section.admin') }}</div>
        <a-form-item :label="$t('system.thirdPlatform.autoLogin.enabled.label')">
          <a-switch v-model:checked="formState.admin!.enabled" />
          <div class="config-item__desc">{{ $t('system.thirdPlatform.autoLogin.enabled.desc') }}</div>
        </a-form-item>
        <a-form-item
          :label="$t('system.thirdPlatform.autoLogin.source.label')"
          name="admin.sources"
          :rules="[
            {
              validator: (_r: unknown, v: string[] | undefined) =>
                validateSources(_r, v, formState.admin),
            },
          ]"
        >
          <a-select
            v-model:value="formState.admin!.sources"
            mode="multiple"
            allow-clear
            :placeholder="$t('system.thirdPlatform.autoLogin.source.placeholder')"
            :options="sourceOptions"
            :disabled="!isEditing || !formState.admin?.enabled"
            class="!w-full max-w-md"
          />
          <div class="config-item__desc">{{ $t('system.thirdPlatform.autoLogin.source.desc') }}</div>
        </a-form-item>
      </div>

      <!-- 商户端 -->
      <div class="config-section">
        <div class="config-section__title">{{ $t('system.thirdPlatform.autoLogin.section.merchant') }}</div>
        <a-form-item :label="$t('system.thirdPlatform.autoLogin.enabled.label')">
          <a-switch v-model:checked="formState.merchant!.enabled" />
          <div class="config-item__desc">{{ $t('system.thirdPlatform.autoLogin.enabled.desc') }}</div>
        </a-form-item>
        <a-form-item
          :label="$t('system.thirdPlatform.autoLogin.source.label')"
          name="merchant.sources"
          :rules="[
            {
              validator: (_r: unknown, v: string[] | undefined) =>
                validateSources(_r, v, formState.merchant),
            },
          ]"
        >
          <a-select
            v-model:value="formState.merchant!.sources"
            mode="multiple"
            allow-clear
            :placeholder="$t('system.thirdPlatform.autoLogin.source.placeholder')"
            :options="sourceOptions"
            :disabled="!isEditing || !formState.merchant?.enabled"
            class="!w-full max-w-md"
          />
          <div class="config-item__desc">{{ $t('system.thirdPlatform.autoLogin.source.desc') }}</div>
        </a-form-item>
      </div>
    </a-form>
  </div>
</template>

<style scoped>
  .auto-login-form {
    max-width: 720px;
  }

  .module-overview__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  .module-overview__title {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .module-overview__desc {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .module-overview__actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
  }

  .config-section {
    margin-bottom: 28px;
  }

  .config-section__title {
    margin-bottom: 16px;
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .config-item__desc {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.5;
    color: hsl(var(--muted-foreground));
  }
</style>
