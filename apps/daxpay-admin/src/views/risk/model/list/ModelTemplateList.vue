<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { ModelTemplateApi, InputParamSetApi, type ModelTemplateResult } from '#/api/risk/model.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import ModelTemplateEdit from './ModelTemplateEdit.vue';

  const router = useRouter();
  const { message, confirm } = useMessage();
  const { hasPermission } = usePermission();

  // 加载中
  const loading = ref(false);
  // 表格实例
  const xTable = ref<VxeTableInstance>();
  // 工具栏实例
  const xToolbar = ref<VxeToolbarInstance>();
  // 编辑弹窗引用
  const modelEdit = ref();

  // 参数集合下拉选项（用于列表中code转name）
  const inputParamSetOptions = ref<LabelValue[]>([]);

  // 查询表单数据
  const queryForm = ref<Record<string, any>>({});

  // 查询字段定义
  const queryFields = computed<QueryField[]>(() => [
    // 国际化：模型ID查询字段
    {
      type: 'string',
      field: 'modelId',
      name: $t('risk.model.base.field.modelId'),
      placeholder: $t('risk.model.form.add.modelIdPlaceholder'),
    },
    // 国际化：模型名称查询字段
    {
      type: 'string',
      field: 'modelName',
      name: $t('risk.model.base.field.modelName'),
      placeholder: $t('risk.model.form.add.modelNamePlaceholder'),
    },
    {
      type: 'list',
      field: 'status',
      name: $t('risk.model.base.field.status'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('risk.model.base.status.draft'), value: 'DRAFT' },
        { label: $t('risk.model.base.status.published'), value: 'PUBLISHED' },
        { label: $t('risk.model.base.status.disabled'), value: 'DISABLED' },
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
  const tableData = ref<ModelTemplateResult[]>([]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    loadInputParamSetOptions();
    queryPage();
  });

  /** 加载参数集合下拉选项 */
  function loadInputParamSetOptions() {
    InputParamSetApi.dropdown().then((res: any) => {
      inputParamSetOptions.value = res.data || [];
    });
  }

  /** 根据参数集编码获取名称 */
  function getInputParamSetName(code: string) {
    const option = inputParamSetOptions.value.find((o) => o.value === code);
    return option ? option.label : code;
  }

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    ModelTemplateApi.page({
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
    modelEdit.value?.show();
  }

  /**
   * 编辑
   */
  function handleEdit(row: ModelTemplateResult) {
    modelEdit.value?.showEdit(row.id);
  }

  /**
   * 删除
   */
  function handleDelete(row: ModelTemplateResult) {
    confirm({
      // 国际化：删除确认提示
      content: $t('risk.model.base.action.confirmDelete'),
      onOk: () => {
        ModelTemplateApi.delete(row.id!).then(() => {
          message.success($t('common.success'));
          queryPage();
        });
      },
    });
  }

  /**
   * 管理
   */
  function handleManage(row: ModelTemplateResult) {
    router.push({ path: '/risk/model/manage', query: { modelId: row.modelId! } });
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
              <a-button v-if="hasPermission(PermCodes.Risk.Model.ADD)" type="primary" @click="handleAdd">{{
                $t('common.add')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 模型ID -->
          <vxe-column field="modelId" :title="$t('risk.model.base.field.modelId')" :min-width="180" />
          <!-- 模型名称 -->
          <vxe-column field="modelName" :title="$t('risk.model.base.field.modelName')" :min-width="180" />
          <!-- 描述 -->
          <vxe-column field="description" :title="$t('risk.model.base.field.description')" :min-width="200" />
          <!-- 参数集合 -->
          <vxe-column field="inputParamSetCode" :title="$t('risk.model.base.field.inputParamSetCode')" :min-width="150">
            <template #default="{ row }">
              {{ getInputParamSetName(row.inputParamSetCode) }}
            </template>
          </vxe-column>
          <!-- 状态 -->
          <vxe-column field="status" :title="$t('risk.model.base.field.status')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.status === 'DRAFT'" color="blue">{{ $t('risk.model.base.status.draft') }}</a-tag>
              <a-tag v-else-if="row.status === 'PUBLISHED'" color="green">{{
                $t('risk.model.base.status.published')
              }}</a-tag>
              <a-tag v-else-if="row.status === 'DISABLED'" color="red">{{
                $t('risk.model.base.status.disabled')
              }}</a-tag>
            </template>
          </vxe-column>
          <!-- 操作 -->
          <vxe-column fixed="right" width="160" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleManage(row)">{{
                  $t('risk.model.base.action.manage')
                }}</a-button>
                <a-button type="link" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</a-button>
                <a-button type="link" size="small" danger @click="handleDelete(row)">{{
                  $t('common.delete')
                }}</a-button>
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

    <ModelTemplateEdit ref="modelEdit" @ok="queryPage" />
  </div>
</template>
