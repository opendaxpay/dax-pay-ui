<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { AppDeviceConfigApi, type AppDeviceConfigParam } from '#/api/payment/device/app-device-config.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'MchAppDeviceConfigModal' });

  const { message } = useMessage();
  const { hasPermission } = usePermission();
  const { visible, confirmLoading, handleCancel } = useFormEdit();

  // 当前应用(由工作台磁贴传入, 配置读写只依赖业务 appId)
  const appId = ref('');
  const appName = ref('');

  // 加载失败: 禁止保存, 避免以默认值覆盖服务端已有配置
  const loadError = ref(false);

  const canManage = computed(() => hasPermission(PermCodes.Merchant.App.MANAGE));

  // 收款播报简版配置(播报/打印开关 + 门店订单严格匹配 + 内置版式)
  const form = ref<AppDeviceConfigParam>({
    appId: '',
    broadcastEnable: false,
    printEnable: false,
    storeStrictMatch: false,
    templateCode: 'standard',
  });

  // 打印版式下拉(内置枚举, 首期仅标准小票)
  const templateOptions = computed(() => [
    { label: $t('payment.device.virtual.appConfig.templateStandard'), value: 'standard' },
  ]);

  // 门店订单严格匹配的完整说明(正文只留一行短句, 详情收进问号提示)
  const storeStrictTooltip = computed(() => $t('payment.device.virtual.appConfig.storeStrictHintFull'));

  /**
   * 打开弹窗并加载配置
   */
  function show(params: { appId: string; appName?: string }) {
    appId.value = params.appId;
    appName.value = params.appName || '';
    loadError.value = false;
    form.value = {
      appId: params.appId,
      broadcastEnable: false,
      printEnable: false,
      storeStrictMatch: false,
      templateCode: 'standard',
    };
    visible.value = true;
    loadConfig();
  }

  /**
   * 加载应用收款播报配置
   */
  async function loadConfig() {
    if (!appId.value) {
      return;
    }
    confirmLoading.value = true;
    loadError.value = false;
    try {
      const { data } = await AppDeviceConfigApi.simpleGet(appId.value);
      form.value = {
        appId: appId.value,
        broadcastEnable: !!data?.broadcastEnable,
        printEnable: !!data?.printEnable,
        storeStrictMatch: !!data?.storeStrictMatch,
        templateCode: data?.templateCode || 'standard',
      };
      appName.value = data?.appName || appName.value;
    } catch {
      // 加载失败不做默认值兜底: 保持错误态并禁止保存, 否则保存会覆盖服务端配置
      loadError.value = true;
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 保存收款播报配置(独立保存, 与应用信息编辑解耦)
   */
  async function handleOk() {
    if (!appId.value || loadError.value) {
      return;
    }
    confirmLoading.value = true;
    try {
      await AppDeviceConfigApi.simpleSave({ ...form.value, appId: appId.value });
      message.success($t('common.operationSuccess'));
      handleCancel();
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show });
</script>

<template>
  <a-modal v-model:open="visible" :width="520" :mask-closable="false" :destroy-on-hidden="true" @cancel="handleCancel">
    <template #title>
      <span>{{ $t('payment.device.virtual.appConfig.title') }}</span>
      <span v-if="appName" class="modal-app-name">{{ appName }}</span>
    </template>

    <a-spin :spinning="confirmLoading">
      <!-- 加载失败: 明确提示并禁止保存 -->
      <div v-if="loadError" class="modal-alert">
        <a-alert type="error" show-icon :message="$t('common.loadFailed')" />
      </div>

      <!-- 配置项分组: 播报与打印 / 订单匹配 / 打印版式 -->
      <div class="config-group">
        <div class="config-card">
          <!-- 语音播报 -->
          <div class="config-row">
            <div class="config-row__main">
              <div class="config-row__label">{{ $t('payment.device.virtual.appConfig.broadcast') }}</div>
              <div class="config-row__desc">{{ $t('payment.device.virtual.appConfig.broadcastHint') }}</div>
            </div>
            <a-switch v-model:checked="form.broadcastEnable" :disabled="!canManage" />
          </div>
          <div class="config-row__divider"></div>
          <!-- 小票打印 -->
          <div class="config-row">
            <div class="config-row__main">
              <div class="config-row__label">{{ $t('payment.device.virtual.appConfig.print') }}</div>
              <div class="config-row__desc">{{ $t('payment.device.virtual.appConfig.printHint') }}</div>
            </div>
            <a-switch v-model:checked="form.printEnable" :disabled="!canManage" />
          </div>
        </div>

        <div class="config-card">
          <!-- 门店订单严格匹配(完整说明收进问号提示) -->
          <div class="config-row">
            <div class="config-row__main">
              <div class="config-row__label">
                {{ $t('payment.device.virtual.appConfig.storeStrict') }}
                <a-tooltip :title="storeStrictTooltip">
                  <IconifyIcon
                    icon="ant-design:question-circle-outlined"
                    class="config-row__help"
                    :aria-label="$t('payment.device.virtual.appConfig.storeStrictHintFull')"
                  />
                </a-tooltip>
              </div>
              <div class="config-row__desc">
                {{ $t('payment.device.virtual.appConfig.storeStrictHint') }}
              </div>
            </div>
            <a-switch v-model:checked="form.storeStrictMatch" :disabled="!canManage" />
          </div>
        </div>

        <div class="config-card">
          <!-- 打印版式(内置枚举) -->
          <div class="config-row">
            <div class="config-row__main">
              <div class="config-row__label">{{ $t('payment.device.virtual.appConfig.template') }}</div>
            </div>
            <a-select
              v-model:value="form.templateCode"
              :options="templateOptions"
              :disabled="!canManage"
              class="config-row__select"
            />
          </div>
        </div>
      </div>
    </a-spin>

    <template #footer>
      <a-space :size="8">
        <a-button @click="handleCancel">{{ canManage ? $t('common.cancel') : $t('common.close') }}</a-button>
        <a-button v-if="canManage" type="primary" :loading="confirmLoading" :disabled="loadError" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<style scoped>
  /* 弹窗副标题: 当前应用名 */
  .modal-app-name {
    margin-left: 8px;
    font-size: 12px;
    font-weight: 400;
    color: hsl(var(--muted-foreground));
  }

  .modal-alert {
    margin-bottom: 16px;
  }

  /* 配置项分组: 卡片承载同域配置, 行间 1px 分隔 */
  .config-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .config-card {
    overflow: hidden;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 10px;
  }

  .config-row {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
  }

  .config-row__main {
    flex: 1;
    min-width: 0;
  }

  .config-row__label {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: hsl(var(--foreground));
  }

  .config-row__desc {
    margin-top: 3px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .config-row__help {
    color: hsl(var(--muted-foreground));
    cursor: pointer;
  }

  .config-row__divider {
    height: 1px;
    background: hsl(var(--border));
  }

  .config-row__select {
    width: 160px;
  }
</style>
