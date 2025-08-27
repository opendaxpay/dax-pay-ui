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
          <vxe-column type="seq" :width="60" />
          <vxe-column field="userId" title="用户ID" :min-width="100" />
          <vxe-column field="account" title="用户账号" :min-width="120" />
          <vxe-column field="login" title="登录成功" align="center" :min-width="90">
            <template #default="{ row }">
              <a-tag v-if="row.login" color="green">成功</a-tag>
              <a-tag v-else color="red">失败</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="client" title="终端" align="center" :min-width="100">
            <template #default="{ row }">
              {{ getClient(row.client) }}
            </template>
          </vxe-column>
          <vxe-column field="ip" title="登录IP地址" :min-width="150" />
          <vxe-column field="os" title="操作系统" :min-width="150" />
          <vxe-column field="browser" title="浏览器类型" :min-width="150" />
          <vxe-column field="msg" title="提示消息" :min-width="170" />
          <vxe-column field="loginTime" title="访问时间" :min-width="170" />
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
      <LoginLogInfo :clients="clients" ref="loginLogInfo" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import { deleteByDay, page } from './LoginLog.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import { useMessage } from '@/hooks/web/useMessage'
  import { QueryField } from '@/components/Bootx/Query/Query'
  import { Client, findAll as findClients } from '@/views/iam/client/Client.api'
  import { dropdownTranslate, findOneByField } from '@/utils/dataUtil'
  import LoginLogInfo from './LoginLogInfo.vue'
  import { LabeledValue } from 'ant-design-vue/lib/select'

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

  let clients = ref<Client[]>()
  const deleteDay = ref<number | undefined>(undefined)

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const loginLogInfo = ref<any>()

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
      { field: 'account', type: 'string', name: '用户账号', placeholder: '请输入用户账号' },
      {
        field: 'client',
        type: 'list',
        name: '终端',
        placeholder: '请选择终端',
        selectList: dropdownTranslate(clients, 'name', 'code'),
      },
      {
        field: 'success',
        type: 'list',
        name: '登录状态',
        selectList: [
          { label: '成功', value: 'true' },
          { label: '失败', value: 'false' },
        ],
      },
    ] as QueryField[]
  })

  onMounted(() => {
    vxeBind()
    initClientAndLoginType()
    queryPage()
  })

  /**
   * 初始化 终端列表和登录方式列表
   */
  function initClientAndLoginType() {
    findClients().then(({ data }) => {
      clients.value = data
    })
  }

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
  }
  /**
   * 查看
   */
  function show(record) {
    loginLogInfo.value.show(record.id)
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
