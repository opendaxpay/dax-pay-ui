<script lang="ts" setup>
  import type { ComponentPublicInstance } from 'vue';

  import { computed, onMounted, reactive, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type AlipayMiniAppConfig,
    type DyMiniAppConfig,
    MobileAppApi,
    type MobileAppParam,
    type MobileAppResult,
    type WxMiniAppConfig,
  } from '#/api/payment/mobile-app.api';
  import { useEditingGuard } from '#/hooks/useEditingGuard';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  import AlipayMiniForm from './components/AlipayMiniForm.vue';
  import { AUTH_TYPE_CERT, AUTH_TYPE_KEY } from './components/constants';
  import DyMiniForm from './components/DyMiniForm.vue';
  import PlatformEditBar from './components/PlatformEditBar.vue';
  import WxMiniForm from './components/WxMiniForm.vue';

  defineOptions({ name: 'MobileAppDetail' });

  /** 已支持强类型表单的平台 */
  const STRUCTURED_PLATFORMS = new Set(['alipay_mini', 'dy_mini', 'wx_mini']);

  /** 平台表单子组件暴露的校验能力(三个平台表单组件统一约定) */
  interface PlatformFormExpose {
    clearValidate: () => void;
    validate: () => Promise<void>;
  }

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

  // 平台页签编辑守卫(编辑中切走先确认放弃未保存修改, 确认后经 watch 退出编辑并重载该端数据)
  const { guardTabChange } = useEditingGuard(activePlatform, {
    isEditing: () => isEditing.value,
  });
  // 各平台表单子组件实例
  const formRefMap = reactive<Record<string, PlatformFormExpose>>({});

  // 各端支持的平台: disabled 表示暂不可用(灰显)
  const PLATFORMS_BY_APP_TYPE: Record<string, { disabled?: boolean; platform: string }[]> = {
    admin: [
      { platform: 'wx_mini' },
      { platform: 'alipay_mini' },
      { platform: 'dy_mini' },
      { platform: 'android', disabled: true },
      { platform: 'ios', disabled: true },
    ],
    // 收银台仅三小程序; 无 H5/APP
    cashier: [{ platform: 'wx_mini' }, { platform: 'alipay_mini' }, { platform: 'dy_mini' }],
    // 商户端
    merchant: [
      { platform: 'wx_mini' },
      { platform: 'alipay_mini' },
      { platform: 'dy_mini' },
      { platform: 'android', disabled: true },
      { platform: 'ios', disabled: true },
    ],
  };

  const platformItems = computed(() => PLATFORMS_BY_APP_TYPE[appType.value] || []);
  const platforms = computed(() => platformItems.value.map((item) => item.platform));

  // 各平台外壳表单(含嵌套配置)
  const formDataMap = reactive<Record<string, MobileAppParam>>({});
  // 嵌套配置快照(用于敏感字段 diffForm)
  const originalNestedMap = reactive<Record<string, AlipayMiniAppConfig | DyMiniAppConfig | WxMiniAppConfig>>({});

  const appTitle = computed(() => {
    if (appType.value) {
      return $t(`payment.mobileApp.card.${appType.value}.name`);
    }
    return $t('payment.mobileApp.detail.notSupportedAppType');
  });

  /**
   * 判断平台是否暂不可用
   */
  function isPlatformDisabled(platform: string): boolean {
    return platformItems.value.find((item) => item.platform === platform)?.disabled === true;
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
    switch (platform) {
      case 'alipay_mini': {
        base.alipayMini = emptyAlipayMini();

        break;
      }
      case 'dy_mini': {
        base.dyMini = emptyDyMini();

        break;
      }
      case 'wx_mini': {
        base.wxMini = emptyWxMini();

        break;
      }
      // No default
    }
    return base;
  }

  /**
   * 当前平台嵌套配置(表单 model)
   */
  function nestedOf(platform: string): AlipayMiniAppConfig | DyMiniAppConfig | undefined | WxMiniAppConfig {
    const form = formDataMap[platform];
    if (!form) return undefined;
    if (platform === 'wx_mini') return form.wxMini;
    if (platform === 'alipay_mini') return form.alipayMini;
    if (platform === 'dy_mini') return form.dyMini;
    return undefined;
  }

  // 表单 ref 回调缓存
  const formRefBinders: Record<string, (el: ComponentPublicInstance | Element | null) => void> = {};

  /**
   * 获取/创建某平台的稳定 form ref 绑定回调
   */
  function bindFormRef(platform: string) {
    if (!formRefBinders[platform]) {
      formRefBinders[platform] = (el) => {
        if (el) {
          // 模板 ref 收到子组件实例, 三个平台表单组件均 expose 约定的 validate/clearValidate
          formRefMap[platform] = el as unknown as PlatformFormExpose;
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
  function getActiveFormRef(): PlatformFormExpose | undefined {
    return formRefMap[activePlatform.value];
  }

  /**
   * 组装提交用的嵌套配置: 非敏感字段全量, 敏感字段仅 diff 有变更时写入
   */
  function buildNestedSubmit(platform: string): Pick<MobileAppParam, 'alipayMini' | 'dyMini' | 'wxMini'> {
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
          ...(sensitive.appSecret === undefined ? {} : { appSecret: sensitive.appSecret }),
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
          ...(sensitive.privateKey === undefined ? {} : { privateKey: sensitive.privateKey }),
          ...(sensitive.alipayPublicKey === undefined ? {} : { alipayPublicKey: sensitive.alipayPublicKey }),
          ...(sensitive.appCert === undefined ? {} : { appCert: sensitive.appCert }),
          ...(sensitive.alipayCert === undefined ? {} : { alipayCert: sensitive.alipayCert }),
          ...(sensitive.alipayRootCert === undefined ? {} : { alipayRootCert: sensitive.alipayRootCert }),
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
          ...(sensitive.appSecret === undefined ? {} : { appSecret: sensitive.appSecret }),
        },
      };
    }

    return {};
  }

  /**
   * 从接口结果填充表单嵌套
   */
  function applyResultNested(platform: string, item: MobileAppResult) {
    const form = formDataMap[platform];
    if (!form) return;
    switch (platform) {
      case 'alipay_mini': {
        form.alipayMini = {
          ...emptyAlipayMini(),
          ...item.alipayMini,
          authType: item.alipayMini?.authType === AUTH_TYPE_CERT ? AUTH_TYPE_CERT : AUTH_TYPE_KEY,
        };
        originalNestedMap[platform] = { ...form.alipayMini };

        break;
      }
      case 'dy_mini': {
        form.dyMini = {
          ...emptyDyMini(),
          ...item.dyMini,
        };
        originalNestedMap[platform] = { ...form.dyMini };

        break;
      }
      case 'wx_mini': {
        form.wxMini = {
          ...emptyWxMini(),
          ...item.wxMini,
        };
        originalNestedMap[platform] = { ...form.wxMini };

        break;
      }
      // No default
    }
  }

  /**
   * 加载该端所有平台配置
   */
  async function loadData(keepPlatform = false) {
    if (!appType.value || platforms.value.length === 0) return;
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
          form.id = item.id ?? undefined;
          form.notifyConfig = item.notifyConfig;
          form.bindingEnabled = item.bindingEnabled;
          form.enabled = item.enabled;
          form.remark = item.remark;
          applyResultNested(item.platform, item);
        }
      }
      if (!keepPlatform || !activePlatform.value) {
        const firstEnabled = platformItems.value.find((item) => !item.disabled);
        activePlatform.value = firstEnabled?.platform || platforms.value[0] || '';
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

    const nestedSubmit = isStructuredPlatform(platform) ? buildNestedSubmit(platform) : {};

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
          message.success($t('payment.mobileApp.detail.saveSuccess'));
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

  // 平台页签切换(a-tabs 受控, 经编辑守卫: 取消则停留在当前页签继续编辑)
  function handlePlatformChange(key: number | string) {
    guardTabChange(String(key), (next) => {
      activePlatform.value = next;
    });
  }

  // 切页签确认放弃后走到这里: 退出编辑并重载新页签的该端数据
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
              <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
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
          :message="$t('payment.mobileApp.detail.cashierLimitTitle')"
          :description="$t('payment.mobileApp.detail.cashierLimitDesc')"
        />

        <a-tabs :active-key="activePlatform" @change="handlePlatformChange">
          <template #rightExtra>
            <!-- 页签右侧编辑操作条 -->
            <PlatformEditBar
              :editing="isEditing"
              :saving="saving"
              :disabled="isPlatformDisabled(activePlatform)"
              @edit="handleEdit"
              @cancel="handleCancel"
              @save="handleSave"
            />
          </template>

          <a-tab-pane v-for="item in platformItems" :key="item.platform" :disabled="item.disabled">
            <template #tab>
              <span :class="{ 'opacity-50': item.disabled }">
                {{ $t(`payment.mobileApp.platformNames.${item.platform}`) }}
                <a-tag v-if="item.disabled" color="orange" class="ml-1" style="font-size: 11px; line-height: 18px">
                  {{ $t('payment.mobileApp.card.comingSoon') }}
                </a-tag>
              </span>
            </template>

            <a-empty v-if="item.disabled" :description="$t('payment.mobileApp.detail.platformComingSoon')" />

            <!-- 微信小程序表单 -->
            <WxMiniForm
              v-else-if="item.platform === 'wx_mini' && formDataMap[item.platform]?.wxMini"
              :ref="bindFormRef(item.platform)"
              :wx-mini="formDataMap[item.platform]!.wxMini!"
              :disabled="!isEditing"
            />
            <!-- 支付宝小程序表单 -->
            <AlipayMiniForm
              v-else-if="item.platform === 'alipay_mini' && formDataMap[item.platform]?.alipayMini"
              :ref="bindFormRef(item.platform)"
              :alipay-mini="formDataMap[item.platform]!.alipayMini!"
              :disabled="!isEditing"
            />
            <!-- 抖音小程序表单 -->
            <DyMiniForm
              v-else-if="item.platform === 'dy_mini' && formDataMap[item.platform]?.dyMini"
              :ref="bindFormRef(item.platform)"
              :dy-mini="formDataMap[item.platform]!.dyMini!"
              :disabled="!isEditing"
            />
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </a-card>
  </div>
</template>
