<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { ModelInstanceApi, ModelTemplateApi, type ModelInstanceResult } from '#/api/risk/model.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import ModelInstanceEdit from './ModelInstanceEdit.vue';

  defineOptions({ name: 'ModelInstanceList' });

  const router = useRouter();
  const { message, confirm } = useMessage();
  const { hasPermission } = usePermission();

  // 模型实例权限
  // 加载中
  const loading = ref(false);
  // 表格实例
  const xTable = ref<VxeTableInstance>();
  // 工具栏实例
  const xToolbar = ref<VxeToolbarInstance>();
  // 编辑弹窗引用
  const instanceEdit = ref();

  // 模型模板下拉选项
  const modelTemplateOptions = ref<LabelValue[]>([]);

  // 查询表单数据
  const queryForm = ref<Record<string, any>>({});

  // 查询字段定义
  const queryFields = computed<QueryField[]>(() => [
    // 国际化：实例标识查询字段
    {
      type: 'string',
      field: 'instanceId',
      name: $t('risk.modelInstance.base.field.instanceId'),
      placeholder: $t('risk.modelInstance.base.field.instanceId'),
    },
    // 国际化：模型标识查询字段
    {
      type: 'list',
      field: 'modelId',
      name: $t('risk.modelInstance.base.field.modelId'),
      placeholder: $t('common.pleaseSelect'),
      selectList: modelTemplateOptions.value,
    },
    // 国际化：实例名称查询字段
    {
      type: 'string',
      field: 'instanceName',
      name: $t('risk.modelInstance.base.field.instanceName'),
      placeholder: $t('risk.modelInstance.form.add.instanceNamePlaceholder'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('risk.modelInstance.base.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('risk.modelInstance.base.status.draft'), value: 'DRAFT' },
        { label: $t('risk.modelInstance.base.status.published'), value: 'PUBLISHED' },
        { label: $t('risk.modelInstance.base.status.disabled'), value: 'DISABLED' },
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
  const tableData = ref<ModelInstanceResult[]>([]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    loadModelTemplateOptions();
    queryPage();
  });

  /** 加载模型模板下拉选项 */
  function loadModelTemplateOptions() {
    ModelTemplateApi.dropdown().then((res: any) => {
      modelTemplateOptions.value = res.data || [];
    });
  }

  /** 根据模型ID获取名称 */
  function getModelName(modelId: string) {
    const option = modelTemplateOptions.value.find((o) => o.value === modelId);
    return option ? option.label : modelId;
  }

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    ModelInstanceApi.page({
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
    instanceEdit.value?.show();
  }

  /**
   * 编辑
   */
  function handleEdit(row: ModelInstanceResult) {
    instanceEdit.value?.showEdit(row.id);
  }

  /**
   * 配置
   */
  function handleManage(row: ModelInstanceResult) {
    router.push({ path: '/risk/model/instance/manage', query: { instanceId: row.instanceId! } });
  }

  /**
   * 删除
   */
  function handleDelete(row: ModelInstanceResult) {
    confirm({
      // 国际化：删除确认提示
      content: $t('risk.modelInstance.base.action.confirmDelete'),
      onOk: () => {
        ModelInstanceApi.delete(row.id!).then(() => {
          message.success($t('common.success'));
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
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <a-button v-if="hasPermission(PermCodes.Risk.ModelInstance.ADD)" type="primary" @click="handleAdd">{{
                $t('common.add')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 实例标识 -->
          <vxe-column field="instanceId" :title="$t('risk.modelInstance.base.field.instanceId')" :min-width="180" />
          <!-- 实例名称 -->
          <vxe-column field="instanceName" :title="$t('risk.modelInstance.base.field.instanceName')" :min-width="160" />
          <!-- 模型标识 -->
          <vxe-column field="modelId" :title="$t('risk.modelInstance.base.field.modelId')" :min-width="180">
            <template #default="{ row }">
              {{ getModelName(row.modelId) }}
            </template>
          </vxe-column>
          <!-- 状态 -->
          <vxe-column
            field="status"
            :title="$t('risk.modelInstance.base.field.status')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.status === 'DRAFT'" color="blue">{{ $t('risk.modelInstance.base.status.draft') }}</a-tag>
              <a-tag v-else-if="row.status === 'PUBLISHED'" color="green">{{
                $t('risk.modelInstance.base.status.published')
              }}</a-tag>
              <a-tag v-else-if="row.status === 'DISABLED'" color="red">{{
                $t('risk.modelInstance.base.status.disabled')
              }}</a-tag>
            </template>
          </vxe-column>
          <!-- 创建时间 -->
          <vxe-column field="createTime" :title="$t('risk.modelInstance.base.field.createTime')" :min-width="170" formatter="formatDateTime" />
          <!-- 操作 -->
          <vxe-column fixed="right" width="180" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Risk.ModelInstance.VIEW)"
                  type="link"
                  size="small"
                  @click="handleManage(row)"
                  >{{ $t('risk.modelInstance.base.action.manage') }}</a-button
                >
                <a-button
                  v-if="hasPermission(PermCodes.Risk.ModelInstance.EDIT)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                  >{{ $t('common.edit') }}</a-button
                >
                <a-button
                  v-if="hasPermission(PermCodes.Risk.ModelInstance.DELETE)"
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
          :total="pageConfig.total"
          @page-change="handlePageChange"
        />
      </a-card>
    </div>

    <ModelInstanceEdit ref="instanceEdit" @ok="queryPage" />
  </div>
</template>
