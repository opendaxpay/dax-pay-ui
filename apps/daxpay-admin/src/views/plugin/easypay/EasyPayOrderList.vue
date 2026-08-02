<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { EasyPayOrderApi, type EasyPayOrderQuery, type EasyPayOrderResult } from '#/api/plugin/easypay/easypay-order.api';
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

  // 协议状态下拉(0=待付 1=成功)
  const statusOptions = computed(() => [
    // 成功
    { label: $t('plugin.easypay.order.status.success'), value: 1 },
    // 待付
    { label: $t('plugin.easypay.order.status.pending'), value: 0 },
  ]);

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
      // 协议状态
      name: $t('plugin.easypay.order.field.status'),
      selectList: statusOptions.value,
    },
    {
      type: 'string',
      field: 'type',
      // 支付方式
      name: $t('plugin.easypay.order.field.type'),
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
   * 金额格式化(后端已是元, 直接保留两位小数)
   */
  function formatMoney(amount?: number): string {
    if (amount === null || amount === undefined) return '-';
    return Number(amount).toFixed(2);
  }

  /**
   * 协议状态文案(0=待付 1=成功)
   */
  function statusLabel(status?: number): string {
    if (status === 1) return $t('plugin.easypay.order.status.success');
    if (status === 0) return $t('plugin.easypay.order.status.pending');
    return '-';
  }

  /**
   * 协议状态颜色(成功绿色, 其余默认)
   */
  function statusColor(status?: number): string {
    return status === 1 ? 'green' : 'default';
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
    // 同步(非成功 + 管理权限)
    if (canManage && row.status !== 1) {
      items.push({ key: 'sync', label: $t('plugin.easypay.order.action.sync') });
    }
    // 关单(待付 + 管理权限, 危险操作)
    if (canManage && row.status === 0) {
      items.push({ key: 'close', label: $t('plugin.easypay.order.action.close'), danger: true });
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
          <!-- 平台业务单号 -->
          <vxe-column field="tradeNo" :title="$t('plugin.easypay.order.field.tradeNo')" :min-width="200" show-overflow />
          <!-- 商户订单号 -->
          <vxe-column field="outTradeNo" :title="$t('plugin.easypay.order.field.outTradeNo')" :min-width="180" show-overflow />
          <!-- 商品名称 -->
          <vxe-column field="name" :title="$t('plugin.easypay.order.field.name')" :min-width="160" show-overflow />
          <!-- 订单金额(元) -->
          <vxe-column field="money" :title="$t('plugin.easypay.order.field.money')" :min-width="100" align="right">
            <template #default="{ row }">{{ formatMoney(row.money) }}</template>
          </vxe-column>
          <!-- 协议状态 -->
          <vxe-column field="status" :title="$t('plugin.easypay.order.field.status')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">{{ statusLabel(row.status) }}</a-tag>
            </template>
          </vxe-column>
          <!-- 支付方式 -->
          <vxe-column field="type" :title="$t('plugin.easypay.order.field.type')" :min-width="120" show-overflow />
          <!-- 协议版本 -->
          <vxe-column field="apiVersion" :title="$t('plugin.easypay.order.field.apiVersion')" :min-width="110" show-overflow />
          <!-- 商户: 名称上 + 号下小字两排 -->
          <vxe-column field="mchName" :title="$t('plugin.easypay.order.field.merchant')" :min-width="160">
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
                  <a href="javascript:">
                    {{ $t('common.more') }}
                    <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                  </a>
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
        <!-- 订单信息 -->
        <a-divider orientation="left" plain>{{ $t('plugin.easypay.order.section.order') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.merchant')">
            {{ detail.mchName || '-' }}
            <span v-if="detail.mchNo" class="text-muted-foreground"> ({{ detail.mchNo }})</span>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.orderId')">
            {{ detail.orderId || detail.id || '-' }}
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
          <a-descriptions-item :label="$t('plugin.easypay.order.field.money')">
            ¥{{ formatMoney(detail.money) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.refundMoney')">
            ¥{{ formatMoney(detail.refundMoney) }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.status')">
            <a-tag :color="statusColor(detail.status)">{{ statusLabel(detail.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.type')">
            {{ detail.type || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 时间信息 -->
        <a-divider orientation="left" plain>{{ $t('plugin.easypay.order.section.time') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.createTime')">
            {{ detail.createTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.addTime')">
            {{ detail.addTime || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.endTime')">
            {{ detail.endTime || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 应用与协议 -->
        <a-divider orientation="left" plain>{{ $t('plugin.easypay.order.section.app') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.pid')">
            {{ detail.pid ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.appId')">
            {{ detail.appId || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.apiVersion')">
            {{ detail.apiVersion || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.pcCallType')">
            {{ detail.pcCallType || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 支付与回调 -->
        <a-divider orientation="left" plain>{{ $t('plugin.easypay.order.section.pay') }}</a-divider>
        <a-descriptions :column="2" size="small" bordered>
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
          <a-descriptions-item :label="$t('plugin.easypay.order.field.notifyUrl')" :span="2">
            {{ detail.notifyUrl || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.returnUrl')" :span="2">
            {{ detail.returnUrl || '-' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('plugin.easypay.order.field.param')" :span="2">
            {{ detail.param || '-' }}
          </a-descriptions-item>
        </a-descriptions>
      </a-spin>

      <template #footer>
        <a-button @click="handleDrawerClose">{{ $t('common.close') }}</a-button>
      </template>
    </a-drawer>
  </div>
</template>
