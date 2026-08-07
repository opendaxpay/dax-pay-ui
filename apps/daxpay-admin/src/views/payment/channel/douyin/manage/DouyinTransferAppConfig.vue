<script lang="ts" setup>
  import type { DyMchApp } from '#/api/payment/douyin/mch-app.api';
  import type { DouyinTransferConfig } from '#/api/payment/douyin/transfer-config.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { DyMchAppApi } from '#/api/payment/douyin/mch-app.api';
  import { DouyinTransferConfigApi } from '#/api/payment/douyin/transfer-config.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'DouyinTransferAppConfig' });

  const { message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const editing = ref(false);

  const mchNo = ref('');
  const channelMchNo = ref('');
  // 当前已保存的转账配置
  const currentConfig = ref<DouyinTransferConfig | null>(null);
  // 编辑中的转账发起应用引用
  const editingAppRefId = ref<string>('');
  // 商户网站应用列表(仅网站应用支持手机H5获取OpenId, 可作转账发起应用)
  const webApps = ref<DyMchApp[]>([]);

  /** 展示用的发起应用(编辑时用编辑中的, 否则用当前的) */
  const displayApp = computed(() => {
    const refId = editing.value ? editingAppRefId.value : currentConfig.value?.transferAppRefId;
    return webApps.value.find((app) => String(app.id) === String(refId));
  });

  /** 发起应用下拉选项(仅网站应用) */
  const appSelectOptions = computed(() =>
    webApps.value.map((app) => ({
      label: `${app.appName}（${app.douyinAppId}）`,
      value: String(app.id),
    })),
  );

  /** 打开抽屉(由管理页卡片点击调用) */
  function open(no: string, mchChannelNo: string) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    visible.value = true;
    editing.value = false;
    loadData();
  }

  /** 加载转账配置 + 商户网站应用列表 */
  function loadData() {
    loading.value = true;
    // 转账配置(未配置返回 null)
    DouyinTransferConfigApi.findByChannelMchNo(mchNo.value, channelMchNo.value)
      .then(({ data }) => {
        currentConfig.value = data;
      })
      .catch(() => {
        currentConfig.value = null;
      });
    // 网站应用列表(仅 web_app 支持手机H5获取OpenId)
    DyMchAppApi.listByMchNo(mchNo.value)
      .then(({ data }) => {
        webApps.value = (data || []).filter((app) => app.appType === 'web_app');
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 开始编辑 */
  function startEdit() {
    editingAppRefId.value = currentConfig.value?.transferAppRefId ? String(currentConfig.value.transferAppRefId) : '';
    editing.value = true;
  }

  /** 保存转账配置 */
  async function saveConfig() {
    saving.value = true;
    // 保存期间整页 loading
    loading.value = true;
    try {
      await DouyinTransferConfigApi.save({
        mchNo: mchNo.value,
        channelMchNo: channelMchNo.value,
        transferAppRefId: editingAppRefId.value || undefined,
      });
      // 重新加载配置回显
      const { data } = await DouyinTransferConfigApi.findByChannelMchNo(mchNo.value, channelMchNo.value);
      currentConfig.value = data;
      editing.value = false;
      // 国际化：保存成功
      message.success($t('common.saveSuccess'));
    } finally {
      loading.value = false;
      saving.value = false;
    }
  }

  defineExpose({ open });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.channel.douyinManage.cardTransferAppConfig')"
    :width="720"
    :styles="{ footer: { textAlign: 'right' } }"
    destroy-on-hidden
  >
    <a-spin :spinning="loading">
      <!-- 提示条: 转账发起应用说明 -->
      <div class="mb-6">
        <a-alert type="info" banner :message="$t('payment.channel.douyinManage.transferAppTip')" />
      </div>

      <!-- 配置区(查看时禁用, 编辑时可选) -->
      <div class="mb-8">
        <a-form layout="vertical">
          <a-form-item :label="$t('payment.channel.douyinManage.transferApp')">
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
              :placeholder="$t('payment.channel.douyinManage.transferAppPlaceholder')"
              :allow-clear="editing"
              size="large"
              @update:value="editingAppRefId = $event"
            />
          </a-form-item>
        </a-form>
      </div>

      <!-- 当前发起应用信息 -->
      <div v-if="displayApp" class="mb-8">
        <a-descriptions :column="1" :bordered="true" size="small">
          <a-descriptions-item :label="$t('payment.douyin.app.appName')">
            {{ displayApp.appName }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.douyin.app.douyinAppId')">
            {{ displayApp.douyinAppId }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('payment.douyin.app.appType')">
            <a-tag color="green">{{ $t('payment.douyin.app.appTypeWebApp') }}</a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <!-- 未配置且非编辑模式 -->
      <div v-if="!currentConfig?.transferAppRefId && !editing" class="flex flex-col items-center justify-center py-16">
        <IconifyIcon icon="ant-design:exclamation-circle-outlined" class="mb-4 text-5xl text-warning" />
        <div class="text-base text-muted-foreground">
          {{ $t('payment.channel.douyinManage.transferAppNotConfigured') }}
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
