<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MchRiskConfigApi } from '#/api/payment/risk/mch-risk-config.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  defineOptions({ name: 'MchRiskConfigManage' });

  const router = useRouter();

  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  // 编辑状态
  const isEditing = ref(false);
  const mchNo = computed(() => routeContext.query.value.mchNo);
  // 商户名称(展示用, 来自风控配置接口翻译)
  const mchName = ref('');
  // 地理围栏开关(商户级 opt-in)
  const geoFenceEnabled = ref(false);

  // 概要标签：围栏开启/关闭态
  const summaryItems = computed(() => {
    return [
      geoFenceEnabled.value
        ? $t('payment.merchant.riskConfig.riskConfig.summary.on')
        : $t('payment.merchant.riskConfig.riskConfig.summary.off'),
    ];
  });

  /** 加载商户风控配置 */
  async function loadConfig() {
    if (!mchNo.value) return;
    loading.value = true;
    const { data } = await MchRiskConfigApi.getByMchNo(mchNo.value);
    mchName.value = data?.mchName ?? '';
    geoFenceEnabled.value = data?.geoFenceEnabled ?? false;
    loading.value = false;
  }

  /** 进入编辑模式 */
  function handleEdit() {
    isEditing.value = true;
  }

  /** 取消编辑：重新加载回滚未保存的改动 */
  async function handleCancel() {
    await loadConfig();
    isEditing.value = false;
  }

  /** 保存风控配置 */
  function handleSave() {
    confirm({
      title: $t('common.confirm'),
      content: $t('payment.merchant.riskConfig.riskConfig.confirmSave'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        loading.value = true;
        await MchRiskConfigApi.saveOrUpdate({
          mchNo: mchNo.value,
          geoFenceEnabled: geoFenceEnabled.value,
        });
        message.success($t('common.saveSuccess'));
        await loadConfig();
        isEditing.value = false;
        loading.value = false;
      },
    });
  }

  /** 返回商户管理中心 */
  function handleBack() {
    router.push({
      path: '/payment/merchant/manage',
      query: { mchNo: mchNo.value },
    });
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    loadConfig();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingMchNo')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="risk-security-page">
    <a-spin :spinning="loading" class="w-full">
      <div class="security-module-page">
        <div class="module-overview">
          <div class="module-overview__header">
            <!-- 标题区：返回按钮 + 页面标题 + 商户名 -->
            <div class="flex items-center gap-2">
              <a-button
                type="text"
                class="flex items-center justify-center rounded-full hover:bg-accent"
                @click="handleBack"
              >
                <template #icon>
                  <IconifyIcon icon="ant-design:arrow-left-outlined" class="text-lg" />
                </template>
              </a-button>
              <!-- 国际化：风控配置 -->
              <span class="module-overview__title">
                {{ $t('payment.merchant.riskConfig.riskConfig.title') }}
              </span>
              <span v-if="mchName" class="text-sm text-muted-foreground">({{ mchName }})</span>
            </div>
            <div class="module-actions">
              <a-space>
                <!-- 非编辑状态：显示编辑按钮 -->
                <template v-if="!isEditing">
                  <a-button
                    v-if="hasPermission(PermCodes.Payment.Risk.MchConfig.MANAGE)"
                    type="primary"
                    @click="handleEdit"
                  >
                    {{ $t('common.edit') }}
                  </a-button>
                </template>
                <!-- 编辑状态：显示取消和确认按钮 -->
                <template v-else>
                  <a-button @click="handleCancel">{{ $t('payment.risk.common.cancel') }}</a-button>
                  <a-button type="primary" :loading="loading" @click="handleSave">
                    {{ $t('payment.risk.common.confirm') }}
                  </a-button>
                </template>
              </a-space>
            </div>
          </div>
          <!-- 页面描述：两级门控说明 -->
          <div class="module-overview__desc">
            {{ $t('payment.merchant.riskConfig.riskConfig.description') }}
          </div>
          <a-space wrap size="small" class="module-overview__tags">
            <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
          </a-space>
        </div>

        <!-- 两级门控提示 -->
        <div class="info-banner">
          <IconifyIcon icon="ant-design:info-circle-filled" />
          <!-- 国际化：两级门控说明 -->
          <span>{{ $t('payment.merchant.riskConfig.riskConfig.infoBanner') }}</span>
        </div>

        <!-- 风控开关配置区 -->
        <div class="config-section">
          <div class="config-section__title">
            {{ $t('payment.merchant.riskConfig.riskConfig.section.switch') }}
          </div>
          <div class="config-grid">
            <!-- 地理围栏开关 -->
            <div class="config-item config-item--full">
              <div class="config-item__main">
                <div class="config-item__label">{{ $t('payment.merchant.riskConfig.riskConfig.geoFenceEnabled') }}</div>
                <div class="config-item__desc">{{
                  $t('payment.merchant.riskConfig.riskConfig.geoFenceEnabledDesc')
                }}</div>
              </div>
              <a-switch v-model:checked="geoFenceEnabled" :disabled="!isEditing" />
            </div>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<style scoped lang="less">
  .risk-security-page {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    padding: 12px;
  }

  .security-module-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px 28px;
    background: hsl(var(--card));
    border-radius: 16px;
    box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
  }

  .module-overview {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .module-overview__header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .module-overview__title {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .module-overview__desc {
    font-size: 13px;
    line-height: 1.7;
    color: hsl(var(--muted-foreground));
  }

  .module-overview__tags {
    padding-top: 2px;
  }

  .module-actions {
    flex-shrink: 0;
  }

  .info-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background-color: hsl(var(--primary) / 5%);
    border: 1px solid hsl(var(--primary) / 20%);
    border-radius: 8px;
    color: hsl(var(--foreground));
    font-size: 13px;

    :deep(.iconify) {
      color: hsl(var(--primary));
      font-size: 18px;
    }
  }

  .config-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .config-section__title {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .config-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .config-item {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 12px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .config-item--full {
    grid-column: span 2;
  }

  .config-item:hover {
    border-color: hsl(var(--primary) / 30%);
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  }

  .config-item__main {
    flex: 1;
    min-width: 0;
  }

  .config-item__label {
    font-size: 14px;
    font-weight: 500;
    color: hsl(var(--foreground));
  }

  .config-item__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }
</style>
