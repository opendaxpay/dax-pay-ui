<script lang="ts" setup>
  import type { WechatTransferSceneOption } from '#/api/payment/channel/wechat/channel-merchant.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { WechatDirectChannelMerchantApi } from '#/api/payment/channel/wechat/channel-merchant.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'WechatTransferSceneConfig' });

  const { message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const editing = ref(false);

  const channelMchNo = ref('');
  // 当前转账场景
  const currentScene = ref('');
  // 编辑中的转账场景
  const editingScene = ref('');
  // 场景选项
  const sceneOptions = ref<WechatTransferSceneOption[]>([]);

  /** 当前场景选项(匹配 code) */
  const currentOption = computed(() => sceneOptions.value.find((s) => s.code === currentScene.value));

  /** 编辑中场景选项(匹配 code) */
  const editingOption = computed(() => sceneOptions.value.find((s) => s.code === editingScene.value));

  /** 展示用的场景详情(编辑时用编辑中的, 否则用当前的) */
  const displayOption = computed(() => (editing.value ? editingOption.value : currentOption.value));

  /** 场景下拉选项(antdv-next 用 :options prop 渲染更可靠) */
  const selectOptions = computed(() =>
    sceneOptions.value.map((s) => ({
      label: `${s.name}（${s.code}）`,
      value: s.code,
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
  function open(mchChannelNo: string) {
    channelMchNo.value = mchChannelNo;
    visible.value = true;
    editing.value = false;
    loadData();
  }

  /** 加载场景选项 + 商户配置(两个请求独立, 互不影响) */
  function loadData() {
    loading.value = true;
    // 场景选项独立加载, 不依赖商户配置查询结果
    WechatDirectChannelMerchantApi.findSceneOptions()
      .then((res) => {
        sceneOptions.value = res.data || [];
      })
      .finally(() => {
        loading.value = false;
      });
    // 商户配置单独加载, 失败(如记录不存在)不影响场景选项
    if (!channelMchNo.value) return;
    WechatDirectChannelMerchantApi.findByChannelMchNo(channelMchNo.value)
      .then(({ data }) => {
        currentScene.value = data?.transferScene || '';
      })
      .catch(() => {});
  }

  /** 开始编辑 */
  function startEdit() {
    editingScene.value = currentScene.value;
    editing.value = true;
  }

  /** 保存转账场景 */
  async function saveScene() {
    saving.value = true;
    try {
      await WechatDirectChannelMerchantApi.update({
        channelMchNo: channelMchNo.value,
        transferScene: editingScene.value,
      });
      currentScene.value = editingScene.value;
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
    :title="$t('payment.merchant.channelMerchant.cardTransferScene')"
    :size="880"
    :styles="{ footer: { textAlign: 'right' } }"
    destroy-on-hidden
  >
    <a-spin :spinning="loading">
      <!-- 提示条 -->
      <div class="mb-6">
        <a-alert
          type="info"
          banner
          :message="$t('payment.channel.wechatPay.transferSceneTipDesc')"
        />
      </div>

      <!-- 场景选择区(查看时禁用, 编辑时可选) -->
      <div class="mb-8">
        <a-form layout="vertical">
          <a-form-item :label="$t('payment.channel.wechatPay.transferScene')">
            <a-select
              :value="editing ? editingScene : currentScene"
              :disabled="!editing"
              :options="selectOptions"
              :placeholder="$t('payment.channel.wechatPay.transferScenePlaceholder')"
              :allow-clear="editing"
              size="large"
              @update:value="editingScene = $event"
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
      <div v-if="!currentScene && !editing" class="flex flex-col items-center justify-center py-16">
        <IconifyIcon icon="ant-design:exclamation-circle-outlined" class="mb-4 text-5xl text-warning" />
        <div class="text-base text-muted-foreground">
          {{ $t('payment.channel.wechatPay.transferSceneNotConfigured') }}
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          {{ $t('payment.channel.wechatPay.transferSceneNotConfiguredTip') }}
        </div>
      </div>

      <!-- 编辑模式: 未选择场景时的空状态 -->
      <div v-if="editing && !editingScene" class="flex flex-col items-center justify-center py-16">
        <IconifyIcon icon="ant-design:search-outlined" class="mb-4 text-5xl text-muted-foreground" />
        <div class="text-sm text-muted-foreground">
          {{ $t('payment.channel.wechatPay.transferSceneSelectPrompt') }}
        </div>
      </div>
    </a-spin>

    <template #footer>
      <a-space>
        <template v-if="editing">
          <a-button @click="editing = false">
            {{ $t('common.cancel') }}
          </a-button>
          <a-button type="primary" :loading="saving" @click="saveScene">
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
