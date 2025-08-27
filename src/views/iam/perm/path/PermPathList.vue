<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <a-form class="page-query">
        <a-row :gutter="10">
          <a-col :md="4" :sm="24" v-if="isAdmin()">
            <a-form-item label="终端">
              <a-select
                v-model:value="clientCode"
                @change="queryPage"
                :default-value="clientCode"
                style="width: 100%"
              >
                <a-select-option v-for="o in clients" :key="o.code">{{ o.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :md="8" :sm="24">
            <a-form-item label="查询">
              <a-input-search
                v-model:value="searchName"
                @search="search"
                @keyup.enter="search"
                allow-clear
                placeholder="请输入路径或标识"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom zoom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <a-space>
            <a-button type="primary" @click="sync" pre-icon="ant-design:sync-outlined"
              >同步系统资源</a-button
            >
            <a-button @click="allTreeExpand(true)">展开所有</a-button>
            <a-button @click="allTreeExpand(false)">关闭所有</a-button>
          </a-space>
        </template>
      </vxe-toolbar>
      <div class="h-70vh">
        <vxe-table
          resizable
          height="auto"
          ref="xTable"
          border="inner"
          :stripe="false"
          :loading="loading"
          :tree-config="{ childrenField: 'children' }"
          :data="tableData"
        >
          <vxe-column field="name" title="名称" :min-width="200" tree-node />
          <vxe-column field="path" title="请求路径" :min-width="500">
            <template #default="{ row }">
              {{ row.leaf ? `[${row.method}] ${row.path}` : '' }}
            </template>
          </vxe-column>
          <vxe-column title="操作" fixed="right" :width="100" :showOverflow="false">
            <template #default="{ row }">
              <a-link v-if="row.leaf" @click="show(row)">查看</a-link>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </div>
    <PermPathInfo ref="permPathInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { nextTick, onMounted, ref } from 'vue'
  import { tree, syncSystem, PermPath } from './PermPath.api'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import { useMessage } from '@/hooks/web/useMessage'
  import PermPathInfo from './PermPathInfo.vue'
  import { Client, findAll } from '@/views/iam/client/Client.api'
  import XEUtils from 'xe-utils'
  import { getAppEnvConfig, isAdmin } from '@/utils/env'

  const { createMessage, createConfirm } = useMessage()

  const { VITE_GLOB_APP_CLIENT } = getAppEnvConfig()

  const permPathInfo = ref<any>()
  const clientCode = ref(VITE_GLOB_APP_CLIENT)
  const searchName = ref()
  const loading = ref(false)
  const treeExpand = ref(false)
  const clients = ref([] as Client[])
  const remoteTableData = ref([] as PermPath[])
  const tableData = ref([] as PermPath[])
  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()

  onMounted(() => {
    vxeBind()
    initClients()
    queryPage()
  })
  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  async function initClients() {
    const { data } = await findAll()
    clients.value = data
  }

  async function queryPage() {
    loading.value = true
    const { data } = await tree(clientCode.value)
    remoteTableData.value = data
    search()
    loading.value = false
  }

  /**
   * 搜索
   */
  function search() {
    const search = XEUtils.toValueString(searchName.value).trim().toLowerCase()
    if (search) {
      const searchProps = ['name', 'path', 'code', 'component']
      tableData.value = XEUtils.searchTree(remoteTableData.value, (item) =>
        searchProps.some(
          (key) => XEUtils.toValueString(item[key]).toLowerCase().indexOf(search) > -1,
        ),
      )
      // 搜索状态默认展开
      treeExpand.value = true
    } else {
      tableData.value = remoteTableData.value
    }
    nextTick(() => {
      xTable.value?.setAllTreeExpand(treeExpand.value)
    })
  }
  /**
   * 展开or关闭
   */
  function allTreeExpand(value) {
    nextTick(() => {
      xTable.value?.setAllTreeExpand(treeExpand.value)
    })
    treeExpand.value = value
  }

  /**
   * 同步
   */
  function sync() {
    createConfirm({
      iconType: 'info',
      title: '提示',
      content: '是否同步系统资源，将会覆盖当前的数据，确定进行同步？',
      onOk: () => {
        createMessage.success('同步中，请稍后......')
        syncSystem().then(() => {
          createMessage.success('同步完成')
          queryPage()
        })
      },
    })
  }

  /**
   * 查看
   */
  function show(record: PermPath) {
    permPathInfo.value.show(record.id)
  }
</script>

<style lang="less" scoped></style>
