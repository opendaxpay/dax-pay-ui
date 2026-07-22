<script lang="ts" setup>
  import type { FormInstance, Rule } from 'antdv-next';

  import { computed, onMounted, reactive, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type AlipayMiniAppConfig,
    type DyMiniAppConfig,
    type MobileAppParam,
    type WxMiniAppConfig,
    MobileAppApi,
  } from '#/api/system/mobile-app.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { readFileAsText } from '#/utils/file';

  defineOptions({ name: 'MobileAppDetail' });

  // 鉴权方式: public_key(公钥模式) / cert(证书模式)
  const AUTH_TYPE_KEY = 'public_key';
  const AUTH_TYPE_CERT = 'cert';

  /** 已支持强类型表单的平台 */
  const STRUCTURED_PLATFORMS = new Set(['wx_mini', 'alipay_mini', 'dy_mini']);

  const route = useRoute();
  const router = useRouter();
  const { confirm, message } = useMessage();
  const { diffForm } = useFormEdit();

  const appType = ref((route.params.appType as string) || '');
  const loading = ref(false);
  const activePlatform = ref('');
  const saving = ref(false);
  // 是否处于编辑状态
  const isEditing = ref(false);
  // 各平台 a-form 实例
  const formRefMap = reactive<Record<string, FormInstance>>({});

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
    // 收银台仅三小程序; 抖音本期灰显; 无 H5/APP
    cashier: [
      { platform: 'wx_mini' },
      { platform: 'alipay_mini' },
      { platform: 'dy_mini', disabled: true },
    ],
    // 商户端可配微信公众号; 管理端不配
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

  // 各平台外壳表单(含嵌套配置)
  const formDataMap = reactive<Record<string, MobileAppParam>>({});
  // 嵌套配置快照(用于敏感字段 diffForm)
  const originalNestedMap = reactive<
    Record<string, AlipayMiniAppConfig | DyMiniAppConfig | WxMiniAppConfig>
  >({});

  const appTitle = computed(() => {
    if (appType.value) {
      return $t(`system.mobileApp.card.${appType.value}.name`);
    }
    return $t('system.mobileApp.detail.notSupportedAppType');
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
   * 空微信配置
   */
  function emptyWxMini(): WxMiniAppConfig {
    return { appId: '', appSecret: '', originalId: '' };
  }

  /**
   * 空支付宝配置
   */
  function emptyAlipayMini(): AlipayMiniAppConfig {
    return {
      appId: '',
      authType: AUTH_TYPE_KEY,
      privateKey: '',
      alipayPublicKey: '',
      appCert: '',
      alipayCert: '',
      alipayRootCert: '',
    };
  }

  /**
   * 空抖音配置
   */
  function emptyDyMini(): DyMiniAppConfig {
    return { appId: '', appSecret: '' };
  }

  /**
   * 初始化某平台的空表单(含对应嵌套对象)
   */
  function initForm(platform: string): MobileAppParam {
    const base: MobileAppParam = {
      appType: appType.value,
      platform,
      notifyConfig: '',
      remark: '',
    };
    if (platform === 'wx_mini') {
      base.wxMini = emptyWxMini();
    } else if (platform === 'alipay_mini') {
      base.alipayMini = emptyAlipayMini();
    } else if (platform === 'dy_mini') {
      base.dyMini = emptyDyMini();
    }
    return base;
  }

  /**
   * 当前平台嵌套配置(表单 model)
   */
  function nestedOf(
    platform: string,
  ): AlipayMiniAppConfig | DyMiniAppConfig | WxMiniAppConfig | undefined {
    const form = formDataMap[platform];
    if (!form) return undefined;
    if (platform === 'wx_mini') return form.wxMini;
    if (platform === 'alipay_mini') return form.alipayMini;
    if (platform === 'dy_mini') return form.dyMini;
    return undefined;
  }

  /**
   * 是否证书模式
   */
  function isCertMode(platform: string): boolean {
    const nested = formDataMap[platform]?.alipayMini;
    return nested?.authType === AUTH_TYPE_CERT;
  }

  // 表单 ref 回调缓存
  const formRefBinders: Record<
    string,
    (el: Element | FormInstance | null) => void
  > = {};

  /**
   * 获取/创建某平台的稳定 form ref 绑定回调
   */
  function bindFormRef(platform: string) {
    if (!formRefBinders[platform]) {
      formRefBinders[platform] = (el: Element | FormInstance | null) => {
        if (el) {
          formRefMap[platform] = el as FormInstance;
        } else {
          delete formRefMap[platform];
        }
      };
    }
    return formRefBinders[platform]!;
  }

  /**
   * 当前平台表单实例
   */
  function getActiveFormRef(): FormInstance | undefined {
    return formRefMap[activePlatform.value];
  }

  /**
   * 按平台生成表单校验规则
   */
  const nestedRulesMap = computed(() => {
    const map: Record<string, Record<string, Rule[]>> = {};
    for (const platform of platforms.value) {
      if (platform === 'wx_mini' || platform === 'dy_mini') {
        map[platform] = {
          appId: [
            {
              required: true,
              whitespace: true,
              message: $t('system.mobileApp.fields.appIdRequired'),
            },
          ],
          appSecret: [
            {
              required: true,
              whitespace: true,
              message: $t('system.mobileApp.fields.appSecretRequired'),
            },
          ],
        };
        continue;
      }
      if (platform === 'alipay_mini') {
        const certMode = isCertMode(platform);
        map[platform] = {
          appId: [
            {
              required: true,
              whitespace: true,
              message: $t('system.mobileApp.fields.appIdRequired'),
            },
          ],
          authType: [
            {
              required: true,
              message: $t('system.mobileApp.fields.authTypeRequired'),
            },
          ],
          privateKey: [
            {
              required: true,
              whitespace: true,
              message: $t('system.mobileApp.fields.privateKeyRequired'),
            },
          ],
          alipayPublicKey: certMode
            ? []
            : [
                {
                  required: true,
                  whitespace: true,
                  message: $t(
                    'system.mobileApp.fields.alipayPublicKeyRequired',
                  ),
                },
              ],
          appCert: !certMode
            ? []
            : [
                {
                  required: true,
                  whitespace: true,
                  message: $t('system.mobileApp.fields.appCertRequired'),
                },
              ],
          alipayCert: !certMode
            ? []
            : [
                {
                  required: true,
                  whitespace: true,
                  message: $t(
                    'system.mobileApp.fields.alipayCertRequired',
                  ),
                },
              ],
          alipayRootCert: !certMode
            ? []
            : [
                {
                  required: true,
                  whitespace: true,
                  message: $t(
                    'system.mobileApp.fields.alipayRootCertRequired',
                  ),
                },
              ],
        };
      }
    }
    return map;
  });

  /**
   * 组装提交用的嵌套配置: 非敏感字段全量, 敏感字段仅 diff 有变更时写入
   */
  function buildNestedSubmit(
    platform: string,
  ): Pick<MobileAppParam, 'alipayMini' | 'dyMini' | 'wxMini'> {
    const nested = nestedOf(platform);
    const original = originalNestedMap[platform];
    if (!nested || !original) {
      return {};
    }

    if (platform === 'wx_mini') {
      const current = nested as WxMiniAppConfig;
      const orig = original as WxMiniAppConfig;
      const sensitive = diffForm(orig, current, 'appSecret');
      return {
        wxMini: {
          appId: current.appId,
          originalId: current.originalId,
          ...(sensitive.appSecret !== undefined
            ? { appSecret: sensitive.appSecret }
            : {}),
        },
      };
    }

    if (platform === 'alipay_mini') {
      const current = nested as AlipayMiniAppConfig;
      const orig = original as AlipayMiniAppConfig;
      const sensitive = diffForm(
        orig,
        current,
        'privateKey',
        'alipayPublicKey',
        'appCert',
        'alipayCert',
        'alipayRootCert',
      );
      return {
        alipayMini: {
          appId: current.appId,
          authType: current.authType || AUTH_TYPE_KEY,
          ...(sensitive.privateKey !== undefined
            ? { privateKey: sensitive.privateKey }
            : {}),
          ...(sensitive.alipayPublicKey !== undefined
            ? { alipayPublicKey: sensitive.alipayPublicKey }
            : {}),
          ...(sensitive.appCert !== undefined
            ? { appCert: sensitive.appCert }
            : {}),
          ...(sensitive.alipayCert !== undefined
            ? { alipayCert: sensitive.alipayCert }
            : {}),
          ...(sensitive.alipayRootCert !== undefined
            ? { alipayRootCert: sensitive.alipayRootCert }
            : {}),
        },
      };
    }

    if (platform === 'dy_mini') {
      const current = nested as DyMiniAppConfig;
      const orig = original as DyMiniAppConfig;
      const sensitive = diffForm(orig, current, 'appSecret');
      return {
        dyMini: {
          appId: current.appId,
          ...(sensitive.appSecret !== undefined
            ? { appSecret: sensitive.appSecret }
            : {}),
        },
      };
    }

    return {};
  }

  /**
   * 上传证书文件
   */
  function handleCertUpload(
    platform: string,
    fieldName: 'appCert' | 'alipayCert' | 'alipayRootCert',
    info: { file: File },
  ) {
    const file = info.file;
    if (!file) {
      return;
    }
    const nested = formDataMap[platform]?.alipayMini;
    if (!nested) {
      return;
    }
    readFileAsText(file).then((content) => {
      nested[fieldName] = content;
      message.success(
        $t('components.upload.uploadSuccess', { name: file.name }),
      );
      formRefMap[platform]?.validateFields([fieldName]).catch(() => {});
    });
  }

  /**
   * 支付宝鉴权方式切换
   */
  function handleAuthTypeChange(platform: string) {
    formRefMap[platform]?.clearValidate([
      'alipayPublicKey',
      'appCert',
      'alipayCert',
      'alipayRootCert',
    ]);
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
   * 从接口结果填充表单嵌套
   */
  function applyResultNested(platform: string, item: MobileAppParam) {
    const form = formDataMap[platform];
    if (!form) return;
    if (platform === 'wx_mini') {
      form.wxMini = {
        ...emptyWxMini(),
        ...(item.wxMini || {}),
      };
      originalNestedMap[platform] = { ...form.wxMini };
    } else if (platform === 'alipay_mini') {
      form.alipayMini = {
        ...emptyAlipayMini(),
        ...(item.alipayMini || {}),
        authType:
          item.alipayMini?.authType === AUTH_TYPE_CERT
            ? AUTH_TYPE_CERT
            : AUTH_TYPE_KEY,
      };
      originalNestedMap[platform] = { ...form.alipayMini };
    } else if (platform === 'dy_mini') {
      form.dyMini = {
        ...emptyDyMini(),
        ...(item.dyMini || {}),
      };
      originalNestedMap[platform] = { ...form.dyMini };
    }
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
        const nested = nestedOf(p);
        if (nested) {
          originalNestedMap[p] = { ...nested };
        }
      }
      const { data } = await MobileAppApi.listByAppType(appType.value);
      for (const item of data || []) {
        if (item.platform && formDataMap[item.platform]) {
          const form = formDataMap[item.platform]!;
          form.id = item.id;
          form.notifyConfig = item.notifyConfig;
          form.bindingEnabled = item.bindingEnabled;
          form.enabled = item.enabled;
          form.remark = item.remark;
          applyResultNested(item.platform, item);
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
    getActiveFormRef()?.clearValidate();
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
        isEditing.value = false;
        await loadData(true);
        getActiveFormRef()?.clearValidate();
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

    if (isStructuredPlatform(platform)) {
      const formInst = formRefMap[platform];
      if (!formInst) return;
      try {
        await formInst.validate();
      } catch {
        return;
      }
    }

    const nestedSubmit = isStructuredPlatform(platform)
      ? buildNestedSubmit(platform)
      : {};

    const submit: MobileAppParam = {
      id: form.id,
      appType: appType.value,
      platform,
      notifyConfig: form.notifyConfig,
      bindingEnabled: form.bindingEnabled,
      enabled: form.enabled,
      remark: form.remark,
      // 仅提交当前 platform 对应嵌套, 清空其它
      wxMini: undefined,
      alipayMini: undefined,
      dyMini: undefined,
      ...nestedSubmit,
    };

    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        saving.value = true;
        try {
          await MobileAppApi.save(submit);
          message.success($t('system.mobileApp.detail.saveSuccess'));
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
    router.push({ path: '/system/config/mobile-app' });
  }

  // 切 Tab 时退出编辑并重载
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
        <!-- 收银台: 全平台唯一小程序 + 通道需绑定/报备该 AppId -->
        <a-alert
          v-if="appType === 'cashier'"
          type="warning"
          show-icon
          class="mb-4"
          :message="$t('system.mobileApp.detail.cashierLimitTitle')"
          :description="$t('system.mobileApp.detail.cashierLimitDesc')"
        />

        <a-tabs v-model:active-key="activePlatform">
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
                  $t(`system.mobileApp.platformNames.${item.platform}`)
                }}
                <a-tag
                  v-if="item.disabled"
                  color="orange"
                  class="ml-1"
                  style="font-size: 11px; line-height: 18px"
                >
                  {{ $t('system.mobileApp.card.comingSoon') }}
                </a-tag>
              </span>
            </template>

            <a-empty
              v-if="item.disabled"
              :description="
                $t('system.mobileApp.detail.platformComingSoon')
              "
            />

            <!-- 强类型表单: wx_mini / alipay_mini / dy_mini -->
            <a-form
              v-else-if="
                isStructuredPlatform(item.platform) &&
                formDataMap[item.platform] &&
                nestedOf(item.platform)
              "
              :ref="bindFormRef(item.platform)"
              :model="nestedOf(item.platform)"
              :rules="nestedRulesMap[item.platform]"
              layout="vertical"
              class="max-w-2xl"
            >
              <!-- 微信小程序 -->
              <template v-if="item.platform === 'wx_mini' && formDataMap[item.platform]?.wxMini">
                <a-form-item
                  name="appId"
                  :label="$t('system.mobileApp.fields.wxAppId')"
                >
                  <a-input
                    v-model:value="formDataMap[item.platform]!.wxMini!.appId"
                    :disabled="!isEditing"
                    :placeholder="
                      $t('system.mobileApp.fields.wxAppIdPlaceholder')
                    "
                  />
                </a-form-item>
                <a-form-item
                  name="appSecret"
                  :label="$t('system.mobileApp.fields.wxAppSecret')"
                >
                  <a-input
                    v-model:value="
                      formDataMap[item.platform]!.wxMini!.appSecret
                    "
                    :disabled="!isEditing"
                    allow-clear
                    :placeholder="
                      $t(
                        'system.mobileApp.fields.wxAppSecretPlaceholder',
                      )
                    "
                  />
                </a-form-item>
                <a-form-item
                  name="originalId"
                  :label="$t('system.mobileApp.fields.originalId')"
                >
                  <a-input
                    v-model:value="
                      formDataMap[item.platform]!.wxMini!.originalId
                    "
                    :disabled="!isEditing"
                    :placeholder="
                      $t(
                        'system.mobileApp.fields.originalIdPlaceholder',
                      )
                    "
                  />
                </a-form-item>
              </template>

              <!-- 支付宝小程序 -->
              <template
                v-else-if="
                  item.platform === 'alipay_mini' &&
                  formDataMap[item.platform]?.alipayMini
                "
              >
                <a-form-item
                  name="appId"
                  :label="$t('system.mobileApp.fields.alipayAppId')"
                >
                  <a-input
                    v-model:value="
                      formDataMap[item.platform]!.alipayMini!.appId
                    "
                    :disabled="!isEditing"
                    :placeholder="
                      $t(
                        'system.mobileApp.fields.alipayAppIdPlaceholder',
                      )
                    "
                  />
                </a-form-item>
                <a-form-item
                  name="authType"
                  :label="$t('system.mobileApp.fields.authType')"
                >
                  <a-radio-group
                    v-model:value="
                      formDataMap[item.platform]!.alipayMini!.authType
                    "
                    button-style="solid"
                    :disabled="!isEditing"
                    @change="handleAuthTypeChange(item.platform)"
                  >
                    <a-radio-button :value="AUTH_TYPE_KEY">
                      {{ $t('system.mobileApp.fields.authTypeKey') }}
                    </a-radio-button>
                    <a-radio-button :value="AUTH_TYPE_CERT">
                      {{ $t('system.mobileApp.fields.authTypeCert') }}
                    </a-radio-button>
                  </a-radio-group>
                </a-form-item>
                <a-form-item
                  name="privateKey"
                  :label="$t('system.mobileApp.fields.privateKey')"
                >
                  <a-textarea
                    v-model:value="
                      formDataMap[item.platform]!.alipayMini!.privateKey
                    "
                    :disabled="!isEditing"
                    :rows="4"
                    allow-clear
                    :placeholder="
                      $t(
                        'system.mobileApp.fields.privateKeyPlaceholder',
                      )
                    "
                  />
                </a-form-item>
                <a-form-item
                  v-if="!isCertMode(item.platform)"
                  name="alipayPublicKey"
                  :label="$t('system.mobileApp.fields.alipayPublicKey')"
                >
                  <a-textarea
                    v-model:value="
                      formDataMap[item.platform]!.alipayMini!.alipayPublicKey
                    "
                    :disabled="!isEditing"
                    :rows="4"
                    allow-clear
                    :placeholder="
                      $t(
                        'system.mobileApp.fields.alipayPublicKeyPlaceholder',
                      )
                    "
                  />
                </a-form-item>
                <template v-else>
                  <a-form-item
                    name="appCert"
                    :label="$t('system.mobileApp.fields.appCert')"
                  >
                    <a-upload
                      v-if="!formDataMap[item.platform]!.alipayMini!.appCert"
                      :disabled="!isEditing"
                      :multiple="false"
                      :show-upload-list="false"
                      accept=".crt"
                      :before-upload="() => false"
                      @change="
                        (info: any) =>
                          handleCertUpload(item.platform, 'appCert', info)
                      "
                    >
                      <a-button :disabled="!isEditing">
                        <template #icon>
                          <IconifyIcon
                            icon="ant-design:upload-outlined"
                            class="text-lg"
                          />
                        </template>
                        {{ $t('system.mobileApp.fields.uploadAppCert') }}
                      </a-button>
                    </a-upload>
                    <a-tooltip
                      v-else
                      :title="
                        truncateContent(
                          formDataMap[item.platform]!.alipayMini!.appCert ||
                            '',
                        )
                      "
                      placement="top"
                      :mouse-enter-delay="0.3"
                    >
                      <a-input value="appCert.crt" disabled>
                        <template #suffix>
                          <span
                            v-if="isEditing"
                            class="cursor-pointer text-gray-400"
                            @click="
                              formDataMap[item.platform]!.alipayMini!.appCert =
                                ''
                            "
                          >
                            <IconifyIcon
                              icon="ant-design:close-circle-outlined"
                              class="text-lg"
                            />
                          </span>
                        </template>
                      </a-input>
                    </a-tooltip>
                  </a-form-item>
                  <a-form-item
                    name="alipayCert"
                    :label="$t('system.mobileApp.fields.alipayCert')"
                  >
                    <a-upload
                      v-if="!formDataMap[item.platform]!.alipayMini!.alipayCert"
                      :disabled="!isEditing"
                      :multiple="false"
                      :show-upload-list="false"
                      accept=".crt"
                      :before-upload="() => false"
                      @change="
                        (info: any) =>
                          handleCertUpload(item.platform, 'alipayCert', info)
                      "
                    >
                      <a-button :disabled="!isEditing">
                        <template #icon>
                          <IconifyIcon
                            icon="ant-design:upload-outlined"
                            class="text-lg"
                          />
                        </template>
                        {{ $t('system.mobileApp.fields.uploadAlipayCert') }}
                      </a-button>
                    </a-upload>
                    <a-tooltip
                      v-else
                      :title="
                        truncateContent(
                          formDataMap[item.platform]!.alipayMini!.alipayCert ||
                            '',
                        )
                      "
                      placement="top"
                      :mouse-enter-delay="0.3"
                    >
                      <a-input value="alipayCert.crt" disabled>
                        <template #suffix>
                          <span
                            v-if="isEditing"
                            class="cursor-pointer text-gray-400"
                            @click="
                              formDataMap[
                                item.platform
                              ]!.alipayMini!.alipayCert = ''
                            "
                          >
                            <IconifyIcon
                              icon="ant-design:close-circle-outlined"
                              class="text-lg"
                            />
                          </span>
                        </template>
                      </a-input>
                    </a-tooltip>
                  </a-form-item>
                  <a-form-item
                    name="alipayRootCert"
                    :label="$t('system.mobileApp.fields.alipayRootCert')"
                  >
                    <a-upload
                      v-if="
                        !formDataMap[item.platform]!.alipayMini!.alipayRootCert
                      "
                      :disabled="!isEditing"
                      :multiple="false"
                      :show-upload-list="false"
                      accept=".crt"
                      :before-upload="() => false"
                      @change="
                        (info: any) =>
                          handleCertUpload(
                            item.platform,
                            'alipayRootCert',
                            info,
                          )
                      "
                    >
                      <a-button :disabled="!isEditing">
                        <template #icon>
                          <IconifyIcon
                            icon="ant-design:upload-outlined"
                            class="text-lg"
                          />
                        </template>
                        {{ $t('system.mobileApp.fields.uploadRootCert') }}
                      </a-button>
                    </a-upload>
                    <a-tooltip
                      v-else
                      :title="
                        truncateContent(
                          formDataMap[item.platform]!.alipayMini!
                            .alipayRootCert || '',
                        )
                      "
                      placement="top"
                      :mouse-enter-delay="0.3"
                    >
                      <a-input value="alipayRootCert.crt" disabled>
                        <template #suffix>
                          <span
                            v-if="isEditing"
                            class="cursor-pointer text-gray-400"
                            @click="
                              formDataMap[
                                item.platform
                              ]!.alipayMini!.alipayRootCert = ''
                            "
                          >
                            <IconifyIcon
                              icon="ant-design:close-circle-outlined"
                              class="text-lg"
                            />
                          </span>
                        </template>
                      </a-input>
                    </a-tooltip>
                  </a-form-item>
                </template>
              </template>

              <!-- 抖音小程序 -->
              <template
                v-else-if="
                  item.platform === 'dy_mini' &&
                  formDataMap[item.platform]?.dyMini
                "
              >
                <a-form-item
                  name="appId"
                  :label="$t('system.mobileApp.fields.dyAppId')"
                >
                  <a-input
                    v-model:value="formDataMap[item.platform]!.dyMini!.appId"
                    :disabled="!isEditing"
                    :placeholder="
                      $t('system.mobileApp.fields.dyAppIdPlaceholder')
                    "
                  />
                </a-form-item>
                <a-form-item
                  name="appSecret"
                  :label="$t('system.mobileApp.fields.dyAppSecret')"
                >
                  <a-input
                    v-model:value="
                      formDataMap[item.platform]!.dyMini!.appSecret
                    "
                    :disabled="!isEditing"
                    allow-clear
                    :placeholder="
                      $t(
                        'system.mobileApp.fields.dyAppSecretPlaceholder',
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
