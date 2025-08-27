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
          <vxe-column type="seq" :width="60" />
          <vxe-column field="code" title="编码" :min-width="170" />
          <vxe-column field="name" title="名称" :min-width="150" />
          <vxe-column field="groupTag" title="分类标签" :min-width="130" align="center">
            <template #default="{ row }">
              <a-tag color="green">{{ row.groupTag || '空' }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="enable" title="启用状态" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.enable" color="green">启用</a-tag>
              <a-tag v-else color="red">停用</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="remark" title="备注" :min-width="150" />
          <vxe-column field="createTime" title="创建时间" :min-width="140" />
          <vxe-column fixed="right" width="220" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <span>
                <a href="javascript:" @click="show(row)">查看</a>
              </span>
              <a-divider type="vertical" />
              <span>
                <a href="javascript:" @click="edit(row)">编辑</a>
              </span>
              <a-divider type="vertical" />
              <span>
                <a href="javascript:" @click="itemList(row)">字典配置</a>
              </span>
              <a-divider type="vertical" />
              <a-popconfirm title="是否删除" @confirm="remove(row)" okText="是" cancelText="否">
                <a href="javascript:" style="color: red">删除</a>
              </a-popconfirm>
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
      <DictEdit ref="dictEdit" @ok="queryPage" />
      <DictItemList ref="dictItemList" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import { del, page } from './Dict.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import DictEdit from './DictEdit.vue'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import BQuery from '@/components/Bootx/Query/BQuery.vue'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { useMessage } from '@/hooks/web/useMessage'
  import { QueryField, STRING } from '@/components/Bootx/Query/Query'
  import DictItemList from './DictItemList.vue'

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

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'code', type: STRING, name: '字典编码', placeholder: '请输入字典编码' },
      { field: 'name', type: STRING, name: '字典名称', placeholder: '请输入字典名称' },
      { field: 'groupTag', type: STRING, name: '分组标签', placeholder: '请输入分组标签' },
    ] as QueryField[]
  })

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const dictEdit = ref<any>()
  const dictItemList = ref<any>()

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
    dictEdit.value.init(null, FormEditType.Add)
  }
  // 查看
  function edit(record) {
    dictEdit.value.init(record.id, FormEditType.Edit)
  }
  // 查看
  function show(record) {
    dictEdit.value.init(record.id, FormEditType.Show)
  }
  // 明细列表查看
  function itemList(record) {
    dictItemList.value.init(record)
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
