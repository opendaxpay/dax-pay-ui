<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue';
    import { $t } from '@vben/locales';

  import { type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import {
    CashierConfigApi,
    type CashierItemResult,
  } from '#/api/payment/merchant/cashier.api';
  import { PayRouteApi } from '#/api/payment/route/pay-route.api';
  import MchAppSelectorBar from '#/components/app/MchAppSelectorBar.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { useMchAppSelector } from '#/hooks/useMchAppSelector';
  import { usePermission } from '#/hooks/usePermission';
  import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  import CashierItemEdit from './CashierItemEdit.vue';
  import {
    CASHIER_TYPE,
    RESOLVE_MODE,
    cashierTypeRequiresClientEnv,
    clientEnvsForCashierType,
    type CashierType,
  } from './shared/constants';

  defineOptions({ name: 'CashierConfig' });
  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 顶部 appId 选择器（无 mchNo URL）
  const {
    loading: appsLoading,
    appId,
    mchNo,
    appName,
    selectedApp,
    hasApps,
    appOptions,
    loadApps,
    setAppId,
  } = useMchAppSelector();


  const loading = ref(false);
  const appInfo = ref<MchAppInfoResult>({});
  const tableData = ref<CashierItemResult[]>([]);
  const methodLabelMap = ref<Record<string, string>>({});
  // DIRECT 模式列表展示用：通道商户号 → 名称
  const channelMchLabelMap = ref<Record<string, string>>({});

  // 一级 / 二级 Tab
  const activeType = ref<CashierType>(CASHIER_TYPE.H5);
  const activeClientEnv = ref('browser');

  const itemEditRef = ref<InstanceType<typeof CashierItemEdit>>();

  const canManage = computed(() => hasPermission(PermCodes.Merchant.GatewayCashier.MANAGE));

  /** 当前一级类型对应的 clientEnv 二级列表 */
  const activeClientEnvOptions = computed(() => clientEnvsForCashierType(activeType.value));

  /** 场景 i18n */
  function clientEnvLabel(clientEnv: string) {
    return $t(`payment.merchant.cashier.cashier.clientEnvs.${clientEnv}`);
  }

  /** 图标 i18n */
  function iconLabel(icon?: string) {
    if (!icon) return '-';
    return $t(`payment.merchant.cashier.cashier.icons.${icon}`);
  }

  /** 解析模式展示 */
  function resolveModeLabel(mode?: string) {
    if (mode === RESOLVE_MODE.DIRECT) {
      return $t('payment.merchant.cashier.cashier.modeDirect');
    }
    return $t('payment.merchant.cashier.cashier.modeMethod');
  }

  /** 支付解析摘要 */
  function paySummary(row: CashierItemResult) {
    if (row.resolveMode === RESOLVE_MODE.DIRECT) {
      const mchLabel = channelMchLabelMap.value[row.channelMchNo || ''] || row.channelMchNo || '';
      // 支付能力为固定枚举(PayCapabilityEnum)，直接用 i18n 静态翻译
      const capLabel = row.capability
        ? $t(`payment.merchant.cashier.cashier.capabilities.${row.capability}`)
        : '';
      const parts = [mchLabel, capLabel].filter(Boolean);
      return parts.join(' / ') || '-';
    }
    return methodLabelMap.value[row.method || ''] || row.method || '-';
  }

  /** 加载应用信息 */
  async function loadAppInfo() {
    appInfo.value = selectedApp.value || {};
  }


  /** 加载方式标签映射 */
  async function loadMethodLabels() {
    const { data } = await PayRouteApi.listMethodDirectoryFlat();
    const map: Record<string, string> = {};
    for (const item of data || []) {
      map[item.method] = item.methodLabel || item.method;
    }
    methodLabelMap.value = map;
  }

  /** 加载通道商户标签（每应用仅加载一次） */
  async function loadChannelMchLabels() {
    if (Object.keys(channelMchLabelMap.value).length > 0) {
      return;
    }
    const { data } = await PayRouteApi.listSceneChannelMchCandidatesBatch({
      appId: appId.value,
    });
    if (!data) {
      return;
    }
    const labelMap: Record<string, string> = {};
    for (const list of Object.values(data)) {
      for (const item of list || []) {
        labelMap[item.value] = item.label;
      }
    }
    channelMchLabelMap.value = labelMap;
  }

  /** 加载当前桶列表 */
  async function loadList() {
    if (!appId.value) return;
    loading.value = true;
    try {
      const params: { appId: string; cashierType: string; clientEnv?: string } = {
        appId: appId.value,
        cashierType: activeType.value,
      };
      if (cashierTypeRequiresClientEnv(activeType.value)) {
        params.clientEnv = activeClientEnv.value;
      }
      const { data } = await CashierConfigApi.list(params);
      tableData.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  /** 返回应用列表 */
    /** 新增 */
  function handleAdd() {
    itemEditRef.value?.show({
      mchNo: mchNo.value,
      appId: appId.value,
      cashierType: activeType.value,
      clientEnv: cashierTypeRequiresClientEnv(activeType.value) ? activeClientEnv.value : undefined,
    });
  }

  /** 编辑 */
  function handleEdit(row: CashierItemResult) {
    itemEditRef.value?.showEdit({
      mchNo: mchNo.value,
      appId: appId.value,
      cashierType: activeType.value,
      clientEnv: cashierTypeRequiresClientEnv(activeType.value) ? activeClientEnv.value : undefined,
      record: row,
    });
  }

  /** 删除 */
  function handleDelete(row: CashierItemResult) {
    confirm({
      content: $t('payment.merchant.cashier.cashier.confirmDelete'),
      onOk() {
        return CashierConfigApi.delete(row.id!).then(() => {
          message.success($t('common.operationSuccess'));
          loadList();
        });
      },
    });
  }

  // 切换一级类型时，校正二级 clientEnv 落在当前列表内
  watch(activeType, (type) => {
    const options = clientEnvsForCashierType(type);
    if (options.length === 0) {
      return;
    }
    if (!options.some((o) => o.clientEnv === activeClientEnv.value)) {
      activeClientEnv.value = options[0]!.clientEnv;
    }
  });

  watch([activeType, activeClientEnv], () => {
    if (!appId.value) return;
    loadList();
  });

  onMounted(async () => {
    await loadApps();
    await loadAppInfo();
    await Promise.all([loadMethodLabels(), loadChannelMchLabels()]);
    await loadList();
  });

  // 切换应用时重载
  watch(appId, async () => {
    await loadAppInfo();
    await Promise.all([loadMethodLabels(), loadChannelMchLabels()]);
    await loadList();
  });
</script>

<template>
  <div class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold">{{ $t('menu.payment.merchant.cashierConfig') }}</span>
          <span v-if="appName" class="text-sm text-muted-foreground">
            ({{ appName }})
          </span>
        </div>
      </template>

      <MchAppSelectorBar
        :value="appId"
        :options="appOptions"
        :loading="appsLoading"
        @update:value="setAppId"
      />

      <a-empty v-if="!appsLoading && !hasApps" :description="$t('payment.merchant.app.app.emptyApps')" />


      <template #extra>
        <a-button v-if="canManage" type="primary" @click="handleAdd">
          {{ $t('payment.merchant.cashier.cashier.addItem') }}
        </a-button>
      </template>

      <!-- 一级: H5 / WEB / 小程序 -->
      <div class="mb-4">
        <a-radio-group v-model:value="activeType" button-style="solid">
          <a-radio-button :value="CASHIER_TYPE.H5">{{
            $t('payment.merchant.cashier.cashier.typeH5')
          }}</a-radio-button>
          <a-radio-button :value="CASHIER_TYPE.WEB">{{
            $t('payment.merchant.cashier.cashier.typeWeb')
          }}</a-radio-button>
          <a-radio-button :value="CASHIER_TYPE.MINI">{{
            $t('payment.merchant.cashier.cashier.typeMini')
          }}</a-radio-button>
        </a-radio-group>
      </div>

      <!-- H5 五档 / 小程序四档(含云闪付) 二级终端 -->
      <div v-if="cashierTypeRequiresClientEnv(activeType)" class="mb-4">
        <a-radio-group v-model:value="activeClientEnv" button-style="solid">
          <a-radio-button
            v-for="sc in activeClientEnvOptions"
            :key="sc.clientEnv"
            :value="sc.clientEnv"
          >
            {{ clientEnvLabel(sc.clientEnv) }}
          </a-radio-button>
        </a-radio-group>
      </div>

      <a-spin :spinning="loading">
        <vxe-table :data="tableData" :row-config="{ keyField: 'id' }" min-height="200">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="name" :title="$t('payment.merchant.cashier.cashier.name')" min-width="70" />
          <vxe-column field="icon" :title="$t('payment.merchant.cashier.cashier.icon')" width="120" align="center">
            <template #default="{ row }">
              <div class="flex items-center justify-center gap-1">
                <img
                  v-if="getProviderSvgUrl(row.icon)"
                  :src="getProviderSvgUrl(row.icon)"
                  class="h-5 w-5 object-contain"
                  :alt="row.icon"
                />
                <span>{{ iconLabel(row.icon) }}</span>
              </div>
            </template>
          </vxe-column>
          <vxe-column
            field="recommend"
            :title="$t('payment.merchant.cashier.cashier.recommend')"
            width="90"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.recommend" color="green">{{
                $t('payment.merchant.cashier.cashier.recommendYes')
              }}</a-tag>
              <span v-else class="text-muted-foreground">{{
                $t('payment.merchant.cashier.cashier.recommendNo')
              }}</span>
            </template>
          </vxe-column>
          <vxe-column
            field="sortNo"
            :title="$t('payment.merchant.cashier.cashier.sortNo')"
            width="80"
            align="center"
          />
          <vxe-column
            field="resolveMode"
            :title="$t('payment.merchant.cashier.cashier.resolveMode')"
            width="110"
            align="center"
          >
            <template #default="{ row }">
              {{ resolveModeLabel(row.resolveMode) }}
            </template>
          </vxe-column>
          <vxe-column
            field="method"
            :title="$t('payment.merchant.cashier.cashier.method')"
            min-width="200"
          >
            <template #default="{ row }">
              {{ paySummary(row) }}
            </template>
          </vxe-column>
          <vxe-column fixed="right" :width="120" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space v-if="canManage" :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleEdit(row)">
                  {{ $t('common.edit') }}
                </a-button>
                <a-button type="link" size="small" danger @click="handleDelete(row)">
                  {{ $t('common.delete') }}
                </a-button>
              </a-space>
            </template>
          </vxe-column>
          <template #empty>
            <div class="py-8 text-center text-muted-foreground">
              {{ $t('payment.merchant.cashier.cashier.empty') }}
            </div>
          </template>
        </vxe-table>
      </a-spin>
    </a-card>

    <CashierItemEdit ref="itemEditRef" @ok="loadList" />
  </div>
</template>
