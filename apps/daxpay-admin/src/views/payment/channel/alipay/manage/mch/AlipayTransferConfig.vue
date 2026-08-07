<script lang="ts" setup>
  import type { AlipayTransferConfig } from '#/api/payment/channel/alipay/transfer-config.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type AlipayMchApp, AlipayMchAppApi } from '#/api/payment/channel/alipay/mch-app.api';
  import { AlipayTransferConfigApi } from '#/api/payment/channel/alipay/transfer-config.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AlipayTransferConfig' });

  const { message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const editing = ref(false);

  const mchNo = ref('');
  const channelMchNo = ref('');
  // 当前已保存的转账配置
  const currentConfig = ref<AlipayTransferConfig | null>(null);
  // 编辑中的转出应用引用
  const editingAppRefId = ref<string>('');
  // 通道商户支付宝应用列表
  const mchApps = ref<AlipayMchApp[]>([]);

  /** 应用类型展示 key 映射(转账应用不限制类型, 动态展示) */
  const appTypeKeyMap: Record<string, string> = {
    mini_program: 'payment.channel.alipayMchApp.appTypeMiniProgram',
    mobile_app: 'payment.channel.alipayMchApp.appTypeMobileApp',
    web_app: 'payment.channel.alipayMchApp.appTypeWebApp',
  };

  /** 转出应用下拉选项 */
  const appSelectOptions = computed(() =>
    mchApps.value.map((app) => ({
      label: `${app.appName}（${app.aliAppId}）`,
      value: String(app.id),
    })),
  );

  /** 展示用的转出应用(编辑时用编辑中的, 否则用当前的) */
  const displayApp = computed(() => {
    const refId = editing.value ? editingAppRefId.value : currentConfig.value?.transferAppRefId;
    return mchApps.value.find((app) => String(app.id) === String(refId));
  });

  /** 应用类型文案(未知类型兜底显示原始值) */
  function getAppTypeText(type?: string) {
    const key = appTypeKeyMap[type || ''];
    return key ? $t(key) : type || '-';
  }

  /** 打开抽屉(由管理页卡片点击调用) */
  function open(no: string, mchChannelNo: string) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    visible.value = true;
    editing.value = false;
    loadData();
  }

  /** 加载转账配置 + 通道商户应用列表 */
  async function loadData() {
    loading.value = true;
    try {
      const [config, apps] = await Promise.all([
        AlipayTransferConfigApi.findByChannelMchNo(mchNo.value, channelMchNo.value),
        AlipayMchAppApi.listByChannelMchNo(mchNo.value, channelMchNo.value),
      ]);
      currentConfig.value = config.data ?? null;
      mchApps.value = apps.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  /** 开始编辑 */
  function startEdit() {
    editingAppRefId.value = currentConfig.value?.transferAppRefId ? String(currentConfig.value.transferAppRefId) : '';
    editing.value = true;
  }

  /** 保存转账配置 */
  async function saveConfig() {
    saving.value = true;
    try {
      await AlipayTransferConfigApi.save({
        mchNo: mchNo.value,
        channelMchNo: channelMchNo.value,
        transferAppRefId: editingAppRefId.value,
      });
      // 重新加载配置回显
      const { data } = await AlipayTransferConfigApi.findByChannelMchNo(mchNo.value, channelMchNo.value);
      currentConfig.value = data;
      editing.value = false;
      // 国际化：保存成功
      message.success($t('common.saveSuccess'));
    } finally {
      saving.value = false;
    }
  }

  defineExpose({ open });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.merchant.channelMerchant.cardTransferApp')"
    :width="720"
    :styles="{ footer: { textAlign: 'right' } }"
    destroy-on-hidden
  >
    <a-spin :spinning="loading || saving">
      <!-- 提示条 -->
      <div class="mb-6">
        <a-alert type="info" banner :message="$t('payment.merchant.channelMerchant.transferConfigTipDesc')" />
      </div>

      <!-- 转出应用(查看时禁用, 编辑时可选) -->
      <div class="mb-8">
        <a-form layout="vertical">
          <a-form-item :label="$t('payment.merchant.channelMerchant.transferApp')">
            <a-select
              :value="
                editing
                  ? editingAppRefId
                  : currentConfig?.transferAppRefId
                    ? String(currentConfig.transferAppRefId)
                    : ''
              "
              :disabled="!editing"
              :options="appSelectOptions"
              :placeholder="$t('payment.merchant.channelMerchant.transferAppPlaceholder')"
              size="large"
              @update:value="editingAppRefId = $event"
            />
          </a-form-item>
        </a-form>
      </div>

      <!-- 当前转出应用信息(选中后回显) -->
      <div v-if="displayApp" class="mb-8">
        <a-descriptions :column="1" :bordered="true" size="small">
          <a-descriptions-item :label="$t('payment.channel.alipayMchApp.appName')">
            {{ displayApp.appName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.channel.alipayMchApp.aliAppId')">
            {{ displayApp.aliAppId }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.channel.alipayMchApp.appType')">
            <a-tag color="green">{{ getAppTypeText(displayApp.appType) }}</a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <!-- 未配置且非编辑模式 -->
      <div v-if="!currentConfig?.transferAppRefId && !editing" class="flex flex-col items-center justify-center py-16">
        <div class="text-base text-muted-foreground">
          {{ $t('payment.merchant.channelMerchant.transferAppNotConfigured') }}
        </div>
      </div>
    </a-spin>

    <template #footer>
      <a-space>
        <template v-if="editing">
          <a-button @click="editing = false">
            {{ $t('common.cancel') }}
          </a-button>
          <a-button type="primary" :loading="saving" @click="saveConfig">
            {{ $t('common.save') }}
          </a-button>
        </template>
        <a-button v-else type="primary" @click="startEdit">
          {{ $t('common.edit') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
