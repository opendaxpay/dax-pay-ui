<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { PayRiskHitApi, type PayRiskHitQuery, type PayRiskHitVo } from '#/api/payment/risk/risk-hit.api';
  import { BQuery, type QueryField } from '#/components/query';

  defineOptions({ name: 'PayRiskHitList' });

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<PayRiskHitQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<PayRiskHitVo[]>([]);

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'list',
      field: 'phase',
      // 阶段
      name: $t('payment.risk.hit.field.phase'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.risk.hit.phase.before_pay'), value: 'before_pay' },
        { label: $t('payment.risk.hit.phase.after_pay'), value: 'after_pay' },
      ],
    },
    {
      type: 'list',
      field: 'hitType',
      // 命中类型
      name: $t('payment.risk.hit.field.hitType'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.risk.hit.hitType.ip'), value: 'ip' },
        { label: $t('payment.risk.hit.hitType.alipay_user'), value: 'alipay_user' },
        { label: $t('payment.risk.hit.hitType.wechat_openid'), value: 'wechat_openid' },
        { label: $t('payment.risk.hit.hitType.overseas_ip'), value: 'overseas_ip' },
        { label: $t('payment.risk.hit.hitType.province'), value: 'province' },
        { label: $t('payment.risk.hit.hitType.city'), value: 'city' },
        { label: $t('payment.risk.hit.hitType.geo_fence'), value: 'geo_fence' },
      ],
    },
    {
      type: 'string',
      field: 'hitValue',
      // 命中值
      name: $t('payment.risk.hit.field.hitValue'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'mchNo',
      // 商户号
      name: $t('payment.risk.hit.field.mchNo'),
      placeholder: $t('common.pleaseInput'),
    },
  ]);

  /** 分页查询 */
  function queryPage() {
    loading.value = true;
    return PayRiskHitApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res) => {
        tableData.value = res.data?.records || [];
        pageConfig.value.total = Number(res.data?.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  function handlePageChange({ currentPage, pageSize }: { currentPage: number; pageSize: number }) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  function phaseLabel(phase?: string) {
    if (phase === 'before_pay') return $t('payment.risk.hit.phase.before_pay');
    if (phase === 'after_pay') return $t('payment.risk.hit.phase.after_pay');
    return phase || '';
  }

  /** 命中类型展示 */
  function hitTypeLabel(type?: string) {
    if (type === 'ip') return $t('payment.risk.hit.hitType.ip');
    if (type === 'alipay_user') return $t('payment.risk.hit.hitType.alipay_user');
    if (type === 'wechat_openid') return $t('payment.risk.hit.hitType.wechat_openid');
    if (type === 'overseas_ip') return $t('payment.risk.hit.hitType.overseas_ip');
    if (type === 'province') return $t('payment.risk.hit.hitType.province');
    if (type === 'city') return $t('payment.risk.hit.hitType.city');
    if (type === 'geo_fence') return $t('payment.risk.hit.hitType.geo_fence');
    return type || '';
  }

  /** 围栏策略展示 */
  function strategyLabel(strategy?: string) {
    if (strategy === 'strict') return $t('payment.risk.hit.strategy.strict');
    if (strategy === 'balanced') return $t('payment.risk.hit.strategy.balanced');
    if (strategy === 'loose') return $t('payment.risk.hit.strategy.loose');
    return strategy || '';
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });
</script>

<template>
  <div class="list-page-compact m-3 rounded-lg bg-background p-3">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 阶段 -->
          <vxe-column field="phase" :title="$t('payment.risk.hit.field.phase')" width="100">
            <template #default="{ row }">{{ phaseLabel(row.phase) }}</template>
          </vxe-column>
          <!-- 命中类型 -->
          <vxe-column field="hitType" :title="$t('payment.risk.hit.field.hitType')" width="120">
            <template #default="{ row }">{{ hitTypeLabel(row.hitType) }}</template>
          </vxe-column>
          <!-- 命中值 -->
          <vxe-column field="hitValue" :title="$t('payment.risk.hit.field.hitValue')" :min-width="160" />
          <!-- IP归属城市 -->
          <vxe-column field="clientCity" :title="$t('payment.risk.hit.field.clientCity')" :min-width="110" />
          <!-- 门店城市 -->
          <vxe-column field="storeCity" :title="$t('payment.risk.hit.field.storeCity')" :min-width="110" />
          <!-- 围栏策略 -->
          <vxe-column field="geoFenceStrategy" :title="$t('payment.risk.hit.field.geoFenceStrategy')" :min-width="100">
            <template #default="{ row }">{{ strategyLabel(row.geoFenceStrategy) }}</template>
          </vxe-column>
          <!-- 交易号 -->
          <vxe-column field="tradeNo" :title="$t('payment.risk.hit.field.tradeNo')" :min-width="140" />
          <!-- 商户: 名称上 + 号下小字两排 -->
          <vxe-column field="mchName" :title="$t('payment.risk.hit.field.merchant')" :min-width="160">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.mchName || '-' }}</span>
                <span v-if="row.mchNo" class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
            </template>
          </vxe-column>
          <!-- 创建时间 -->
          <vxe-column
            field="createTime"
            :title="$t('payment.risk.hit.field.createTime')"
            width="170"
            formatter="formatDateTime"
          />
        </vxe-table>
        <div class="mt-3 flex justify-end">
          <vxe-pager
            v-model:current-page="pageConfig.currentPage"
            v-model:page-size="pageConfig.pageSize"
            :total="pageConfig.total"
            @page-change="handlePageChange"
          />
        </div>
      </a-card>
    </div>
  </div>
</template>
