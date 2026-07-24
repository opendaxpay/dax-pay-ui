<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    PayRiskHitApi,
    type PayRiskHitQuery,
    type PayRiskHitVo,
  } from '#/api/payment/risk/risk-hit.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import PayRiskHitHandle from './PayRiskHitHandle.vue';

  defineOptions({ name: 'PayRiskHitList' });

  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<PayRiskHitQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<PayRiskHitVo[]>([]);
  const handleRef = ref();

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
        { label: $t('payment.risk.blacklist.type.ip'), value: 'ip' },
        { label: $t('payment.risk.blacklist.type.alipay_user'), value: 'alipay_user' },
        { label: $t('payment.risk.blacklist.type.wechat_openid'), value: 'wechat_openid' },
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
    {
      type: 'list',
      field: 'handleStatus',
      // 处理状态
      name: $t('payment.risk.hit.field.handleStatus'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.risk.hit.handleStatus.pending'), value: 'pending' },
        { label: $t('payment.risk.hit.handleStatus.ignored'), value: 'ignored' },
        { label: $t('payment.risk.hit.handleStatus.added_blacklist'), value: 'added_blacklist' },
        { label: $t('payment.risk.hit.handleStatus.merchant_disabled'), value: 'merchant_disabled' },
        { label: $t('payment.risk.hit.handleStatus.other'), value: 'other' },
      ],
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

  function openHandle(row: PayRiskHitVo) {
    handleRef.value?.showHandle(row);
  }

  function phaseLabel(phase?: string) {
    if (phase === 'before_pay') return $t('payment.risk.hit.phase.before_pay');
    if (phase === 'after_pay') return $t('payment.risk.hit.phase.after_pay');
    return phase || '';
  }

  function handleStatusLabel(status?: string) {
    const map: Record<string, string> = {
      pending: $t('payment.risk.hit.handleStatus.pending'),
      ignored: $t('payment.risk.hit.handleStatus.ignored'),
      added_blacklist: $t('payment.risk.hit.handleStatus.added_blacklist'),
      merchant_disabled: $t('payment.risk.hit.handleStatus.merchant_disabled'),
      other: $t('payment.risk.hit.handleStatus.other'),
    };
    return status ? map[status] || status : '';
  }

  function handleStatusColor(status?: string) {
    if (status === 'pending') return 'warning';
    if (status === 'ignored') return 'default';
    if (status === 'added_blacklist') return 'error';
    if (status === 'merchant_disabled') return 'error';
    return 'processing';
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
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
            <template #default="{ row }">
              {{
                row.hitType === 'ip'
                  ? $t('payment.risk.blacklist.type.ip')
                  : row.hitType === 'alipay_user'
                    ? $t('payment.risk.blacklist.type.alipay_user')
                    : row.hitType === 'wechat_openid'
                      ? $t('payment.risk.blacklist.type.wechat_openid')
                      : row.hitType
              }}
            </template>
          </vxe-column>
          <!-- 命中值 -->
          <vxe-column field="hitValue" :title="$t('payment.risk.hit.field.hitValue')" :min-width="160" />
          <!-- 商户: 名称上 + 号下小字两排 -->
          <vxe-column field="mchName" :title="$t('payment.risk.hit.field.merchant')" :min-width="160">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span>{{ row.mchName || '-' }}</span>
                <span v-if="row.mchNo" class="text-xs text-muted-foreground">{{ row.mchNo }}</span>
              </div>
            </template>
          </vxe-column>
          <!-- 交易号 -->
          <vxe-column field="tradeNo" :title="$t('payment.risk.hit.field.tradeNo')" :min-width="140" />
          <!-- 处理状态 -->
          <vxe-column field="handleStatus" :title="$t('payment.risk.hit.field.handleStatus')" width="130">
            <template #default="{ row }">
              <a-tag :color="handleStatusColor(row.handleStatus)">
                {{ handleStatusLabel(row.handleStatus) }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 创建时间 -->
          <vxe-column field="createTime" :title="$t('payment.risk.hit.field.createTime')" width="170" />
          <vxe-column fixed="right" :width="120" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-button
                v-if="
                  hasPermission(PermCodes.Payment.Risk.Hit.MANAGE) && row.handleStatus === 'pending'
                "
                type="link"
                size="small"
                @click="openHandle(row)"
              >
                <!-- 处理 -->
                {{ $t('payment.risk.hit.action.handle') }}
              </a-button>
            </template>
          </vxe-column>
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

    <PayRiskHitHandle ref="handleRef" @ok="queryPage" />
  </div>
</template>
