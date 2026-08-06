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
  const saving = ref(false);
  const mchNo = computed(() => routeContext.query.value.mchNo);
  // 商户名称(展示用, 来自风控配置接口翻译)
  const mchName = ref('');
  // 地理围栏开关(商户级 opt-in)
  const geoFenceEnabled = ref(false);

  /** 加载商户风控配置 */
  async function loadConfig() {
    if (!mchNo.value) return;
    loading.value = true;
    const { data } = await MchRiskConfigApi.getByMchNo(mchNo.value);
    mchName.value = data?.mchName ?? '';
    geoFenceEnabled.value = data?.geoFenceEnabled ?? false;
    loading.value = false;
  }

  /** 保存风控配置 */
  function handleSave() {
    confirm({
      title: $t('common.confirm'),
      content: $t('payment.merchant.riskConfig.confirmSave'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        saving.value = true;
        await MchRiskConfigApi.saveOrUpdate({
          mchNo: mchNo.value,
          geoFenceEnabled: geoFenceEnabled.value,
        });
        message.success($t('common.saveSuccess'));
        saving.value = false;
        await loadConfig();
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
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
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
          <span class="text-lg font-bold text-foreground">{{ $t('payment.merchant.riskConfig.title') }}</span>
          <span v-if="mchName" class="text-sm text-muted-foreground">({{ mchName }})</span>
        </div>
      </template>

      <template #extra>
        <a-button
          v-if="hasPermission(PermCodes.Payment.Risk.MchConfig.MANAGE)"
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          {{ $t('common.save') }}
        </a-button>
      </template>

      <a-spin :spinning="loading">
        <div class="max-w-2xl px-4 py-2">
          <!-- 信息提示 -->
          <div class="info-banner">
            <IconifyIcon icon="ant-design:info-circle-filled" />
            <!-- 国际化：两级门控说明 -->
            <span>{{ $t('payment.merchant.riskConfig.infoBanner') }}</span>
          </div>

          <a-form layout="vertical">
            <!-- 国际化：地理围栏开关 -->
            <a-form-item :label="$t('payment.merchant.riskConfig.geoFenceEnabled')">
              <div class="flex items-center gap-3">
                <a-switch v-model:checked="geoFenceEnabled" />
                <span class="text-xs text-muted-foreground">
                  {{ $t('payment.merchant.riskConfig.geoFenceEnabledDesc') }}
                </span>
              </div>
            </a-form-item>
          </a-form>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<style scoped lang="less">
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
</style>
