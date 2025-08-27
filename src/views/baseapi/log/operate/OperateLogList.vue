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
            <a-select
              style="width: 180px"
              v-model:value="deleteDay"
              :options="deleteDays"
              allow-clear
              placeholder="清除多久前的日志"
            />
            <a-button v-if="deleteDay" @click="deleteLogs" type="primary">清理</a-button>
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
          <vxe-column type="seq" width="60" />
          <vxe-column field="account" title="操作账号" :min-width="120" />
          <vxe-column field="title" title="操作模块" :min-width="220" />
          <vxe-column field="success" title="是否成功" align="center" :min-width="100">
            <template #default="{ row }">
              <a-tag v-if="row.success" color="green">成功</a-tag>
              <a-tag v-else color="red">失败</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="client" title="终端" align="center" :min-width="100">
            <template #default="{ row }">
              {{ getClient(row.client) }}
            </template>
          </vxe-column>
          <vxe-column field="businessType" title="业务类型" :min-width="100">
            <template #default="{ row }">
              {{ dictConvert('log_business_type', row.businessType) }}
            </template>
          </vxe-column>
          <vxe-column field="os" title="操作系统" :min-width="150" />
          <vxe-column field="browser" title="浏览器类型" :min-width="150" />
          <vxe-column field="operateIp" title="操作ip" :min-width="150" />
          <vxe-column field="errorMsg" title="错误提示" :min-width="150" />
          <vxe-column field="operateTime" title="操作时间" :min-width="170" />
          <vxe-column fixed="right" width="60" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <span>
                <a href="javascript:" @click="show(row)">查看</a>
              </span>
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
      <OperateLogEdit ref="operateLogEdit" @ok="queryPage" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import { page, deleteByDay } from './OperateLog.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import OperateLogEdit from './OperateLogInfo.vue'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import { useMessage } from '@/hooks/web/useMessage'
  import { QueryField } from '@/components/Bootx/Query/Query'
  import { useDict } from '@/hooks/bootx/useDict'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { Client, findAll as findClients } from '@/views/iam/client/Client.api'
  import { dropdownTranslate, findOneByField } from '@/utils/dataUtil'

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
  const { dictConvert, dictDropDown } = useDict()

  const deleteDay = ref<any>(undefined)
  let clients = ref<Client[]>()
  const businessTypeList = ref<LabeledValue[]>([])
  // 删除条件
  let deleteDays = ref<LabeledValue[]>([
    { label: '3天之前', value: '3' },
    { label: '7天之前', value: '7' },
    { label: '30天之前', value: '30' },
    { label: '60天之前', value: '60' },
    { label: '90天之前', value: '90' },
    { label: '180天之前', value: '180' },
    { label: '365天之前', value: '365' },
  ])
  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'title', type: 'string', name: '操作模块', placeholder: '请输入操作模块' },
      { field: 'username', type: 'string', name: '账号', placeholder: '请输入账号名称' },
      {
        field: 'client',
        type: 'list',
        name: '终端',
        placeholder: '请选择终端',
        selectList: dropdownTranslate(clients, 'name', 'code'),
      },
      {
        field: 'businessType',
        type: 'list',
        name: '业务类型',
        placeholder: '请选择业务类型',
        selectList: businessTypeList.value,
      },
      {
        field: 'success',
        type: 'list',
        name: '是否成功',
        selectList: [
          { label: '成功', value: 'true' },
          { label: '失败', value: 'false' },
        ],
      },
    ] as QueryField[]
  })

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const operateLogEdit = ref<any>()

  onMounted(() => {
    vxeBind()
    initData()
    queryPage()
  })
  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  /**
   * 初始化数据
   */
  function initData() {
    findClients().then(({ data }) => {
      clients.value = data
    })
    dictDropDown('log_business_type').then((res) => (businessTypeList.value = res))
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
   * 查看
   */
  function show(record) {
    operateLogEdit.value.show(record.id)
  }
  /**
   * 获取终端信息
   */
  function getClient(code) {
    return findOneByField(clients, code, 'code')?.['name']
  }
  /**
   * 清理日志
   */
  function deleteLogs() {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否清除指定日期前的日志，该操作不可撤回',
      onOk: async () => {
        createMessage.info('清理日志中...')
        deleteByDay(deleteDay.value).then(() => {
          createMessage.success('清理日志成功')
          queryPage()
        })
      },
    })
  }
</script>

<style lang="less" scoped></style>
