<script lang="ts" setup>
  import type { MchAppNotifyConfigParam, MchAppNotifyConfigResult } from '#/api/payment/merchant/app-notify-config.api';

  import { onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MchAppNotifyConfigApi } from '#/api/payment/merchant/app-notify-config.api';
  import MchAppSelectorBar from '#/components/app/MchAppSelectorBar.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { useMchAppSelector } from '#/hooks/useMchAppSelector';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'MchAppNotifyConfigPage' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 顶部 appId 选择器（抽屉改为独立页）
  const {
    loading: appsLoading,
    appId,
    appName,
    hasApps,
    appOptions,
    loadApps,
    setAppId,
  } = useMchAppSelector();

  const loading = ref(false);
  const saving = ref(false);
  // 编辑模式
  const isEditing = ref(false);

  // 表单数据
  const formState = ref<MchAppNotifyConfigResult & { subscribedEventList?: string[] }>({});

  /**
   * 订阅事件选项(前缀匹配: pay→pay.*, refund→refund.*)
   */
  const eventOptions = [
    // 国际化：支付事件
    { label: $t('payment.merchant.notifyConfig.notifyConfig.eventPay'), value: 'pay' },
    // 国际化：退款事件
    { label: $t('payment.merchant.notifyConfig.notifyConfig.eventRefund'), value: 'refund' },
    // 国际化：出款事件
    { label: $t('payment.merchant.notifyConfig.notifyConfig.eventCashouts'), value: 'cashouts' },
    // 国际化：结算事件
    { label: $t('payment.merchant.notifyConfig.notifyConfig.eventSettle'), value: 'settle' },
  ];

  /**
   * 加载通知配置
   */
  async function loadConfig() {
    if (!appId.value) {
      formState.value = {};
      return;
    }
    loading.value = true;
    try {
      const { data } = await MchAppNotifyConfigApi.getByAppId(appId.value);
      const rawEvents = data?.subscribedEvents;
      formState.value = {
        ...data,
        // 逗号串转数组供勾选
        subscribedEventList: rawEvents ? rawEvents.split(',').filter(Boolean) : [],
      };
    } finally {
      loading.value = false;
    }
  }

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
        await loadConfig();
        isEditing.value = false;
      },
    });
  }

  /**
   * 保存配置
   */
  function handleSave() {
    if (!appId.value) return;
    confirm({
      title: $t('common.confirm'),
      // 国际化：确认保存通知配置？
      content: $t('payment.merchant.notifyConfig.notifyConfig.confirmSave'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        saving.value = true;
        const submitData: MchAppNotifyConfigParam = {
          appId: appId.value,
          notifyUrl: formState.value.notifyUrl,
          notifyWay: formState.value.notifyWay || 'http',
          subscribedEvents: (formState.value.subscribedEventList || []).join(','),
          status: formState.value.status,
          remark: formState.value.remark,
        };
        await MchAppNotifyConfigApi.saveOrUpdate(submitData);
        // 国际化：保存成功
        message.success($t('payment.merchant.notifyConfig.notifyConfig.saveSuccess'));
        saving.value = false;
        isEditing.value = false;
        await loadConfig();
      },
    });
  }

  watch(appId, () => {
    isEditing.value = false;
    loadConfig();
  });

  onMounted(async () => {
    await loadApps();
    await loadConfig();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <!-- 国际化：通知配置（与菜单一致） -->
          <span class="text-lg font-bold">{{ $t('menu.payment.merchant.notifyConfig') }}</span>
          <span v-if="appName" class="text-sm text-muted-foreground">({{ appName }})</span>
        </div>
      </template>

      <template #extra>
        <div v-if="appId" class="flex gap-2">
          <template v-if="!isEditing">
            <a-button
              v-if="hasPermission(PermCodes.Merchant.NotifyConfig.MANAGE)"
              type="primary"
              @click="handleEdit"
            >
              {{ $t('common.edit') }}
            </a-button>
          </template>
          <template v-else>
            <a-button @click="handleCancel">{{ $t('common.cancelText') }}</a-button>
            <a-button
              v-if="hasPermission(PermCodes.Merchant.NotifyConfig.MANAGE)"
              type="primary"
              :loading="saving"
              @click="handleSave"
            >
              {{ $t('common.save') }}
            </a-button>
          </template>
        </div>
      </template>

      <MchAppSelectorBar
        :value="appId"
        :options="appOptions"
        :loading="appsLoading"
        @update:value="setAppId"
      />

      <a-empty v-if="!appsLoading && !hasApps" :description="$t('payment.merchant.app.app.emptyApps')" />

      <a-spin v-else-if="appId" :spinning="loading || appsLoading">
        <div class="notify-form-container">
          <div class="mb-6">
            <a-alert type="info" show-icon>
              <template #message>
                <!-- 国际化：通知配置说明 -->
                {{ $t('payment.merchant.notifyConfig.notifyConfig.infoBanner') }}
              </template>
            </a-alert>
          </div>

          <a-form layout="vertical" class="module-form">
            <!-- 国际化：回调地址 -->
            <a-form-item
              :label="$t('payment.merchant.notifyConfig.notifyConfig.notifyUrl')"
              :tooltip="$t('payment.merchant.notifyConfig.notifyConfig.notifyUrlTooltip')"
            >
              <a-input
                v-model:value="formState.notifyUrl"
                :placeholder="$t('payment.merchant.notifyConfig.notifyConfig.notifyUrlPlaceholder')"
                :disabled="!isEditing"
                allow-clear
              >
                <template #prefix>
                  <IconifyIcon icon="ant-design:link-outlined" />
                </template>
              </a-input>
            </a-form-item>

            <!-- 国际化：通知方式 -->
            <a-form-item :label="$t('payment.merchant.notifyConfig.notifyConfig.notifyWay')">
              <a-tag color="processing">HTTP</a-tag>
              <span class="ml-2 text-xs text-muted-foreground">
                {{ $t('payment.merchant.notifyConfig.notifyConfig.notifyWayHint') }}
              </span>
            </a-form-item>

            <!-- 国际化：订阅事件 -->
            <a-form-item
              :label="$t('payment.merchant.notifyConfig.notifyConfig.subscribedEvents')"
              :tooltip="$t('payment.merchant.notifyConfig.notifyConfig.subscribedEventsTooltip')"
            >
              <a-checkbox-group
                v-model:value="formState.subscribedEventList"
                :disabled="!isEditing"
                :options="eventOptions"
              />
            </a-form-item>

            <!-- 国际化：启用状态 -->
            <a-form-item :label="$t('payment.merchant.notifyConfig.notifyConfig.status')">
              <a-switch
                v-model:checked="formState.status"
                :disabled="!isEditing"
                :checked-children="$t('payment.merchant.notifyConfig.notifyConfig.statusEnable')"
                :un-checked-children="$t('payment.merchant.notifyConfig.notifyConfig.statusDisable')"
              />
            </a-form-item>

            <!-- 国际化：备注 -->
            <a-form-item :label="$t('payment.merchant.notifyConfig.notifyConfig.remark')">
              <a-textarea
                v-model:value="formState.remark"
                :placeholder="$t('payment.merchant.notifyConfig.notifyConfig.remarkPlaceholder')"
                :disabled="!isEditing"
                :rows="3"
                allow-clear
              />
            </a-form-item>
          </a-form>
        </div>
      </a-spin>

      <a-empty v-else-if="!appsLoading" :description="$t('payment.merchant.app.app.noAppSelected')" />
    </a-card>
  </div>
</template>

<style scoped>
  .module-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
