<script lang="ts" setup>
  import type { DouyinTransferSceneOption } from '#/api/payment/channel/douyin/channel-merchant.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DouyinDirectChannelMerchantApi } from '#/api/payment/channel/douyin/channel-merchant.api';

  defineOptions({ name: 'DouyinTransferSceneConfig' });

  const visible = ref(false);
  const loading = ref(false);
  // 转账场景选项列表(主数据枚举, 从后端加载)
  const sceneOptions = ref<DouyinTransferSceneOption[]>([]);

  /** 报备字段说明表列配置 */
  const reportColumns = computed(() => [
    {
      // 字段名称
      title: $t('payment.channel.douyinManage.transferSceneFieldTypeName'),
      dataIndex: 'infoType',
      width: 180,
    },
    {
      // 字段说明
      title: $t('payment.channel.douyinManage.transferSceneFieldDescription'),
      dataIndex: 'description',
    },
  ]);

  /** 打开抽屉(由管理页卡片点击调用) */
  function open() {
    visible.value = true;
    loadData();
  }

  /** 加载转账场景选项(主数据, 无需通道商户号) */
  function loadData() {
    loading.value = true;
    DouyinDirectChannelMerchantApi.findSceneOptions()
      .then(({ data }) => {
        sceneOptions.value = data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  defineExpose({ open });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.channel.douyinManage.cardTransferScene')"
    :width="880"
    destroy-on-hidden
  >
    <a-spin :spinning="loading">
      <!-- 提示条: 抖音转账场景为枚举驱动, 无需预配置 -->
      <div class="mb-6">
        <a-alert type="info" banner :message="$t('payment.channel.douyinManage.transferSceneReadonlyTip')" />
      </div>

      <!-- 场景列表(主数据枚举, 只读展示) -->
      <div class="space-y-5">
        <!-- 间距加在 wrapper 上, 避免被 ant-card 的 reset margin 覆盖 -->
        <div v-for="scene in sceneOptions" :key="scene.code">
          <a-card>
            <div class="mb-4 flex items-center gap-2">
              <a-tag color="blue">{{ scene.code }}</a-tag>
              <span class="text-base font-bold text-foreground">{{ scene.name }}</span>
            </div>

            <!-- 用户收款感知 -->
            <div v-if="scene.userRecvPerceptionOptions?.length" class="mb-4">
              <div class="mb-2 text-sm font-semibold text-foreground">
                {{ $t('payment.channel.douyinManage.transferSceneUserPerception') }}
              </div>
              <div class="flex flex-wrap gap-2">
                <a-tag
                  v-for="(perception, idx) in scene.userRecvPerceptionOptions"
                  :key="perception"
                  :color="idx === 0 ? 'green' : 'default'"
                >
                  {{ perception }}
                  <span v-if="idx === 0" class="ml-1 text-xs opacity-60">({{ $t('common.default') }})</span>
                </a-tag>
              </div>
              <div class="mt-2 text-xs text-muted-foreground">
                {{ $t('payment.channel.douyinManage.transferSceneUserPerceptionTip') }}
              </div>
            </div>

            <!-- 报备字段说明表 -->
            <div>
              <div class="mb-2 text-sm font-semibold text-foreground">
                {{ $t('payment.channel.douyinManage.transferSceneReportFields') }}
              </div>
              <a-table
                :data-source="
                  scene.reportInfoTypes?.map((type, i) => ({
                    key: i,
                    infoType: type,
                    description: scene.reportInfoDescriptions?.[i] || '-',
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
                {{ $t('payment.channel.douyinManage.transferSceneReportFieldsTip') }}
              </div>
            </div>
          </a-card>
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>
