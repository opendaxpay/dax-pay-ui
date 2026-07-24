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
  import {
    type WxPlatformApp,
    WxPlatformAppApi,
  } from '#/api/payment/wx/platform-app.api';
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
  // 平台应用名缓存（列表作用范围展示）
  const platformAppNameMap = ref<Record<string, string>>({});

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'list',
      field: 'type',
      // 类型
      name: $t('payment.risk.blacklist.field.type'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.risk.blacklist.type.ip'), value: 'ip' },
        { label: $t('payment.risk.blacklist.type.alipay_user'), value: 'alipay_user' },
        { label: $t('payment.risk.blacklist.type.wechat_openid'), value: 'wechat_openid' },
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
  ]);

  /** 加载平台应用名称映射 */
  async function loadPlatformAppNames() {
    try {
      const { data } = await WxPlatformAppApi.listAll();
      const map: Record<string, string> = {};
      (data || []).forEach((app: WxPlatformApp) => {
        if (app.wxAppId) {
          map[app.wxAppId] = app.appName || app.wxAppId;
        }
      });
      platformAppNameMap.value = map;
    } catch {
      platformAppNameMap.value = {};
    }
  }

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

  /** 类型列 */
  function typeLabel(type?: string) {
    if (type === 'ip') {
      return $t('payment.risk.blacklist.type.ip');
    }
    if (type === 'alipay_user') {
      return $t('payment.risk.blacklist.type.alipay_user');
    }
    if (type === 'wechat_openid') {
      return $t('payment.risk.blacklist.type.wechat_openid');
    }
    return type || '';
  }

  /** 作用范围：全局 / 应用名或 AppId */
  function scopeLabel(row: PayBlacklistVo) {
    if (row.type === 'ip' || row.type === 'alipay_user') {
      return $t('payment.risk.blacklist.scope.global');
    }
    if (row.type === 'wechat_openid' && row.wxAppId) {
      const name = platformAppNameMap.value[row.wxAppId];
      return name ? `${name}（${row.wxAppId}）` : row.wxAppId;
    }
    return '-';
  }

  function statusColor(status?: string) {
    return status === 'enable' ? 'success' : 'default';
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    void loadPlatformAppNames();
    queryPage();
  });
</script>

<template>
  <div class="m-3 rounded-lg bg-background p-3 list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

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
          <vxe-column field="type" :title="$t('payment.risk.blacklist.field.type')" width="120">
            <template #default="{ row }">{{ typeLabel(row.type) }}</template>
          </vxe-column>
          <!-- 名单值 -->
          <vxe-column field="value" :title="$t('payment.risk.blacklist.field.value')" :min-width="180" />
          <!-- 作用范围 -->
          <vxe-column field="wxAppId" :title="$t('payment.risk.blacklist.field.scope')" :min-width="200">
            <template #default="{ row }">{{ scopeLabel(row) }}</template>
          </vxe-column>
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
