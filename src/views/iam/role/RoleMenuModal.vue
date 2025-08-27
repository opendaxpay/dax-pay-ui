<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    title="角色菜单配置"
    width="40%"
    :open="visible"
    @close="handleCancel"
  >
    <a-spin :spinning="loading">
      <a-input
        style="margin-bottom: 8px"
        placeholder="筛选"
        allowClear
        v-model:value="searchName"
        @change="search"
      />
      <a-tree
        :checkable="true"
        v-model:checkedKeys="checkedKeys"
        v-model:expandedKeys="expandedKeys"
        :checkStrictly="checkStrictly"
        :auto-expand-parent="false"
        :tree-data="treeData"
        @check="onCheck"
        @expand="onExpand"
      >
        <template #title="{ title }">
          <span v-if="title?.toLowerCase().indexOf(searchName.toLowerCase()) > -1">
            {{ searchRenderStart(title, searchName) }}
            <span style="color: #f50">
              {{ searchRenderMiddle(title, searchName) }}
            </span>
            {{ searchRenderEnd(title, searchName) }}
          </span>
          <span v-else>{{ title }}</span>
        </template>
      </a-tree>
    </a-spin>
    <template #footer>
      <a-select
        style="min-width: 100px"
        @change="clientSwitch"
        v-model:value="clientCode"
        v-if="isAdmin()"
      >
        <a-select-option v-for="o in clients" :key="o.code">{{ o.name }}</a-select-option>
      </a-select>
      <a-dropdown style="margin-left: 5px" :trigger="['click']" placement="top">
        <template #overlay>
          <a-menu>
            <a-menu-item key="1" @click="checkALL">全部勾选</a-menu-item>
            <a-menu-item key="2" @click="cancelCheckALL">取消全选</a-menu-item>
            <a-menu-item key="3" @click="expandAll">展开所有</a-menu-item>
            <a-menu-item key="4" @click="closeAll">合并所有</a-menu-item>
          </a-menu>
        </template>
        <a-button post-icon="ant-design:up-outlined"> 操作 </a-button>
      </a-dropdown>
      <a-button @click="visible = false" style="margin-right: 0.8rem">取消</a-button>
      <a-button
        @click="handleSubmit()"
        type="primary"
        :loading="loading"
        style="margin-right: 0.8rem"
        >保存</a-button
      >
    </template>
  </basic-drawer>
</template>

