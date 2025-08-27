<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query
        :query-params="model.queryParam"
        :fields="fields"
        @query="queryPage"
        @reset="resetQueryParams"
      />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }" />
      <div class="h-65vh">
        <vxe-table
          height="auto"
          key-field="id"
          ref="xTable"
          :data="pagination.records"
          :loading="loading"
        >
          <vxe-column type="seq" width="60" />
          <vxe-column field="code" title="编码" :min-width="150" />
          <vxe-column field="name" title="名称" :min-width="170" />
          <vxe-column field="enable" title="是否启用" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.enable" color="green">启用</a-tag>
              <a-tag v-else color="red">停用</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="isv" title="服务商" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.isv" color="green">支持</a-tag>
              <a-tag v-else color="red">不支持</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="allocatable" title="分账" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.allocatable" color="green">支持</a-tag>
              <a-tag v-else color="red">不支持</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="terminal" title="终端报送" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.terminal" color="green">支持</a-tag>
              <a-tag v-else color="red">不支持</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="remark" title="备注" :min-width="150" />
        </vxe-table>
      </div>
      <vxe-pager
        size="medium"
        :loading="loading"
        :current-page="pagination.current"
        :page-size="pagination.size"
        :total="pagination.total"
        @page-change="handleTableChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { page } from './ChannelConst.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import { QueryField } from '@/components/Bootx/Query/Query'

  // 使用hooks
  const {
    handleTableChange,
    pageQueryResHandel,
    resetQueryParams,
    pagination,
    pages,
    model,
    loading,
  } = useTablePage(queryPage)

  // 查询条件
  const fields = [
    { field: 'code', type: 'string', name: '编码', placeholder: '请输入操作模块' },
    { field: 'name', type: 'string', name: '名称', placeholder: '请输入账号名称' },
  ] as QueryField[]

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()

  onMounted(() => {
    vxeBind()
    queryPage()
  })
  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true
    page({
      ...model.queryParam,
      ...pages,
    }).then(({ data }) => {
      pageQueryResHandel(data)
    })
    return Promise.resolve()
  }
</script>

<style lang="less" scoped></style>
