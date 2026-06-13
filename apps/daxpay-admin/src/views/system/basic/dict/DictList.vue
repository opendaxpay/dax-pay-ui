<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DictApi } from '#/api/system/dict/dict.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { FormEditType } from '#/enums/formEditType';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import DictEdit from './DictEdit.vue';
  import DictItemList from './DictItemList.vue';

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const dictEdit = ref();
  const dictItemList = ref();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'code',
      name: $t('system.dict.code'),
      // 国际化：请输入字典编码
      placeholder: $t('system.dict.inputCode'),
    },
    {
      type: 'string',
      field: 'nameCn',
      name: $t('common.chineseName'),
      // 国际化：请输入中文名称
      placeholder: $t('system.dict.inputNameCn'),
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
    DictApi.page({
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
    dictEdit.value.init(undefined, FormEditType.Add);
  }

  /**
   * 编辑
   */
  function handleEdit(row: any) {
    dictEdit.value.init(row.id, FormEditType.Edit);
  }

  /**
   * 字典配置
   */
  function handleConfig(row: any) {
    dictItemList.value.open(row.id);
  }

  /**
   * 删除
   */
  function handleDelete(row: any) {
    confirm({
      // 删除确认
      title: $t('system.dict.delete'),
      // 确认删除内容
      content: $t('system.dict.confirmDelete'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: () => {
        DictApi.delete(row.id!).then(() => {
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
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <!-- 新增 -->
              <a-button v-if="hasPermission(PermCodes.System.Dict.MANAGE)" type="primary" @click="handleAdd">{{
                $t('common.add')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <!-- 数据表格 -->
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 字典编码 -->
          <vxe-column field="code" :title="$t('system.dict.code')" :min-width="150" />
          <!-- 中文名称 -->
          <vxe-column field="nameCn" :title="$t('common.chineseName')" :min-width="150" />
          <!-- 英文名称 -->
          <vxe-column field="nameEn" :title="$t('common.englishName')" :min-width="150" />
          <!-- 启用状态 -->
          <vxe-column field="enable" :title="$t('system.dict.enable')" :min-width="100" align="center">
            <template #default="{ row }">
              <!-- 启用 -->
              <a-tag v-if="row.enable" color="green">{{ $t('system.dict.enabled') }}</a-tag>
              <!-- 停用 -->
              <a-tag v-else color="red">{{ $t('system.dict.disabled') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 内置字典 -->
          <vxe-column field="internal" :title="$t('system.dict.internal')" :min-width="100" align="center">
            <template #default="{ row }">
              <!-- 是 -->
              <a-tag v-if="row.internal" color="blue">{{ $t('system.dict.yes') }}</a-tag>
              <!-- 否 -->
              <a-tag v-else>{{ $t('system.dict.no') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 备注 -->
          <vxe-column field="remark" :title="$t('system.dict.remark')" :min-width="150" />
          <!-- 创建时间 -->
          <vxe-column field="createTime" :title="$t('system.dict.createTime')" :min-width="160" formatter="formatDateTime" />
          <!-- 操作 -->
          <vxe-column fixed="right" width="200" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <!-- 编辑 -->
                <a-button
                  v-if="hasPermission(PermCodes.System.Dict.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                  >{{ $t('common.edit') }}</a-button
                >
                <!-- 字典配置 -->
                <a-button
                  v-if="hasPermission(PermCodes.System.DictItem.VIEW)"
                  type="link"
                  size="small"
                  @click="handleConfig(row)"
                  >{{ $t('system.dict.config') }}</a-button
                >
                <!-- 删除 -->
                <a-button
                  v-if="hasPermission(PermCodes.System.Dict.MANAGE)"
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

    <DictEdit ref="dictEdit" @ok="queryPage" />
    <DictItemList ref="dictItemList" />
  </div>
</template>