<script lang="ts" setup>
  import { BasicDrawer } from '@/components/Drawer'
  import { findAll as findClients, Client } from '@/views/iam/client/Client.api'
  import { getAppEnvConfig, isAdmin } from '@/utils/env'
  import { RoleTree } from './Role.api'
  import { Tree, treeDataTranslate } from '@/utils/dataUtil'
  import XEUtils from 'xe-utils'
  import { MenuTree } from '@/views/iam/perm/menu/Menu.api'
  import { useMessage } from '@/hooks/web/useMessage'
  import { ref } from 'vue'
  import { findIdsByRoleMenu, saveRoleMenu, treeByRoleMenu } from './RolePerm.api'

  const { VITE_GLOB_APP_CLIENT } = getAppEnvConfig()
  const { createMessage, createConfirm } = useMessage()

  let loading = ref(false)
  let currentRole = ref<RoleTree>({})
  let visible = ref(false)
  // 终端列表
  let clients = ref([] as Client[])
  let clientCode = ref(VITE_GLOB_APP_CLIENT)
  let searchName = ref('')
  // 父子选项默认不受控
  let checkStrictly = ref(true)
  // 所有的key
  let allTreeKeys = ref<string[]>([])
  // 展开的key
  let expandedKeys = ref<string[]>([])
  // 被选中的key
  let checkedKeys = ref<string[]>([])
  //菜单树信息
  let treeData = ref<Tree[]>([])
  let treeList = ref<MenuTree[]>([])

  function init(record: RoleTree) {
    currentRole.value = record
    initData()
    initAssign()
  }

  /**
   * 初始化终端列表
   */
  function initData() {
    findClients().then(({ data }) => {
      clients.value = data
    })
  }

  /**
   * 初始化菜单分配信息
   */
  async function initAssign() {
    visible.value = true
    loading.value = true
    searchName.value = ''
    expandedKeys.value = []
    treeList.value = []
    // 当前角色的菜单
    await treeByRoleMenu(currentRole.value.id, clientCode).then((res) => {
      treeData.value = treeDataTranslate(res.data, 'id', 'title')
      generateTreeList(res.data)
    })
    // 当前角色已经选择的
    await findIdsByRoleMenu(currentRole.value.id, clientCode).then((res) => {
      checkedKeys.value = res.data
    })
    // 所有的key值
    allTreeKeys.value = treeList.value.map((item) => item.id) as string[]
    loading.value = false
  }

  /**
   * 保存
   */
  function handleSubmit() {
    // 是否级联更新子角色
    if (currentRole.value.children) {
      createConfirm({
        iconType: 'warning',
        title: '警告',
        cancelText: '不应用',
        okText: '应用',
        content:
          '将新增的权限应用到下级子角色中，注意：删除权限时无论如何选择，都将会下级角色的权限级联删除',
        onOk: () => {
          save(true)
        },
        onCancel: () => {
          save(false)
        },
      })
    } else {
      save(false)
    }
  }

  /**
   * 保存
   */
  function save(updateChildren: boolean) {
    loading.value = true
    saveRoleMenu({
      roleId: currentRole.value.id,
      clientCode: clientCode.value,
      updateChildren,
      menuIds: checkedKeys.value,
    })
      .then(() => {
        createMessage.success('保存成功')
        handleCancel()
      })
      .finally(() => (loading.value = false))
  }

  /**
   * 取消
   */
  function handleCancel() {
    visible.value = false
  }
  /**
   * 树数据铺平
   */
  function generateTreeList(treeData) {
    if (!treeData) {
      return
    }
    for (let i = 0; i < treeData.length; i++) {
      const node = treeData[i]
      treeList.value.push(node)
      if (node.children) {
        generateTreeList(node.children)
      }
    }
  }
  /**
   * 搜索
   */
  function search() {
    const value = XEUtils.toValueString(searchName.value).toLowerCase()
    expandedKeys.value = treeList.value
      .map((node) => {
        if (
          searchName.value &&
          node.pid &&
          XEUtils.toValueString(node.title).toLowerCase().indexOf(value) > -1
        ) {
          return node.pid
        }
      })
      .filter((item, i, self) => item && self.indexOf(item) === i) as string[]
  }
  /**
   * 渲染搜索项目数据开始段
   */
  function searchRenderStart(title, searchName) {
    return title.substring(0, title?.toLowerCase().indexOf(searchName.toLowerCase()))
  }
  /**
   * 渲染搜索项目数据中间段
   */
  function searchRenderMiddle(title, searchName) {
    return title.substring(
      title?.toLowerCase().indexOf(searchName.toLowerCase()),
      title?.toLowerCase().indexOf(searchName.toLowerCase()) + searchName.length,
    )
  }
  /**
   * 渲染搜索项目数据结束段
   */
  function searchRenderEnd(title, searchName) {
    return title.substring(
      title?.toLowerCase().indexOf(searchName.toLowerCase()) + searchName.length,
    )
  }
  /**
   * 展开/收起节点时触发
   */
  function onExpand(keys) {
    expandedKeys.value = keys
  }
  /**
   * 点击复选框触发
   */
  function onCheck(key) {
    if (checkStrictly.value) {
      checkedKeys.value = key.checked
    } else {
      checkedKeys.value = key
    }
  }
  /**
   * 展开全部
   */
  function expandAll() {
    expandedKeys.value = allTreeKeys.value
  }
  /**
   * 合并全部
   */
  function closeAll() {
    expandedKeys.value = []
  }
  /**
   * 全选
   */
  function checkALL() {
    checkedKeys.value = allTreeKeys.value
  }
  /**
   * 全不选
   */
  function cancelCheckALL() {
    checkedKeys.value = []
  }
  /**
   * 终端切换
   */
  function clientSwitch(item) {
    clientCode.value = item
    initAssign()
  }
  defineExpose({ init })
</script>
<style scoped></style>
