<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    type MobileAppParam,
    MobileAppApi,
  } from '#/api/payment/config/mobile-app.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'MobileAppDetail' });

  const route = useRoute();
  const router = useRouter();
  const { message } = useMessage();

  const appType = ref((route.params.appType as string) || '');
  const loading = ref(false);
  const activePlatform = ref('');
  const saving = ref(false);

  // 各端支持的平台(收银台无H5和APP)
  const PLATFORMS_BY_APP_TYPE: Record<string, string[]> = {
    admin: ['wx_h5', 'wx_mini', 'alipay_mini', 'dy_mini', 'android', 'ios'],
    cashier: ['wx_mini', 'alipay_mini', 'dy_mini'],
    merchant: ['wx_h5', 'wx_mini', 'alipay_mini', 'dy_mini', 'android', 'ios'],
  };

  const platforms = computed(() => PLATFORMS_BY_APP_TYPE[appType.value] || []);

  // 各平台表单数据(platform -> formData)
  const formDataMap = reactive<Record<string, MobileAppParam>>({});

  // 端标题
  const appTitle = computed(() => {
    if (appType.value) {
      return $t(`payment.config.mobileApp.card.${appType.value}.name`);
    }
    return $t('payment.config.mobileApp.detail.notSupportedAppType');
  });

  /**
   * 初始化某平台的空表单
   */
  function initForm(platform: string): MobileAppParam {
    return {
      appType: appType.value,
      platform,
      appName: '',
      appConfig: '',
      bindingEnabled: false,
      enabled: true,
      notifyConfig: '',
      remark: '',
    };
  }

  /**
   * 加载该端所有平台配置
   */
  async function loadData() {
    if (!appType.value || !platforms.value.length) return;
    loading.value = true;
    try {
      // 初始化所有平台为空表单
      for (const p of platforms.value) {
        formDataMap[p] = initForm(p);
      }
      // 用后端数据填充已存在的配置
      const { data } = await MobileAppApi.listByAppType(appType.value);
      for (const item of data || []) {
        if (item.platform && formDataMap[item.platform]) {
          Object.assign(formDataMap[item.platform]!, item);
        }
      }
      activePlatform.value = platforms.value[0]!;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 保存当前平台配置
   */
  async function handleSave() {
    const form = formDataMap[activePlatform.value];
    if (!form) return;
    saving.value = true;
    try {
      await MobileAppApi.save(form);
      message.success($t('payment.config.mobileApp.detail.saveSuccess'));
      await loadData();
    } finally {
      saving.value = false;
    }
  }

  /**
   * 返回卡片页
   */
  function handleBack() {
    router.push({ path: '/payment/config/mobile-app' });
  }

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
          <a-tab-pane
            v-for="p in platforms"
            :key="p"
            :tab="$t(`payment.config.mobileApp.platformNames.${p}`)"
          >
            <a-form
              v-if="formDataMap[p]"
              :model="formDataMap[p]"
              layout="vertical"
              class="max-w-2xl"
            >
              <a-form-item :label="$t('payment.config.mobileApp.detail.appName')">
                <a-input
                  v-model:value="formDataMap[p]!.appName"
                  :placeholder="
                    $t('payment.config.mobileApp.detail.appNamePlaceholder')
                  "
                />
              </a-form-item>

              <a-form-item
                :label="$t('payment.config.mobileApp.detail.appConfig')"
              >
                <a-textarea
                  v-model:value="formDataMap[p]!.appConfig"
                  :rows="6"
                  :placeholder="
                    $t('payment.config.mobileApp.detail.appConfigPlaceholder')
                  "
                />
              </a-form-item>

              <a-form-item
                :label="$t('payment.config.mobileApp.detail.notifyConfig')"
              >
                <a-textarea
                  v-model:value="formDataMap[p]!.notifyConfig"
                  :rows="4"
                  :placeholder="
                    $t('payment.config.mobileApp.detail.notifyConfigPlaceholder')
                  "
                />
              </a-form-item>

              <a-form-item>
                <template #label>
                  {{ $t('payment.config.mobileApp.detail.bindingEnabled') }}
                </template>
                <a-switch v-model:checked="formDataMap[p]!.bindingEnabled" />
              </a-form-item>

              <a-form-item>
                <template #label>
                  {{ $t('payment.config.mobileApp.detail.enabled') }}
                </template>
                <a-switch v-model:checked="formDataMap[p]!.enabled" />
              </a-form-item>

              <a-form-item :label="$t('payment.config.mobileApp.detail.remark')">
                <a-textarea
                  v-model:value="formDataMap[p]!.remark"
                  :rows="2"
                  :placeholder="
                    $t('payment.config.mobileApp.detail.remarkPlaceholder')
                  "
                />
              </a-form-item>

              <a-form-item>
                <a-button
                  type="primary"
                  :loading="saving"
                  @click="handleSave"
                >
                  {{ $t('payment.config.mobileApp.detail.save') }}
                </a-button>
              </a-form-item>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </a-card>
  </div>
</template>
