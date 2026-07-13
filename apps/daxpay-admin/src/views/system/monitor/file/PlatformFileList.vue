<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type PlatformFile, PlatformFileApi } from '#/api/system/platform-file.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useApiPrefix } from '#/hooks/useApiPrefix';
  import { usePermission } from '#/hooks/usePermission';

  import PlatformFileDetail from './PlatformFileDetail.vue';
  const apiPrefix = useApiPrefix();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const platformFileDetail = ref();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 表格数据
  const tableData = ref<PlatformFile[]>([]);

  // 访问类型选项
  const accessTypeOptions = computed(() => [
    { label: $t('system.file.platform.accessType.public'), value: 'public' },
    { label: $t('system.file.platform.accessType.private'), value: 'private' },
  ]);

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'filename',
      name: $t('system.file.platform.field.filename'),
      // 国际化：请输入文件名称
      placeholder: $t('system.file.platform.placeholder.filename'),
    },
    {
      type: 'string',
      field: 'originalFilename',
      // 国际化：原始文件名
      name: $t('system.file.platform.field.originalFilename'),
      // 国际化：请输入原始文件名
      placeholder: $t('system.file.platform.placeholder.originalFilename'),
    },
    {
      type: 'list',
      field: 'accessType',
      // 国际化：访问类型
      name: $t('system.file.platform.field.accessType'),
      placeholder: $t('common.pleaseSelect'),
      selectList: accessTypeOptions.value,
    },
    {
      type: 'string',
      field: 'bizType',
      // 国际化：业务分类
      name: $t('system.file.platform.field.bizType'),
      // 国际化：请输入业务分类
      placeholder: $t('system.file.platform.placeholder.bizType'),
    },
  ]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    PlatformFileApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    }).then((res: any) => {
      tableData.value = res.data.records || [];
      pageConfig.value.total = Number(res.data.total) || 0;
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
   * 查看详情
   */
  function handleView(row: PlatformFile) {
    platformFileDetail.value?.init(row.id);
  }

  /**
   * 预览文件
   */
  function handlePreview(row: PlatformFile) {
    window.open(`${apiPrefix}/file/platform/access/${row.filename}`, '_blank');
  }

  /**
   * 下载文件
   */
  function handleDownload(row: PlatformFile) {
    window.open(`${apiPrefix}/file/platform/download/${row.filename}`, '_blank');
  }

  /**
   * 格式化文件大小
   */
  function formatSize(size: number): string {
    if (!size) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
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
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }"> </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 文件名称 -->
          <vxe-column field="filename" :title="$t('system.file.platform.field.filename')" :min-width="220">
            <template #default="{ row }">
              <a v-if="hasPermission(PermCodes.System.File.VIEW)" href="javascript:" @click="handleView(row)">{{
                row.filename
              }}</a>
              <span v-else>{{ row.filename }}</span>
            </template>
          </vxe-column>
          <!-- 原始文件名 -->
          <vxe-column
            field="originalFilename"
            :title="$t('system.file.platform.field.originalFilename')"
            :min-width="180"
          />
          <!-- 文件大小 -->
          <vxe-column field="size" :title="$t('system.file.platform.field.size')" :min-width="100" align="right">
            <template #default="{ row }">
              {{ formatSize(row.size) }}
            </template>
          </vxe-column>
          <!-- 扩展名 -->
          <vxe-column field="ext" :title="$t('system.file.platform.field.ext')" :min-width="80" align="center" />
          <!-- 访问类型 -->
          <vxe-column
            field="accessType"
            :title="$t('system.file.platform.field.accessType')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <!-- 国际化：公开文件 -->
              <a-tag v-if="row.accessType === 'public'" color="green">{{
                $t('system.file.platform.accessType.public')
              }}</a-tag>
              <!-- 国际化：私有文件 -->
              <a-tag v-else color="orange">{{ $t('system.file.platform.accessType.private') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 业务分类 -->
          <vxe-column field="bizType" :title="$t('system.file.platform.field.bizType')" :min-width="100" align="center">
            <template #default="{ row }">
              {{ row.bizType || '-' }}
            </template>
          </vxe-column>
          <!-- 创建时间 -->
          <vxe-column field="createTime" :title="$t('system.file.platform.field.createTime')" :min-width="180" formatter="formatDateTime" />
          <!-- 操作 -->
          <vxe-column fixed="right" :width="160" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <!-- 预览 -->
                <a v-if="hasPermission(PermCodes.System.File.VIEW)" href="javascript:" @click="handlePreview(row)">{{
                  $t('system.file.platform.action.preview')
                }}</a>
                <!-- 下载 -->
                <a v-if="hasPermission(PermCodes.System.File.VIEW)" href="javascript:" @click="handleDownload(row)">{{
                  $t('system.file.platform.action.download')
                }}</a>
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

    <PlatformFileDetail ref="platformFileDetail" />
  </div>
</template>
