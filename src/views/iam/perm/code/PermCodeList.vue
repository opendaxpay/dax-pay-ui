<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <a-form class="page-query">
        <a-row :gutter="10">
          <a-col :md="8" :sm="24">
            <a-form-item label="查询">
              <a-input-search
                v-model:value="searchName"
                @search="search"
                @keyup.enter="search"
                allow-clear
                placeholder="请输入名称、编码查询"
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
            <a-button type="primary" pre-icon="ant-design:plus-outlined" @click="add()">
              新建
            </a-button>
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
          <vxe-column field="name" title="名称" tree-node />
          <vxe-column field="code" title="权限码" />
          <vxe-column title="操作" fixed="right" width="220" :showOverflow="false">
            <template #default="{ row }">
              <a href="javascript:" @click="show(row)">查看</a>
              <a-divider type="vertical" />
              <a href="javascript:" @click="edit(row)">编辑</a>
              <a-divider type="vertical" />
              <a-dropdown>
                <a> 更多 <icon icon="ant-design:down-outlined" :size="12" /> </a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item v-if="!row.leaf">
                      <a-link @click="addChildren(row)">添加下级</a-link>
                    </a-menu-item>
                    <a-menu-item>
                      <a-link href="javascript:" danger @click="remove(row)">删除</a-link>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
      <PermCodeEdit ref="codeEdit" @ok="queryPage" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { nextTick, onMounted, ref } from 'vue'
  import { Client, findAll } from '@/views/iam/client/Client.api'
  import XEUtils from 'xe-utils'
  import { codeTree, PermCode, del } from './PermCode.api'
  import { FormEditType } from '@/enums/formTypeEnum'
  import PermCodeEdit from './PermCodeEdit.vue'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import { useMessage } from '@/hooks/web/useMessage'
  import { Icon } from '@/components/Icon'
  import ALink from '@/components/Link/Link.vue'

  const { createConfirm, notification } = useMessage()

  const searchName = ref()
  const loading = ref(false)
  const treeExpand = ref(false)
  const clients = ref([] as Client[])
  const remoteTableData = ref([] as PermCode[])
  const tableData = ref([] as PermCode[])
  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  let codeEdit = ref<any>()

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

  /**
   * 查询
   */
  async function queryPage() {
    loading.value = true
    const { data } = await codeTree()
    remoteTableData.value = data
    search()
    loading.value = false
  }

  function add() {
    codeEdit.value.init(null, FormEditType.Add)
  }
  function edit(record: PermCode) {
    codeEdit.value.init(record.id, FormEditType.Edit)
  }
  function show(record: PermCode) {
    codeEdit.value.init(record.id, FormEditType.Show)
  }
  function addChildren(row: PermCode) {
    codeEdit.value.init(null, FormEditType.Add, row)
  }
  function remove(record: PermCode) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否删除该条数据',
      onOk: () => {
        del(record.id).then(() => {
          notification.success({ message: '删除成功' })
          queryPage()
        })
      },
    })
  }

  /**
   * 搜索
   */
  function search() {
    const search = XEUtils.toValueString(searchName.value).trim().toLowerCase()
    if (search) {
      const searchProps = ['name', 'title', 'path', 'component']
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
</script>

<style scoped lang="less"></style>
