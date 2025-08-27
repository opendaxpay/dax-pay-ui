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
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <a-space>
            <a-button type="primary" pre-icon="ant-design:plus-outlined" @click="add"
              >新建</a-button
            >
          </a-space>
        </template>
      </vxe-toolbar>
      <div class="h-65vh">
        <vxe-table
          height="auto"
          key-field="id"
          ref="xTable"
          :data="pagination.records"
          :loading="loading"
        >
          <vxe-column type="seq" :min-width="60" />
          <vxe-column field="name" title="参数名称" :min-width="200" />
          <vxe-column field="key" title="参数Key" :min-width="150" />
          <vxe-column field="value" title="参数值" :min-width="200" />
<!--          <vxe-column field="type" title="参数类型" :min-width="80">-->
<!--            <template #default="{ row }">-->
<!--              <a-tag>{{ dictConvert('ParamType', row.type) || '无' }}</a-tag>-->
<!--            </template>-->
<!--          </vxe-column>-->
          <vxe-column field="enable" title="启用状态" :min-width="80">
            <template #default="{ row }">
              <a-tag v-if="row.enable" color="green">启用</a-tag>
              <a-tag v-else color="red">停用</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="internal" title="内置参数" :min-width="80">
            <template #default="{ row }">
              <a-tag v-if="row.internal" color="red">是</a-tag>
              <a-tag v-else color="green">否</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="remark" title="备注" :min-width="220" />
          <vxe-column field="createTime" title="创建时间" :min-width="140" />
          <vxe-column fixed="right" width="150" :showOverflow="false" title="操作" :min-width="150">
            <template #default="{ row }">
              <span>
                <a href="javascript:" @click="show(row)">查看</a>
              </span>
              <a-divider type="vertical" />
              <span>
                <a href="javascript:" @click="edit(row)">编辑</a>
              </span>
              <template v-if="!row.internal">
                <a-divider type="vertical" />
                <a-popconfirm title="是否删除" @confirm="remove(row)" okText="是" cancelText="否">
                  <a href="javascript:" style="color: red">删除</a>
                </a-popconfirm>
              </template>
            </template>
          </vxe-column>
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
      <SystemParamEdit ref="systemParamEdit" @ok="queryPage" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { del, page } from './SystemParam.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import SystemParamEdit from './SystemParamEdit.vue'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { useMessage } from '@/hooks/web/useMessage'
  import { QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { useDict } from '@/hooks/bootx/useDict'

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
  const { createMessage } = useMessage()
  const { dictConvert } = useDict()

  // 查询条件
  const fields = [
    { field: 'name', type: STRING, name: '参数名称', placeholder: '请输入参数名称' },
    { field: 'key', type: STRING, name: '参数Key', placeholder: '请输入参数Key' },
  ] as QueryField[]

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const systemParamEdit = ref<any>()

  onMounted(() => {
    vxeBind()
    queryPage()
  })
  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  // 分页查询
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
  // 新增
  function add() {
    systemParamEdit.value.init(null, FormEditType.Add)
  }
  // 查看
  function edit(record) {
    systemParamEdit.value.init(record.id, FormEditType.Edit)
  }
  // 查看
  function show(record) {
    systemParamEdit.value.init(record.id, FormEditType.Show)
  }

  // 删除
  function remove(record) {
    del(record.id).then(() => {
      createMessage.success('删除成功')
      queryPage()
    })
  }
</script>

<style lang="less" scoped></style>
