<script lang="ts" setup>
  import type { MchAppNotifyConfigParam, MchAppNotifyConfigResult } from '#/api/payment/merchant/app-notify-config.api';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MchAppNotifyConfigApi } from '#/api/payment/merchant/app-notify-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'MchAppNotifyConfig' });

  const props = defineProps<{
    appId?: string;
    appName?: string;
    visible: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', visible: boolean): void;
  }>();

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const saving = ref(false);
  // 编辑模式
  const isEditing = ref(false);

  // 表单数据
  const formState = ref<MchAppNotifyConfigResult & { subscribedEventList?: string[] }>({});

  /**
   * 抽屉标题
   */
  const drawerTitle = computed(() => {
    const title = $t('payment.merchant.notifyConfig.notifyConfig.title');
    return props.appName ? `${title} (${props.appName})` : title;
  });

  /**
   * 订阅事件选项(前缀匹配: pay→pay.*, refund→refund.*)
   */
  const eventOptions = computed(() => [
    { label: $t('payment.merchant.notifyConfig.notifyConfig.eventPay'), value: 'pay' },
    { label: $t('payment.merchant.notifyConfig.notifyConfig.eventRefund'), value: 'refund' },
    { label: $t('payment.merchant.notifyConfig.notifyConfig.eventCashouts'), value: 'cashouts' },
    { label: $t('payment.merchant.notifyConfig.notifyConfig.eventSettle'), value: 'settle' },
  ]);

  /**
   * 加载通知配置
   */
  async function loadConfig() {
    if (!props.appId) return;
    loading.value = true;
    try {
      const { data } = await MchAppNotifyConfigApi.getByAppId(props.appId);
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
    confirm({
      title: $t('common.confirm'),
      content: $t('payment.merchant.notifyConfig.notifyConfig.confirmSave'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        saving.value = true;
        const submitData: MchAppNotifyConfigParam = {
          appId: props.appId!,
          notifyUrl: formState.value.notifyUrl,
          notifyWay: formState.value.notifyWay || 'http',
          subscribedEvents: (formState.value.subscribedEventList || []).join(','),
          status: formState.value.status,
          remark: formState.value.remark,
        };
        await MchAppNotifyConfigApi.saveOrUpdate(submitData);
        message.success($t('payment.merchant.notifyConfig.notifyConfig.saveSuccess'));
        saving.value = false;
        isEditing.value = false;
        await loadConfig();
      },
    });
  }

  /**
   * 抽屉打开时加载数据
   */
  watch(
    () => props.visible,
    (val) => {
      if (val && props.appId) {
        isEditing.value = false;
        loadConfig();
      }
    },
  );
</script>

<template>
  <a-drawer
    :open="visible"
    :title="drawerTitle"
    size="large"
    :destroy-on-hidden="true"
    @update:open="(v: boolean) => emit('update:visible', v)"
  >
    <a-spin :spinning="loading">
      <div class="notify-form-container">
        <!-- 信息提示 -->
        <div class="info-banner">
          <IconifyIcon icon="ant-design:info-circle-filled" />
          <!-- 国际化：通知配置用于接收平台推送的业务事件，请填写可公网访问的 https 回调地址 -->
          <span>{{ $t('payment.merchant.notifyConfig.notifyConfig.infoBanner') }}</span>
        </div>

        <a-form layout="vertical" class="module-form">
          <!-- 回调地址 -->
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

          <!-- 通知方式(第一版固定HTTP异步回调, 只读) -->
          <!-- 国际化：通知方式 -->
          <a-form-item :label="$t('payment.merchant.notifyConfig.notifyConfig.notifyWay')">
            <a-tag color="processing">HTTP</a-tag>
            <span class="ml-2 text-xs text-muted-foreground">
              {{ $t('payment.merchant.notifyConfig.notifyConfig.notifyWayHint') }}
            </span>
          </a-form-item>

          <!-- 订阅事件 -->
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

          <!-- 启用状态 -->
          <!-- 国际化：启用状态 -->
          <a-form-item :label="$t('payment.merchant.notifyConfig.notifyConfig.status')">
            <a-switch
              v-model:checked="formState.status"
              :disabled="!isEditing"
              :checked-children="$t('payment.merchant.notifyConfig.notifyConfig.statusEnable')"
              :un-checked-children="$t('payment.merchant.notifyConfig.notifyConfig.statusDisable')"
            />
          </a-form-item>

          <!-- 备注 -->
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

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <template v-if="!isEditing">
          <a-button @click="emit('update:visible', false)">
            {{ $t('common.close') }}
          </a-button>
          <a-button v-if="hasPermission(PermCodes.Merchant.NotifyConfig.MANAGE)" type="primary" @click="handleEdit">
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
  </a-drawer>
</template>

<style scoped lang="less">
  .module-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .info-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background-color: hsl(var(--primary) / 5%);
    border: 1px solid hsl(var(--primary) / 20%);
    border-radius: 8px;
    margin-bottom: 24px;
    color: hsl(var(--foreground));
    font-size: 13px;

    :deep(.iconify) {
      color: hsl(var(--primary));
      font-size: 18px;
    }
  }

  :deep(.ant-form-item) {
    margin-bottom: 24px;

    .ant-form-item-label {
      padding-bottom: 8px;

      label {
        font-weight: 600;
        color: hsl(var(--foreground));
      }
    }
  }
</style>
