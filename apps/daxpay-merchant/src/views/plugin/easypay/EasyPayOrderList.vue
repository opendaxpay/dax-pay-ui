<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    EasyPayOrderApi,
    type EasyPayOrderQuery,
    type EasyPayOrderResult,
  } from '#/api/plugin/easypay/easypay-order.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'EasyPayOrderList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<EasyPayOrderQuery>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<EasyPayOrderResult[]>([]);

  // 详情抽屉
  const drawerVisible = ref(false);
  const drawerLoading = ref(false);
  const detail = ref<EasyPayOrderResult>({});
  const actionLoading = ref(false);

  // 订单状态下拉 0=待付 1=成功
  const statusOptions = computed(() =>
    [0, 1].map((v) => ({
      label: $t(`plugin.easypay.order.status.${v}`),
      value: v,
    })),
  );

  // 支付方式下拉
  const typeOptions = computed(() =>
    ['alipay', 'wxpay', 'aggregate'].map((v) => ({
      label: typeLabel(v),
      value: v,
    })),
  );

  // 查询字段
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'outTradeNo',
      // 商户订单号
      name: $t('plugin.easypay.order.field.outTradeNo'),
      placeholder: $t('plugin.easypay.order.placeholder.outTradeNo'),
    },
    {
      type: 'string',
      field: 'tradeNo',
      // 平台业务单号
      name: $t('plugin.easypay.order.field.tradeNo'),
      placeholder: $t('plugin.easypay.order.placeholder.tradeNo'),
    },
    {
      type: 'string',
      field: 'name',
      // 商品名称
      name: $t('plugin.easypay.order.field.name'),
      placeholder: $t('plugin.easypay.order.placeholder.name'),
    },
    {
      type: 'list',
      field: 'status',
      // 订单状态
      name: $t('plugin.easypay.order.field.status'),
      selectList: statusOptions.value,
    },
    {
      type: 'list',
      field: 'type',
      // 支付方式
      name: $t('plugin.easypay.order.field.type'),
      selectList: typeOptions.value,
    },
    {
      type: 'date_time_range',
      field: 'createTime',
      // 创建时间
      name: $t('plugin.easypay.order.field.createTime'),
      startField: 'createTimeStart',
      endField: 'createTimeEnd',
    },
  ]);

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true;
    return EasyPayOrderApi.page({
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

  /**
   * 金额格式化(后端为元, 直接保留两位小数)
   */
  function formatMoney(money?: number): string {
    if (money === null || money === undefined) return '-';
    return Number(money).toFixed(2);
  }

  /**
   * 订单状态颜色 0=待付 1=成功
   */
  function statusColor(status?: number): string {
    return status == null ? 'default' : $t(`plugin.easypay.order.statusColor.${status}`);
  }

  /**
   * 支付方式展示名(走 i18n, 缺失回退原值)
   */
  function typeLabel(type?: string): string {
    if (!type) return '-';
    const key = `plugin.easypay.order.type.${type}`;
    const text = $t(key);
    return text && text !== key ? text : type;
  }

  /**
   * 查看详情
   */
  async function handleView(row: EasyPayOrderResult) {
    drawerVisible.value = true;
    drawerLoading.value = true;
    try {
      const { data } = await EasyPayOrderApi.getById(row.id!);
      detail.value = data || {};
    } finally {
      drawerLoading.value = false;
    }
  }

  /**
   * 同步订单状态
   */
  function handleSync(row: EasyPayOrderResult) {
    confirm({
      title: $t('plugin.easypay.order.action.syncConfirmTitle'),
      content: $t('plugin.easypay.order.action.syncConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return EasyPayOrderApi.sync(row.id!)
          .then(() => {
            message.success($t('plugin.easypay.order.action.syncSuccess'));
            queryPage();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
  }

  /**
   * 关闭订单(仅待付订单)
   */
  function handleClose(row: EasyPayOrderResult) {
    confirm({
      title: $t('plugin.easypay.order.action.closeConfirmTitle'),
      content: $t('plugin.easypay.order.action.closeConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return EasyPayOrderApi.close(row.id!)
          .then(() => {
            message.success($t('plugin.easypay.order.action.closeSuccess'));
            queryPage();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
  }

  function handleDrawerClose() {
    drawerVisible.value = false;
    detail.value = {};
  }

  /**
   * 更多操作菜单(同步/关单, 按状态与权限动态生成)
   */
  function getActionMenu(row: EasyPayOrderResult): MenuProps {
    const items: { danger?: boolean; key: string; label: string }[] = [];
    const canManage = hasPermission(PermCodes.Plugin.EasyPayOrder.MANAGE);
    // 关单(待付 + 管理权限)
    if (canManage && row.status === 0) {
      items.push({ key: 'close', label: $t('plugin.easypay.order.action.close'), danger: true });
    }
    // 同步(待付 + 管理权限)
    if (canManage && row.status === 0) {
      items.push({ key: 'sync', label: $t('plugin.easypay.order.action.sync') });
    }
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'close': {
            handleClose(row);
            break;
          }
          case 'sync': {
            handleSync(row);
            break;
          }
        }
      },
    };
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
          <vxe-column
            field="tradeNo"
            :title="$t('plugin.easypay.order.field.tradeNo')"
            :min-width="200"
            show-overflow
          />
          <vxe-column
            field="outTradeNo"
            :title="$t('plugin.easypay.order.field.outTradeNo')"
            :min-width="180"
            show-overflow
          />
          <vxe-column field="name" :title="$t('plugin.easypay.order.field.name')" :min-width="160" show-overflow />
          <vxe-column field="money" :title="$t('plugin.easypay.order.field.money')" :min-width="100" align="right">
            <template #default="{ row }">
              {{ formatMoney(row.money) }}
            </template>
          </vxe-column>
          <vxe-column field="status" :title="$t('plugin.easypay.order.field.status')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">
                {{ row.status != null ? $t(`plugin.easypay.order.status.${row.status}`) : '-' }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="type" :title="$t('plugin.easypay.order.field.type')" :min-width="120" align="center">
            <template #default="{ row }">{{ typeLabel(row.type) }}</template>
          </vxe-column>
          <vxe-column
            field="apiVersion"
            :title="$t('plugin.easypay.order.field.apiVersion')"
            :min-width="100"
            align="center"
          />
          <vxe-column
            field="createTime"
            :title="$t('plugin.easypay.order.field.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <vxe-column :title="$t('common.operation')" width="160" fixed="right" :show-overflow="false">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Plugin.EasyPayOrder.VIEW)"
                  type="link"
                  size="small"
                  @click="handleView(row)"
                >
                  {{ $t('common.view') }}
                </a-button>
                <!-- 更多操作(同步/关单, 按状态与权限动态生成) -->
                <a-dropdown v-if="getActionMenu(row).items?.length" :menu="getActionMenu(row)">
                  <a-button type="link" size="small">
                    {{ $t('common.more') }}
                    <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                  </a-button>
                </a-dropdown>
              </a-space>
            </template>
          </vxe-column>
        </vxe-table>
        <vxe-pager
          size="medium"
          :loading="loading"
          :current-page="pageConfig.currentPage"
          :page-size="pageConfig.pageSize"
          :total="pageConfig.total"
          @page-change="handlePageChange"
        />
      </a-card>
    </div>

    <!-- 详情抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('plugin.easypay.order.detail')"
      :size="900"
      @close="handleDrawerClose"
    >
      <a-spin :spinning="drawerLoading">
        <a-divider orientation="left" plain>{{ $t('plugin.easypay.order.section.basic') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.orderId')">
            {{ detail.orderId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.pid')">
            {{ detail.pid ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.tradeNo')">
            {{ detail.tradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.outTradeNo')">
            {{ detail.outTradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.apiTradeNo')">
            {{ detail.apiTradeNo || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.name')">
            {{ detail.name || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.type')">
            {{ typeLabel(detail.type) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.status')">
            <a-tag :color="statusColor(detail.status)">
              {{ detail.status != null ? $t(`plugin.easypay.order.status.${detail.status}`) : '-' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.money')">
            {{ formatMoney(detail.money) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.refundMoney')">
            {{ formatMoney(detail.refundMoney) }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left" plain>{{ $t('plugin.easypay.order.section.time') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.addTime')">
            {{ detail.addTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.endTime')">
            {{ detail.endTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.createTime')">
            {{ detail.createTime || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left" plain>{{ $t('plugin.easypay.order.section.extra') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.apiVersion')">
            {{ detail.apiVersion || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.pcCallType')">
            {{ detail.pcCallType || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.buyer')">
            {{ detail.buyer || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.clientIp')">
            {{ detail.clientIp || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.payUrl')" :span="2">
            {{ detail.payUrl || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.payBody')" :span="2">
            {{ detail.payBody || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.param')" :span="2">
            {{ detail.param || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.notifyUrl')" :span="2">
            {{ detail.notifyUrl || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.returnUrl')" :span="2">
            {{ detail.returnUrl || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>

      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>
