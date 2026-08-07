<script lang="ts" setup>
  import type { AlipayTransferSceneConfig } from '#/api/payment/channel/alipay/transfer-scene.api';

  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { AlipayTransferSceneApi } from '#/api/payment/channel/alipay/transfer-scene.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AlipayTransferSceneConfig' });

  const { confirm, message } = useMessage();

  // 列表抽屉显隐
  const listVisible = ref(false);

  const mchNo = ref('');
  const channelMchNo = ref('');
  const loading = ref(false);
  const dataList = ref<AlipayTransferSceneConfig[]>([]);

  // 场景图标(与枚举固定顺序对齐: 现金营销/企业退款/佣金报酬/业务结算/二手回收/公益补助/行政补贴和退款/保险理赔)
  const SCENE_ICONS = [
    'ant-design:money-collect-outlined',
    'ant-design:rollback-outlined',
    'ant-design:account-book-outlined',
    'ant-design:pay-circle-outlined',
    'ant-design:recycle-outlined',
    'ant-design:heart-outlined',
    'ant-design:bank-outlined',
    'ant-design:safety-outlined',
  ];

  /** 打开列表(由商户管理页卡片点击调用) */
  function open(no: string, cMchNo: string) {
    mchNo.value = no;
    channelMchNo.value = cMchNo;
    listVisible.value = true;
    loadData();
  }

  /** 加载场景列表 */
  async function loadData() {
    loading.value = true;
    try {
      const { data } = await AlipayTransferSceneApi.list(
        mchNo.value,
        channelMchNo.value,
      );
      dataList.value = data ?? [];
    } finally {
      loading.value = false;
    }
  }

  /** 切换启用状态(弹窗二次确认, 默认场景禁止禁用) */
  function handleToggleEnabled(
    row: AlipayTransferSceneConfig,
    enabled: boolean,
  ) {
    const id = row.id;
    if (!id) return;
    // 默认场景不允许禁用, 直接提示不弹确认
    if (!enabled && row.isDefault) {
      message.warning(
        $t('payment.merchant.channelMerchant.transferSceneCannotDisableDefault'),
      );
      return;
    }
    // 启用/禁用二次确认
    confirm({
      content: $t(
        enabled
          ? 'payment.merchant.channelMerchant.transferSceneEnableConfirm'
          : 'payment.merchant.channelMerchant.transferSceneDisableConfirm',
      ),
      onOk: async () => {
        await AlipayTransferSceneApi.setEnabled(mchNo.value, id, enabled);
        message.success($t('common.saveSuccess'));
        await loadData();
      },
    });
  }

  /** 设为默认(二次确认, 后端自动启用) */
  function handleSetDefault(row: AlipayTransferSceneConfig) {
    const id = row.id;
    if (!id) return;
    // 设默认确认
    confirm({
      content: $t(
        'payment.merchant.channelMerchant.transferSceneSetDefaultConfirm',
      ),
      onOk: async () => {
        await AlipayTransferSceneApi.setDefault(mchNo.value, id);
        message.success($t('common.saveSuccess'));
        await loadData();
      },
    });
  }

  defineExpose({ open });
</script>

<template>
  <!-- 场景卡片抽屉 -->
  <a-drawer
    v-model:open="listVisible"
    :title="$t('payment.merchant.channelMerchant.transferSceneManage')"
    :width="980"
    destroy-on-hidden
  >
    <div class="mb-3">
      <a-alert
        type="info"
        :show-icon="true"
        :message="
          $t('payment.merchant.channelMerchant.transferScenePresetTip')
        "
      />
    </div>
    <a-spin :spinning="loading">
      <!-- 卡片网格(每行2张, 按枚举固定顺序) -->
      <div v-if="dataList.length" class="scene-grid">
        <div
          v-for="(scene, idx) in dataList"
          :key="scene.id ?? idx"
          class="scene-card"
          :class="{ 'scene-card-muted': !scene.enabled }"
        >
          <!-- 卡片头部: 图标 + 场景名 + 默认标记 + 启用开关 -->
          <div class="scene-card-header">
            <div class="scene-card-title">
              <span
                class="scene-card-icon"
                :class="{ 'scene-card-icon-muted': !scene.enabled }"
              >
                <IconifyIcon
                  :icon="SCENE_ICONS[idx % SCENE_ICONS.length] ?? 'ant-design:transaction-outlined'"
                  class="h-5 w-5"
                />
              </span>
              <span class="scene-card-name">{{ scene.sceneName }}</span>
              <a-tag v-if="scene.isDefault" color="green">
                {{ $t('common.isDefault') }}
              </a-tag>
            </div>
            <a-switch
              :checked="scene.enabled"
              @change="(val: boolean) => handleToggleEnabled(scene, val)"
            />
          </div>
          <!-- 报备字段明细 -->
          <div class="scene-card-body">
            <div class="scene-card-section-title">
              <IconifyIcon icon="ant-design:profile-outlined" class="h-3.5 w-3.5" />
              <span>
                {{ $t('payment.merchant.channelMerchant.transferSceneReportFields') }}
              </span>
            </div>
            <div
              v-for="(type, fi) in scene.reportInfoTypes"
              :key="type"
              class="scene-field-item"
            >
              <div class="scene-field-name">{{ type }}</div>
              <div class="scene-field-desc">
                {{ scene.reportInfoDescriptions?.[fi] || '-' }}
              </div>
            </div>
          </div>
          <!-- 卡片底部: 启用且非默认时显示设为默认 -->
          <div
            v-if="scene.enabled && !scene.isDefault"
            class="scene-card-footer"
          >
            <a-button
              type="link"
              size="small"
              @click="handleSetDefault(scene)"
            >
              {{ $t('common.setDefault') }}
            </a-button>
          </div>
        </div>
      </div>
      <a-empty v-else :description="$t('common.noData')" />
    </a-spin>
  </a-drawer>
</template>

<style scoped>
  /* 卡片网格: 每行2张 */
  .scene-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .scene-card {
    display: flex;
    flex-direction: column;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
    padding: 16px;
    transition: all 0.3s ease;
  }

  .scene-card:hover {
    border-color: #1677ff;
    box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
  }

  .scene-card-muted {
    background: #fafafa;
  }

  .scene-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .scene-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .scene-card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #e6f4ff;
    color: #1677ff;
    flex-shrink: 0;
  }

  .scene-card-icon-muted {
    background: #f0f0f0;
    color: #999;
  }

  .scene-card-name {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scene-card-body {
    flex: 1;
  }

  .scene-card-section-title {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #909399;
    margin-bottom: 8px;
  }

  .scene-field-item {
    padding: 8px 10px;
    border-radius: 8px;
    background: #f5f7fa;
    margin-bottom: 6px;
  }

  .scene-field-name {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
  }

  .scene-field-desc {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
    line-height: 1.5;
  }

  .scene-card-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 8px;
    border-top: 1px dashed #e5e7eb;
    margin-top: 8px;
  }
</style>
