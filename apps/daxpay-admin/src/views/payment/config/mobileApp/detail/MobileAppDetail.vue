<script lang="ts" setup>
  import { computed, onMounted, reactive, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type MobileAppParam,
    MobileAppApi,
  } from '#/api/payment/config/mobile-app.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'MobileAppDetail' });

  /** 结构化配置字段(各平台共用, 按平台取用) */
  interface StructuredConfig {
    appId: string;
    appSecret: string;
    originalId: string;
    privateKey: string;
    alipayPublicKey: string;
  }

  /** 已支持结构化表单的平台 */
  const STRUCTURED_PLATFORMS = new Set(['wx_mini', 'alipay_mini', 'dy_mini']);

  const route = useRoute();
  const router = useRouter();
  const { confirm, message } = useMessage();
  const { diffForm } = useFormEdit();

  const appType = ref((route.params.appType as string) || '');
  const loading = ref(false);
  const activePlatform = ref('');
  const saving = ref(false);
  // 是否处于编辑状态(参考平台配置 WechatMpAuthConfigForm)
  const isEditing = ref(false);

  // 各端支持的平台: disabled 表示暂不可用(灰显)
  const PLATFORMS_BY_APP_TYPE: Record<
    string,
    { disabled?: boolean; platform: string }[]
  > = {
    admin: [
      { platform: 'wx_mini' },
      { platform: 'alipay_mini' },
      { platform: 'dy_mini' },
      { platform: 'android', disabled: true },
      { platform: 'ios', disabled: true },
    ],
    cashier: [
      { platform: 'wx_mini' },
      { platform: 'alipay_mini' },
      { platform: 'dy_mini' },
    ],
    // 商户端可配微信公众号; 管理端不配(授权回调域名名额被网关/商户端H5占用)
    merchant: [
      { platform: 'wx_h5' },
      { platform: 'wx_mini' },
      { platform: 'alipay_mini' },
      { platform: 'dy_mini' },
      { platform: 'android', disabled: true },
      { platform: 'ios', disabled: true },
    ],
  };

  const platformItems = computed(
    () => PLATFORMS_BY_APP_TYPE[appType.value] || [],
  );
  const platforms = computed(() =>
    platformItems.value.map((item) => item.platform),
  );

  // 各平台表单数据(platform -> formData)
  const formDataMap = reactive<Record<string, MobileAppParam>>({});
  // 各平台结构化字段
  const structuredMap = reactive<Record<string, StructuredConfig>>({});
  const originalStructuredMap = reactive<Record<string, StructuredConfig>>({});

  // 端标题
  const appTitle = computed(() => {
    if (appType.value) {
      return $t(`payment.config.mobileApp.card.${appType.value}.name`);
    }
    return $t('payment.config.mobileApp.detail.notSupportedAppType');
  });

  /**
   * 判断平台是否暂不可用
   */
  function isPlatformDisabled(platform: string): boolean {
    return (
      platformItems.value.find((item) => item.platform === platform)
        ?.disabled === true
    );
  }

  /**
   * 是否为结构化表单平台
   */
  function isStructuredPlatform(platform: string): boolean {
    return STRUCTURED_PLATFORMS.has(platform);
  }

  /**
   * 初始化某平台的空表单
   */
  function initForm(platform: string): MobileAppParam {
    return {
      appType: appType.value,
      platform,
      appName: '',
      appConfig: '',
      notifyConfig: '',
      remark: '',
    };
  }

  /**
   * 初始化结构化字段
   */
  function initStructured(): StructuredConfig {
    return {
      appId: '',
      appSecret: '',
      originalId: '',
      privateKey: '',
      alipayPublicKey: '',
    };
  }

  /**
   * 从 appConfig JSON 解析结构化字段
   */
  function parseStructured(appConfig?: string): StructuredConfig {
    const result = initStructured();
    try {
      if (appConfig) {
        const cfg = JSON.parse(appConfig) as Record<string, string>;
        result.appId = cfg.appId || '';
        result.appSecret = cfg.appSecret || '';
        result.originalId = cfg.originalId || '';
        result.privateKey = cfg.privateKey || '';
        result.alipayPublicKey = cfg.alipayPublicKey || '';
      }
    } catch {
      // 非合法 JSON 时保持空
    }
    return result;
  }

  /**
   * 按平台序列化 appConfig, 敏感字段仅在 diffForm 有新值时写入
   */
  function serializeByPlatform(
    platform: string,
    structured: StructuredConfig,
    sensitive: Partial<StructuredConfig>,
  ): string {
    const obj: Record<string, string | undefined> = {
      appId: structured.appId || undefined,
    };
    if (platform === 'wx_mini') {
      obj.originalId = structured.originalId || undefined;
      if (sensitive.appSecret !== undefined) {
        obj.appSecret = sensitive.appSecret;
      }
    } else if (platform === 'alipay_mini') {
      if (sensitive.privateKey !== undefined) {
        obj.privateKey = sensitive.privateKey;
      }
      if (sensitive.alipayPublicKey !== undefined) {
        obj.alipayPublicKey = sensitive.alipayPublicKey;
      }
    } else if (platform === 'dy_mini') {
      if (sensitive.appSecret !== undefined) {
        obj.appSecret = sensitive.appSecret;
      }
    }
    return JSON.stringify(obj);
  }

  /**
   * 校验结构化表单
   */
  function validateStructured(
    platform: string,
    structured: StructuredConfig,
    original: StructuredConfig,
  ): boolean {
    if (!structured.appId?.trim()) {
      message.warning($t('payment.config.mobileApp.fields.appIdRequired'));
      return false;
    }
    if (platform === 'wx_mini' || platform === 'dy_mini') {
      if (!original.appSecret && !structured.appSecret?.trim()) {
        message.warning(
          $t('payment.config.mobileApp.fields.appSecretRequired'),
        );
        return false;
      }
    }
    if (platform === 'alipay_mini') {
      if (!original.privateKey && !structured.privateKey?.trim()) {
        message.warning(
          $t('payment.config.mobileApp.fields.privateKeyRequired'),
        );
        return false;
      }
      if (!original.alipayPublicKey && !structured.alipayPublicKey?.trim()) {
        message.warning(
          $t('payment.config.mobileApp.fields.alipayPublicKeyRequired'),
        );
        return false;
      }
    }
    return true;
  }

  /**
   * 加载该端所有平台配置
   */
  async function loadData(keepPlatform = false) {
    if (!appType.value || !platforms.value.length) return;
    loading.value = true;
    try {
      for (const p of platforms.value) {
        formDataMap[p] = initForm(p);
        structuredMap[p] = initStructured();
        originalStructuredMap[p] = initStructured();
      }
      const { data } = await MobileAppApi.listByAppType(appType.value);
      for (const item of data || []) {
        if (item.platform && formDataMap[item.platform]) {
          Object.assign(formDataMap[item.platform]!, item);
          const structured = parseStructured(item.appConfig);
          structuredMap[item.platform] = { ...structured };
          originalStructuredMap[item.platform] = { ...structured };
        }
      }
      if (!keepPlatform || !activePlatform.value) {
        const firstEnabled = platformItems.value.find((item) => !item.disabled);
        activePlatform.value =
          firstEnabled?.platform || platforms.value[0] || '';
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * 进入编辑模式
   */
  function handleEdit() {
    if (isPlatformDisabled(activePlatform.value)) return;
    isEditing.value = true;
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
        await loadData(true);
      },
    });
  }

  /**
   * 保存当前平台配置
   */
  async function handleSave() {
    const platform = activePlatform.value;
    if (isPlatformDisabled(platform) || !isEditing.value) return;
    const form = formDataMap[platform];
    if (!form) return;

    let submit: MobileAppParam = {
      ...form,
      appType: appType.value,
      platform,
    };

    if (isStructuredPlatform(platform)) {
      const structured = structuredMap[platform];
      const originalStructured = originalStructuredMap[platform];
      if (!structured || !originalStructured) return;
      if (!validateStructured(platform, structured, originalStructured)) {
        return;
      }
      // 按平台敏感字段做 diffForm
      const sensitiveKeys =
        platform === 'alipay_mini'
          ? (['privateKey', 'alipayPublicKey'] as const)
          : (['appSecret'] as const);
      const sensitive = diffForm(
        originalStructured,
        structured,
        ...sensitiveKeys,
      );
      submit = {
        ...submit,
        appConfig: serializeByPlatform(platform, structured, sensitive),
      };
    }

    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        saving.value = true;
        try {
          await MobileAppApi.save(submit);
          message.success($t('payment.config.mobileApp.detail.saveSuccess'));
          isEditing.value = false;
          await loadData(true);
        } finally {
          saving.value = false;
        }
      },
    });
  }

  /**
   * 返回卡片页
   */
  function handleBack() {
    router.push({ path: '/payment/config/mobile-app' });
  }

  // 切 Tab 时退出编辑并重载, 避免脏数据串平台
  watch(activePlatform, async (next, prev) => {
    if (!prev || next === prev) return;
    if (isEditing.value) {
      isEditing.value = false;
      await loadData(true);
    }
  });

  onMounted(() => {
    loadData();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <a-button
            type="text"
            class="flex items-center justify-center rounded-full hover:bg-accent"
            @click="handleBack"
          >
            <template #icon>
              <IconifyIcon
                icon="ant-design:arrow-left-outlined"
                class="text-lg"
              />
            </template>
          </a-button>
          <span class="text-lg font-bold text-foreground">{{ appTitle }}</span>
        </div>
      </template>

      <a-spin :spinning="loading">
        <a-tabs v-model:active-key="activePlatform">
          <!-- Tabs 右侧: 编辑 / 取消+保存 -->
          <template #rightExtra>
            <a-space v-if="!isPlatformDisabled(activePlatform)">
              <template v-if="!isEditing">
                <a-button type="primary" @click="handleEdit">
                  {{ $t('common.edit') }}
                </a-button>
              </template>
              <template v-else>
                <a-button @click="handleCancel">
                  {{ $t('common.cancel') }}
                </a-button>
                <a-button
                  type="primary"
                  :loading="saving"
                  @click="handleSave"
                >
                  {{ $t('common.save') }}
                </a-button>
              </template>
            </a-space>
          </template>

          <a-tab-pane
            v-for="item in platformItems"
            :key="item.platform"
            :disabled="item.disabled"
          >
            <template #tab>
              <span :class="{ 'opacity-50': item.disabled }">
                {{
                  $t(`payment.config.mobileApp.platformNames.${item.platform}`)
                }}
                <a-tag
                  v-if="item.disabled"
                  color="orange"
                  class="ml-1"
                  style="font-size: 11px; line-height: 18px"
                >
                  {{ $t('payment.config.mobileApp.card.comingSoon') }}
                </a-tag>
              </span>
            </template>

            <!-- 暂不可用平台 -->
            <a-empty
              v-if="item.disabled"
              :description="
                $t('payment.config.mobileApp.detail.platformComingSoon')
              "
            />

            <!-- 结构化表单: wx_mini / alipay_mini / dy_mini -->
            <a-form
              v-else-if="
                isStructuredPlatform(item.platform) &&
                formDataMap[item.platform] &&
                structuredMap[item.platform]
              "
              :model="formDataMap[item.platform]"
              layout="vertical"
              class="max-w-2xl"
            >
              <!-- 微信小程序 -->
              <template v-if="item.platform === 'wx_mini'">
                <a-form-item
                  :label="$t('payment.config.mobileApp.fields.wxAppId')"
                  required
                >
                  <a-input
                    v-model:value="structuredMap[item.platform]!.appId"
                    :disabled="!isEditing"
                    :placeholder="
                      $t('payment.config.mobileApp.fields.wxAppIdPlaceholder')
                    "
                  />
                </a-form-item>
                <a-form-item
                  :label="$t('payment.config.mobileApp.fields.wxAppSecret')"
                  required
                >
                  <a-input
                    v-model:value="structuredMap[item.platform]!.appSecret"
                    :disabled="!isEditing"
                    allow-clear
                    :placeholder="
                      $t(
                        'payment.config.mobileApp.fields.wxAppSecretPlaceholder',
                      )
                    "
                  />
                </a-form-item>
                <a-form-item
                  :label="$t('payment.config.mobileApp.fields.originalId')"
                >
                  <a-input
                    v-model:value="structuredMap[item.platform]!.originalId"
                    :disabled="!isEditing"
                    :placeholder="
                      $t(
                        'payment.config.mobileApp.fields.originalIdPlaceholder',
                      )
                    "
                  />
                </a-form-item>
              </template>

              <!-- 支付宝小程序 -->
              <template v-else-if="item.platform === 'alipay_mini'">
                <a-form-item
                  :label="$t('payment.config.mobileApp.fields.alipayAppId')"
                  required
                >
                  <a-input
                    v-model:value="structuredMap[item.platform]!.appId"
                    :disabled="!isEditing"
                    :placeholder="
                      $t(
                        'payment.config.mobileApp.fields.alipayAppIdPlaceholder',
                      )
                    "
                  />
                </a-form-item>
                <a-form-item
                  :label="$t('payment.config.mobileApp.fields.privateKey')"
                  required
                >
                  <a-textarea
                    v-model:value="structuredMap[item.platform]!.privateKey"
                    :disabled="!isEditing"
                    :rows="4"
                    :placeholder="
                      $t(
                        'payment.config.mobileApp.fields.privateKeyPlaceholder',
                      )
                    "
                  />
                </a-form-item>
                <a-form-item
                  :label="$t('payment.config.mobileApp.fields.alipayPublicKey')"
                  required
                >
                  <a-textarea
                    v-model:value="
                      structuredMap[item.platform]!.alipayPublicKey
                    "
                    :disabled="!isEditing"
                    :rows="4"
                    :placeholder="
                      $t(
                        'payment.config.mobileApp.fields.alipayPublicKeyPlaceholder',
                      )
                    "
                  />
                </a-form-item>
              </template>

              <!-- 抖音小程序 -->
              <template v-else-if="item.platform === 'dy_mini'">
                <a-form-item
                  :label="$t('payment.config.mobileApp.fields.dyAppId')"
                  required
                >
                  <a-input
                    v-model:value="structuredMap[item.platform]!.appId"
                    :disabled="!isEditing"
                    :placeholder="
                      $t('payment.config.mobileApp.fields.dyAppIdPlaceholder')
                    "
                  />
                </a-form-item>
                <a-form-item
                  :label="$t('payment.config.mobileApp.fields.dyAppSecret')"
                  required
                >
                  <a-input
                    v-model:value="structuredMap[item.platform]!.appSecret"
                    :disabled="!isEditing"
                    allow-clear
                    :placeholder="
                      $t(
                        'payment.config.mobileApp.fields.dyAppSecretPlaceholder',
                      )
                    "
                  />
                </a-form-item>
              </template>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </a-card>
  </div>
</template>
