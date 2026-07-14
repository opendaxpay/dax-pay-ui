<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { WechatMessageApi } from '#/api/system/notify/wechat.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'WechatNotifyRecord' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'openId',
      name: $t('system.notify.openId'),
      placeholder: $t('system.notify.openId'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('system.notify.sendStatus'),
      placeholder: $t('system.notify.statusFilterPlaceholder'),
      selectList: [
        { label: $t('system.notify.statusSuccess'), value: 'success' },
        { label: $t('system.notify.statusFailed'), value: 'failed' },
        { label: $t('system.notify.statusSending'), value: 'sending' },
      ],
    },
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 表格数据
  const tableData = ref<any[]>([]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    WechatMessageApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res: any) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = Number(res.data.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
    return Promise.resolve();
  }

  /**
   * 重置查询
   */
  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /**
   * 重发失败消息
   */
  function handleResend(row: any) {
    confirm({
      title: $t('system.notify.resend'),
      content: $t('system.notify.confirmResend'),
      onOk: () => {
        WechatMessageApi.resend(row.id).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 消息类型展示
   */
  function formatMessageType(type?: string) {
    if (type === 'template') {
      return $t('system.notify.typeTemplate');
    }
    if (type === 'uniform') {
      return $t('system.notify.typeUniform');
    }
    return type || '-';
  }

  /**
   * 业务场景展示
   */
  function formatScene(scene?: string) {
    if (scene === 'trade') {
      return $t('system.notify.sceneTrade');
    }
    if (scene === 'operate') {
      return $t('system.notify.sceneOperate');
    }
    return scene || '-';
  }

  /**
   * 分页变化
   */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }
</script>

<template>
  <div class="list-page-compact">
    <div class="mb-3">
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </div>

    <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }" />
    <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
      <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
      <vxe-column field="messageType" :title="$t('system.notify.wechatMessageType')" :min-width="120" align="center">
        <template #default="{ row }">
          <a-tag>{{ formatMessageType(row.messageType) }}</a-tag>
        </template>
      </vxe-column>
      <vxe-column field="scene" :title="$t('system.notify.scene')" :min-width="110" align="center">
        <template #default="{ row }">
          {{ formatScene(row.scene) }}
        </template>
      </vxe-column>
      <vxe-column field="userId" :title="$t('system.notify.userId')" :min-width="100" align="center" />
      <vxe-column field="openId" :title="$t('system.notify.openId')" :min-width="200" />
      <vxe-column field="status" :title="$t('system.notify.sendStatus')" :min-width="100" align="center">
        <template #default="{ row }">
          <a-tag v-if="row.status === 'success'" color="green">{{ $t('system.notify.statusSuccess') }}</a-tag>
          <a-tag v-else-if="row.status === 'failed'" color="red">{{ $t('system.notify.statusFailed') }}</a-tag>
          <a-tag v-else>{{ $t('system.notify.statusSending') }}</a-tag>
        </template>
      </vxe-column>
      <vxe-column
        field="sendTime"
        :title="$t('system.notify.sendTime')"
        :min-width="160"
        formatter="formatDateTime"
      />
      <vxe-column field="errorMsg" :title="$t('system.notify.errorMsgField')" :min-width="220">
        <template #default="{ row }">
          <span v-if="row.errorMsg" class="text-red-500">{{ row.errorMsg }}</span>
          <span v-else>-</span>
        </template>
      </vxe-column>
      <vxe-column fixed="right" width="100" :show-overflow="false" :title="$t('common.operation')">
        <template #default="{ row }">
          <a-space :size="2">
            <template #separator>
              <a-divider type="vertical" />
            </template>
            <a-button
              v-if="row.status === 'failed' && hasPermission(PermCodes.System.WechatNotify.RESEND)"
              type="link"
              size="small"
              @click="handleResend(row)"
            >
              {{ $t('system.notify.resend') }}
            </a-button>
          </a-space>
        </template>
      </vxe-column>
    </vxe-table>
    <vxe-pager
      size="medium"
      :loading="loading"
      :current-page="pageConfig.currentPage"
      :page-size="pageConfig.pageSize"
      :total="Number(pageConfig.total)"
      @page-change="handlePageChange"
    />
  </div>
</template>
