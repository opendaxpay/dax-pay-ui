<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { NotifyNoticeApi } from '#/api/system/notify/notice.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { FormEditType } from '#/enums/formEditType';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import NoticeEdit from './NoticeEdit.vue';

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const noticeEdit = ref();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'title',
      name: $t('system.notify.titleField'),
      placeholder: $t('system.notify.inputTitle'),
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
    NotifyNoticeApi.page({
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
   * 新增
   */
  function handleAdd() {
    noticeEdit.value.init(undefined, FormEditType.Add);
  }

  /**
   * 编辑
   */
  function handleEdit(row: any) {
    noticeEdit.value.init(row.id, FormEditType.Edit);
  }

  /**
   * 查看
   */
  function handleView(row: any) {
    noticeEdit.value.init(row.id, FormEditType.Show);
  }

  /**
   * 发布
   */
  function handlePublish(row: any) {
    confirm({
      title: $t('system.notify.publish'),
      content: $t('system.notify.confirmPublish'),
      onOk: () => {
        NotifyNoticeApi.publish(row.id!).then(() => {
          message.success($t('common.saveSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 下线
   */
  function handleOffline(row: any) {
    confirm({
      title: $t('system.notify.offline'),
      content: $t('system.notify.confirmOffline'),
      onOk: () => {
        NotifyNoticeApi.offline(row.id!).then(() => {
          message.success($t('common.saveSuccess'));
          queryPage();
        });
      },
    });
  }

  /**
   * 删除
   */
  function handleDelete(row: any) {
    confirm({
      title: $t('common.delete'),
      content: $t('system.notify.confirmDelete'),
      onOk: () => {
        NotifyNoticeApi.delete(row.id!).then(() => {
          message.success($t('common.deleteSuccess'));
          queryPage();
        });
      },
    });
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
  <div class="m-3 list-page-compact rounded-lg bg-background p-3">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <!-- 新增 -->
              <a-button v-if="hasPermission(PermCodes.System.Notify.ADD)" type="primary" @click="handleAdd">{{
                $t('system.notify.add')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <!-- 数据表格 -->
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 标题 -->
          <vxe-column field="title" :title="$t('system.notify.titleField')" :min-width="220" />
          <!-- 重要程度 -->
          <vxe-column field="severity" :title="$t('system.notify.severity')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.severity === 'important'" color="red">{{ $t('system.notify.severityImportant') }}</a-tag>
              <a-tag v-else>{{ $t('system.notify.severityNormal') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 置顶 -->
          <vxe-column field="isTop" :title="$t('system.notify.isTop')" :min-width="80" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.isTop" color="gold">{{ $t('system.notify.isTop') }}</a-tag>
              <span v-else>-</span>
            </template>
          </vxe-column>
          <!-- 状态 -->
          <vxe-column field="status" :title="$t('system.notify.status')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.status === 'draft'">{{ $t('system.notify.statusDraft') }}</a-tag>
              <a-tag v-else-if="row.status === 'published'" color="green">{{
                $t('system.notify.statusPublished')
              }}</a-tag>
              <a-tag v-else color="default">{{ $t('system.notify.statusOffline') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 生效时间 -->
          <vxe-column
            field="effectiveTime"
            :title="$t('system.notify.effectiveTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <!-- 创建时间 -->
          <vxe-column
            field="createTime"
            :title="$t('system.notify.createTime')"
            :min-width="160"
            formatter="formatDateTime"
          />
          <!-- 操作 -->
          <vxe-column fixed="right" width="280" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <!-- 查看 -->
                <a-button
                  v-if="hasPermission(PermCodes.System.Notify.VIEW)"
                  type="link"
                  size="small"
                  @click="handleView(row)"
                  >{{ $t('common.view') }}</a-button
                >
                <!-- 编辑 -->
                <a-button
                  v-if="hasPermission(PermCodes.System.Notify.ADD)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                  >{{ $t('common.edit') }}</a-button
                >
                <!-- 发布 -->
                <a-button
                  v-if="row.status === 'draft' && hasPermission(PermCodes.System.Notify.PUBLISH)"
                  type="link"
                  size="small"
                  @click="handlePublish(row)"
                  >{{ $t('system.notify.publish') }}</a-button
                >
                <!-- 下线 -->
                <a-button
                  v-if="row.status === 'published' && hasPermission(PermCodes.System.Notify.PUBLISH)"
                  type="link"
                  size="small"
                  danger
                  @click="handleOffline(row)"
                  >{{ $t('system.notify.offline') }}</a-button
                >
                <!-- 删除 -->
                <a-button
                  v-if="hasPermission(PermCodes.System.Notify.ADD)"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(row)"
                  >{{ $t('common.delete') }}</a-button
                >
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
      </a-card>
    </div>

    <NoticeEdit ref="noticeEdit" @ok="queryPage" />
  </div>
</template>
