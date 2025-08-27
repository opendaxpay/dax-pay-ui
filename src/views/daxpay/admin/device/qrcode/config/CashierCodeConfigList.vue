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
          ref="xTable"
          key-field="id"
          :data="pagination.records"
          :loading="loading"
        >
          <vxe-column type="seq" width="60" />
          <vxe-column field="name" title="配置名称" :min-width="150">
            <template #default="{ row }">
              <a href="javascript:" @click="show(row)">{{ row.name }}</a>
            </template>
          </vxe-column>
          <vxe-column field="remark" title="备注" :min-width="150" />
          <vxe-column field="createTime" title="创建时间" :min-width="140" />
          <vxe-column fixed="right" :width="200" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <a-link @click="edit(row)">编辑</a-link>
              <a-divider type="vertical" />
              <a-link @click="sceneConfig(row)">场景配置</a-link>
              <a-divider type="vertical" />
              <a-link danger @click="remove(row)">删除</a-link>
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
    </div>
    <CashierCodeConfigEdit ref="cashierCodeConfigEdit" @ok="queryPage" />
    <CashierCodeSceneList ref="cashierCodeSceneConfig" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import { del, page } from './CashierCodeConfig.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import BQuery from '@/components/Bootx/Query/BQuery.vue'
  import { LIST, QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { useMessage } from '@/hooks/web/useMessage'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import CashierCodeConfigEdit from './CashierCodeConfigEdit.vue'
  import { FormEditType } from '@/enums/formTypeEnum'
  import CashierCodeSceneList from './CashierCodeSceneList.vue'
  import ALink from '@/components/Link/Link.vue'

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
  const { createMessage, createConfirm } = useMessage()
  // 查询条件
  const fields = computed(() => {
    return [
      {
        type: STRING,
        field: 'name',
        name: '配置名称',
        placeholder: '请输入配置名称',
      },
    ] as QueryField[]
  })
  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const cashierCodeConfigEdit = ref<any>()
  const cashierCodeSceneConfig = ref<any>()

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
  /**
   * 创建配置
   */
  function add() {
    cashierCodeConfigEdit.value.init(null, FormEditType.Add)
  }

  /**
   * 编辑
   */
  function edit(record) {
    cashierCodeConfigEdit.value.init(record.id, FormEditType.Edit)
  }

  /**
   * 查看
   */
  function show(record) {
    cashierCodeConfigEdit.value.init(record.id, FormEditType.Show)
  }

  /**
   * 支付场景配置
   */
  function sceneConfig(record) {
    cashierCodeSceneConfig.value.init(record.id)
  }

  // 删除
  function remove(record) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否删除该条数据',
      onOk: () => {
        del(record.id).then(() => {
          createMessage.success('删除成功')
          queryPage()
        })
      },
    })
  }
</script>

<style lang="less" scoped></style>
