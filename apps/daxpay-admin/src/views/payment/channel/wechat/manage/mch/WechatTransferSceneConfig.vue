<script lang="ts" setup>
  import type { WechatTransferSceneOption } from '#/api/payment/channel/wechat/channel-merchant.api';
  import type { WechatTransferConfig } from '#/api/payment/channel/wechat/transfer-config.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { WechatDirectChannelMerchantApi } from '#/api/payment/channel/wechat/channel-merchant.api';
  import { WechatTransferConfigApi } from '#/api/payment/channel/wechat/transfer-config.api';
  import { type WxMchApp, WxMchAppApi } from '#/api/payment/wx/mch-app.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'WechatTransferSceneConfig' });

  const { message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const editing = ref(false);

  const mchNo = ref('');
  const channelMchNo = ref('');
  // 当前已保存的配置
  const currentConfig = ref<null | WechatTransferConfig>(null);
  // 编辑中的转账场景
  const editingScene = ref('');
  // 编辑中的发起应用引用
  const editingAppRefId = ref<string>('');
  // 场景选项
  const sceneOptions = ref<WechatTransferSceneOption[]>([]);
  // 商户公众号应用列表
  const mchApps = ref<WxMchApp[]>([]);

  /** 当前场景选项(匹配 code) */
  const currentSceneCode = computed(() => currentConfig.value?.transferScene || '');
  const currentOption = computed(() => sceneOptions.value.find((s) => s.code === currentSceneCode.value));

  /** 编辑中场景选项(匹配 code) */
  const editingOption = computed(() => sceneOptions.value.find((s) => s.code === editingScene.value));

  /** 展示用的场景详情(编辑时用编辑中的, 否则用当前的) */
  const displayOption = computed(() => (editing.value ? editingOption.value : currentOption.value));

  /** 场景下拉选项 */
  const sceneSelectOptions = computed(() =>
    sceneOptions.value.map((s) => ({
      label: `${s.name}（${s.code}）`,
      value: s.code,
    })),
  );

  /** 公众号类型应用下拉选项(仅公众号可作为转账发起应用) */
  const appSelectOptions = computed(() =>
    mchApps.value
      .filter((app) => app.appType === 'official_account')
      .map((app) => ({
        label: `${app.appName}（${app.wxAppId}）`,
        value: String(app.id),
      })),
  );

  /** 报备字段说明表列配置 */
  const reportColumns = computed(() => [
    {
      title: $t('payment.channel.wechatPay.transferSceneFieldTypeName'),
      dataIndex: 'infoType',
      width: 180,
    },
    {
      title: $t('payment.channel.wechatPay.transferSceneFieldDescription'),
      dataIndex: 'description',
    },
  ]);

  /** 打开抽屉(由管理页卡片点击调用) */
  function open(no: string, mchChannelNo: string) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    visible.value = true;
    editing.value = false;
    loadData();
  }

  /** 加载场景选项 + 转账配置 + 公众号应用列表 */
  function loadData() {
    loading.value = true;
    // 场景选项
    WechatDirectChannelMerchantApi.findSceneOptions().then((res) => {
      sceneOptions.value = res.data || [];
    });
    // 公众号应用列表
    WxMchAppApi.listByMchNo(mchNo.value).then((res) => {
      mchApps.value = res.data || [];
    });
    // 转账配置
    WechatTransferConfigApi.findByChannelMchNo(mchNo.value, channelMchNo.value)
      .then(({ data }) => {
        currentConfig.value = data;
      })
      .catch(() => {
        currentConfig.value = null;
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 开始编辑 */
  function startEdit() {
    editingScene.value = currentConfig.value?.transferScene || '';
    editingAppRefId.value = currentConfig.value?.transferAppRefId ? String(currentConfig.value.transferAppRefId) : '';
    editing.value = true;
  }

  /** 保存转账配置 */
  async function saveConfig() {
    saving.value = true;
    try {
      await WechatTransferConfigApi.save({
        mchNo: mchNo.value,
        channelMchNo: channelMchNo.value,
        transferScene: editingScene.value || undefined,
        transferAppRefId: editingAppRefId.value || undefined,
      });
      // 重新加载配置回显
      const { data } = await WechatTransferConfigApi.findByChannelMchNo(mchNo.value, channelMchNo.value);
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
    :title="$t('payment.merchant.channelMerchant.cardTransferConfig')"
    :width="880"
    :styles="{ footer: { textAlign: 'right' } }"
    destroy-on-hidden
  >
    <a-spin :spinning="loading || saving">
      <!-- 提示条 -->
      <div class="mb-6">
        <a-alert type="info" banner :message="$t('payment.channel.wechatPay.transferConfigTipDesc')" />
      </div>

      <!-- 配置区(查看时禁用, 编辑时可选) -->
      <div class="mb-8">
        <a-form layout="vertical">
          <!-- 转账场景 -->
          <a-form-item :label="$t('payment.channel.wechatPay.transferScene')">
            <a-select
              :value="editing ? editingScene : currentSceneCode"
              :disabled="!editing"
              :options="sceneSelectOptions"
              :placeholder="$t('payment.channel.wechatPay.transferScenePlaceholder')"
              :allow-clear="editing"
              size="large"
              @update:value="editingScene = $event"
            />
          </a-form-item>
          <!-- 转账发起应用(仅公众号) -->
          <a-form-item
            :label="$t('payment.channel.wechatPay.transferApp')"
            :extra="$t('payment.channel.wechatPay.transferAppOfficialOnly')"
          >
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
              :placeholder="$t('payment.channel.wechatPay.transferAppPlaceholder')"
              :allow-clear="editing"
              size="large"
              @update:value="editingAppRefId = $event"
            />
          </a-form-item>
        </a-form>
      </div>

      <!-- 当前场景信息 -->
      <template v-if="displayOption">
        <!-- 用户收款感知 -->
        <div v-if="displayOption.userRecvPerceptionOptions?.length" class="mb-8">
          <div class="mb-3 flex items-center gap-2">
            <IconifyIcon icon="ant-design:eye-outlined" class="text-base text-muted-foreground" />
            <span class="text-sm font-semibold text-foreground">
              {{ $t('payment.channel.wechatPay.transferSceneUserPerception') }}
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
            <a-tag
              v-for="(perception, idx) in displayOption.userRecvPerceptionOptions"
              :key="perception"
              :color="idx === 0 ? 'green' : 'default'"
            >
              {{ perception }}
              <span v-if="idx === 0" class="ml-1 text-xs opacity-60">({{ $t('common.default') }})</span>
            </a-tag>
          </div>
          <div class="mt-2 text-xs text-muted-foreground">
            {{ $t('payment.channel.wechatPay.transferSceneUserPerceptionTip') }}
          </div>
        </div>

        <!-- 报备字段说明表 -->
        <div class="mb-8">
          <div class="mb-3 flex items-center gap-2">
            <IconifyIcon icon="ant-design:profile-outlined" class="text-base text-muted-foreground" />
            <span class="text-sm font-semibold text-foreground">
              {{ $t('payment.channel.wechatPay.transferSceneReportFields') }}
            </span>
          </div>
          <a-table
            :data-source="
              displayOption?.reportInfoTypes?.map((type, i) => ({
                key: i,
                infoType: type,
                description: displayOption?.reportInfoDescriptions?.[i] || '-',
              }))
            "
            :columns="reportColumns"
            :pagination="false"
            :bordered="true"
            size="small"
          >
            <template #bodyCell="{ column, text }">
              <template v-if="column.dataIndex === 'infoType'">
                <a-tag color="blue">{{ text }}</a-tag>
              </template>
              <template v-else-if="column.dataIndex === 'description'">
                <span class="text-sm text-foreground">{{ text }}</span>
              </template>
            </template>
          </a-table>
          <div class="mt-2 text-xs text-muted-foreground">
            {{ $t('payment.channel.wechatPay.transferSceneReportFieldsTip') }}
          </div>
        </div>
      </template>

      <!-- 未配置且非编辑模式 -->
      <div
        v-if="!currentConfig?.transferScene && !currentConfig?.transferAppRefId && !editing"
        class="flex flex-col items-center justify-center py-16"
      >
        <IconifyIcon icon="ant-design:exclamation-circle-outlined" class="mb-4 text-5xl text-warning" />
        <div class="text-base text-muted-foreground">
          {{ $t('payment.channel.wechatPay.transferConfigNotConfigured') }}
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
