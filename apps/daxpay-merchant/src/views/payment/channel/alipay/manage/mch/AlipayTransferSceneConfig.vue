<script lang="ts" setup>
  import type {
    AlipayTransferSceneConfig,
    AlipayTransferSceneOption,
  } from '#/api/payment/alipay/alipay-transfer-scene.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { AlipayTransferSceneApi } from '#/api/payment/alipay/alipay-transfer-scene.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AlipayTransferSceneConfig' });

  const { confirm, message } = useMessage();

  // 列表抽屉显隐
  const listVisible = ref(false);

  const channelMchNo = ref('');
  const loading = ref(false);
  // 场景选项(主数据枚举投影, 8个场景含报备字段元数据)
  const sceneOptions = ref<AlipayTransferSceneOption[]>([]);
  // 已操作过的场景配置行(状态映射: sceneName -> config)
  const dataList = ref<AlipayTransferSceneConfig[]>([]);

  /** 打开列表(由商户管理页卡片点击调用) */
  function open(cMchNo: string) {
    channelMchNo.value = cMchNo;
    listVisible.value = true;
    loadData();
  }

  /** 加载场景选项 + 已配置行(并行) */
  async function loadData() {
    loading.value = true;
    try {
      const [options, configs] = await Promise.all([
        AlipayTransferSceneApi.findSceneOptions(),
        AlipayTransferSceneApi.list(channelMchNo.value),
      ]);
      sceneOptions.value = options.data ?? [];
      dataList.value = configs.data ?? [];
    } finally {
      loading.value = false;
    }
  }

  // 最大启用场景数(与后端 AlipayTransferSceneConfigService.MAX_ENABLED 保持一致)
  const MAX_ENABLED_SCENES = 3;

  /** 根据场景名查状态行(无行即未操作过) */
  function getConfig(sceneName: string): AlipayTransferSceneConfig | undefined {
    return dataList.value.find((item) => item.sceneName === sceneName);
  }

  /** 已启用的场景数量 */
  const enabledCount = computed(() => dataList.value.filter((item) => item.enabled).length);
  /** 是否已达启用上限(达到后未启用的场景开关禁用) */
  const isEnabledLimit = computed(() => enabledCount.value >= MAX_ENABLED_SCENES);

  /** 切换启用状态(弹窗二次确认, 默认场景禁止禁用; 主数据模式无行按需创建) */
  function handleToggleEnabled(option: AlipayTransferSceneOption, enabled: boolean) {
    const sceneName = option.sceneName;
    if (!sceneName) return;
    const config = getConfig(sceneName);
    // 默认场景不允许禁用, 直接提示不弹确认
    if (!enabled && config?.isDefault) {
      message.warning($t('payment.merchant.channelMerchant.transferSceneCannotDisableDefault'));
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
        await AlipayTransferSceneApi.setEnabled(channelMchNo.value, sceneName, enabled);
        message.success($t('common.saveSuccess'));
        await loadData();
      },
    });
  }

  /** 设为默认(二次确认, 后端自动启用并按需创建行) */
  function handleSetDefault(option: AlipayTransferSceneOption) {
    const sceneName = option.sceneName;
    if (!sceneName) return;
    // 设默认确认
    confirm({
      content: $t('payment.merchant.channelMerchant.transferSceneSetDefaultConfirm'),
      onOk: async () => {
        await AlipayTransferSceneApi.setDefault(channelMchNo.value, sceneName);
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
    :width="1200"
    destroy-on-hidden
  >
    <div class="mb-3">
      <a-alert type="info" :show-icon="true" :message="$t('payment.merchant.channelMerchant.transferScenePresetTip')" />
    </div>
    <a-spin :spinning="loading">
      <!-- 卡片网格(每行2张, 以场景选项枚举为基准渲染) -->
      <div v-if="sceneOptions.length > 0" class="scene-grid">
        <div
          v-for="option in sceneOptions"
          :key="option.sceneName"
          class="scene-card"
          :class="{ 'scene-card-muted': !getConfig(option.sceneName!)?.enabled }"
        >
          <!-- 卡片头部: 场景名 + 默认标记 + 启用开关 -->
          <div class="scene-card-header">
            <div class="scene-card-title">
              <span class="scene-card-name">{{ option.sceneName }}</span>
              <a-tag v-if="getConfig(option.sceneName!)?.isDefault" color="green">
                {{ $t('common.isDefault') }}
              </a-tag>
            </div>
            <!-- 已达启用上限: 未启用的开关禁用并提示原因 -->
            <a-tooltip
              v-if="!getConfig(option.sceneName!)?.enabled && isEnabledLimit"
              :title="$t('payment.merchant.channelMerchant.transferScenePresetTip')"
            >
              <a-switch :checked="false" disabled />
            </a-tooltip>
            <a-switch
              v-else
              :checked="getConfig(option.sceneName!)?.enabled ?? false"
              @change="(val: boolean) => handleToggleEnabled(option, val)"
            />
          </div>
          <!-- 报备字段明细 -->
          <div class="scene-card-body">
            <div class="scene-card-section-title">
              {{ $t('payment.merchant.channelMerchant.transferSceneReportFields') }}
            </div>
            <div v-for="(type, fi) in option.reportInfoTypes" :key="type" class="scene-field-item">
              <div class="scene-field-name">{{ type }}</div>
              <div class="scene-field-desc" :title="option.reportInfoDescriptions?.[fi] || '-'">
                {{ option.reportInfoDescriptions?.[fi] || '-' }}
              </div>
            </div>
          </div>
          <!-- 卡片底部: 启用且非默认时显示设为默认 -->
          <div
            v-if="getConfig(option.sceneName!)?.enabled && !getConfig(option.sceneName!)?.isDefault"
            class="scene-card-footer"
          >
            <a-button type="link" size="small" @click="handleSetDefault(option)">
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
    font-size: 12px;
    font-weight: 600;
    color: #909399;
    margin-bottom: 4px;
  }

  .scene-field-item {
    display: flex;
    gap: 8px;
    align-items: baseline;
    padding: 4px 0;
  }

  .scene-field-name {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 500;
    color: #303133;
  }

  .scene-field-desc {
    flex: 1;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scene-card-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
</style>
