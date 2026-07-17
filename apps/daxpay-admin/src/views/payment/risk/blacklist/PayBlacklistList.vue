<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    PayBlacklistApi,
    type PayBlacklistQuery,
    type PayBlacklistVo,
  } from '#/api/payment/risk/blacklist.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import PayBlacklistEdit from './PayBlacklistEdit.vue';

  defineOptions({ name: 'PayBlacklistList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const queryForm = ref<PayBlacklistQuery>({});
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<PayBlacklistVo[]>([]);
  const editRef = ref();

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'list',
      field: 'type',
      // 类型
      name: $t('payment.risk.blacklist.field.type'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.risk.blacklist.type.ip'), value: 'ip' },
        { label: $t('payment.risk.blacklist.type.open_id'), value: 'open_id' },
      ],
    },
    {
      type: 'string',
      field: 'value',
      // 名单值
      name: $t('payment.risk.blacklist.field.value'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'status',
      // 状态
      name: $t('payment.risk.blacklist.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.risk.blacklist.status.enable'), value: 'enable' },
        { label: $t('payment.risk.blacklist.status.disable'), value: 'disable' },
      ],
    },
    {
      type: 'string',
      field: 'channel',
      // 通道族
      name: $t('payment.risk.blacklist.field.channel'),
      placeholder: $t('common.pleaseInput'),
    },
  ]);

  /** 分页查询 */
  function queryPage() {
    loading.value = true;
    return PayBlacklistApi.page({
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

  function handleAdd() {
    editRef.value?.showAdd();
  }

  function handleEdit(row: PayBlacklistVo) {
    editRef.value?.showEdit(row);
  }

  function handleView(row: PayBlacklistVo) {
    editRef.value?.showView(row);
  }

  function handleDelete(row: PayBlacklistVo) {
    confirm({
      title: $t('common.confirm'),
      content: $t('payment.risk.blacklist.confirmDelete'),
      okText: $t('common.delete'),
      cancelText: $t('common.cancel'),
      onOk() {
        return PayBlacklistApi.delete(row.id!).then(() => {
          message.success($t('common.deleteSuccess'));
          queryPage();
        });
      },
    });
  }

  function typeLabel(type?: string) {
    if (type === 'open_id') return $t('payment.risk.blacklist.type.open_id');
    if (type === 'ip') return $t('payment.risk.blacklist.type.ip');
    return type || '';
  }

  function statusColor(status?: string) {
    return status === 'enable' ? 'success' : 'default';
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

    <!-- openId 名单与码牌支付方式关系说明 -->
    <div class="mt-4">
      <a-alert
        :message="$t('payment.risk.blacklist.tip.openIdCodePayHint')"
        type="info"
        show-icon
      />
    </div>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-button
              v-if="hasPermission(PermCodes.Payment.Risk.Blacklist.MANAGE)"
              type="primary"
              @click="handleAdd"
            >
              <template #icon>
                <IconifyIcon icon="ant-design:plus-outlined" />
              </template>
              <!-- 新增黑名单 -->
              {{ $t('payment.risk.blacklist.add') }}
            </a-button>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 类型 -->
          <vxe-column field="type" :title="$t('payment.risk.blacklist.field.type')" width="100">
            <template #default="{ row }">{{ typeLabel(row.type) }}</template>
          </vxe-column>
          <!-- 名单值 -->
          <vxe-column field="value" :title="$t('payment.risk.blacklist.field.value')" :min-width="180" />
          <!-- 通道 -->
          <vxe-column field="channel" :title="$t('payment.risk.blacklist.field.channel')" width="100" />
          <!-- 状态 -->
          <vxe-column field="status" :title="$t('payment.risk.blacklist.field.status')" width="100">
            <template #default="{ row }">
              <a-tag :color="statusColor(row.status)">
                {{
                  row.status === 'enable'
                    ? $t('payment.risk.blacklist.status.enable')
                    : $t('payment.risk.blacklist.status.disable')
                }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 原因 -->
          <vxe-column field="reason" :title="$t('payment.risk.blacklist.field.reason')" :min-width="140" />
          <!-- 过期 -->
          <vxe-column field="expireTime" :title="$t('payment.risk.blacklist.field.expireTime')" width="170" />
          <!-- 创建时间 -->
          <vxe-column field="createTime" :title="$t('payment.risk.blacklist.field.createTime')" width="170" />
          <vxe-column fixed="right" :width="200" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Payment.Risk.Blacklist.VIEW)"
                  type="link"
                  size="small"
                  @click="handleView(row)"
                >
                  {{ $t('common.view') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Payment.Risk.Blacklist.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                >
                  {{ $t('common.edit') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Payment.Risk.Blacklist.MANAGE)"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(row)"
                >
                  {{ $t('common.delete') }}
                </a-button>
              </a-space>
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

    <PayBlacklistEdit ref="editRef" @ok="queryPage" />
  </div>
</template>
