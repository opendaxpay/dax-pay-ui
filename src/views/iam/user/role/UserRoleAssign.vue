<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    :title="modal.title"
    width="40%"
    :open="modal.visible"
    @close="handleCancel"
  >
    <a-spin :spinning="modal.loading">
      <a-input
        style="margin-bottom: 8px"
        placeholder="筛选"
        allowClear
        v-model:value="modal.searchName"
        @change="search"
      />
      <a-tree
        :checkable="true"
        :checkStrictly="true"
        v-model:checkedKeys="modal.checkedKeys"
        v-model:expandedKeys="modal.expandedKeys"
        :auto-expand-parent="true"
        :tree-data="modal.treeData"
        @check="onCheck"
        @expand="onExpand"
      >
        <template #title="{ title }">
          <span v-if="title?.toLowerCase()?.indexOf(modal.searchName.toLowerCase()) > -1">
            {{ searchRenderStart(title, modal.searchName) }}
            <span style="color: #f50">
              {{ searchRenderMiddle(title, modal.searchName) }}
            </span>
            {{ searchRenderEnd(title, modal.searchName) }}
          </span>
          <span v-else>{{ title }}</span>
        </template>
      </a-tree>
    </a-spin>
    <template #footer>
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
      <a-button @click="modal.visible = false" style="margin-right: 0.8rem">取消</a-button>
      <a-button
        @click="handleSubmit()"
        type="primary"
        :loading="modal.loading"
        style="margin-right: 0.8rem"
        >保存</a-button
      >
    </template>
  </basic-drawer>
</template>
<script setup lang="ts">
  import { BasicDrawer } from '@/components/Drawer'
  import { reactive } from 'vue'
  import { Tree, treeDataTranslate } from '@/utils/dataUtil'
  import XEUtils from 'xe-utils'
  import { RoleTree, tree as roleTree } from '@/views/iam/role/Role.api'
  import { addUserRole, addUserRoleBatch, getRoleIds } from '@/views/iam/user/UserAssign.api'
  import { useMessage } from '@/hooks/web/useMessage'

  const { createConfirm, createMessage } = useMessage()
  const modal = reactive({
    title: '角色分配',
    visible: false,
    batch: false,
    loading: false,
    searchName: '',
    // 所有的key
    allTreeKeys: [] as string[],
    // 展开的key
    expandedKeys: [] as string[],
    // 被选中的key
    checkedKeys: [] as string[],
    // 后台获取的角色树
    treeData: [] as Tree[],
    // 转换后的树数据
    treeList: [] as RoleTree[],
    // 用户id
    userId: '',
    // 用户ids
    userIds: [],
    // 角色Ids
    roleIds: [],
  })

  /**
   * 初始化
   */
  async function init(batch: boolean, userIdOrIds: string | string[]) {
    modal.visible = true
    modal.batch = batch
    modal.loading = true
    // 初始化角色树
    await initRoles()
    if (!batch) {
      modal.userId = userIdOrIds as string
      // 初始化分配角色
      await initAssign()
    } else {
      modal.userIds = userIdOrIds as never[]
    }
    modal.loading = false
  }

  /**
   * 初始化菜单
   */
  async function initRoles() {
    modal.searchName = ''
    modal.expandedKeys = []
    // 角色树
    await roleTree().then((res) => {
      modal.treeData = treeDataTranslate(res.data, 'id', 'name')
      generateTreeList(res.data)
    })
  }

  /**
   * 初始化权限码分配信息
   */
  async function initAssign() {
    // 当前用户已经选择的角色Id
    await getRoleIds(modal.userId).then((res) => {
      modal.checkedKeys = res.data
    })
    // 选中的的key值
    modal.allTreeKeys = modal.treeList.map((item) => item.id) as string[]
  }
  /**
   * 保存
   */
  function handleSubmit() {
    createConfirm({
      iconType: 'info',
      title: '警告',
      content: '是否要保存角色分配信息',
      onOk: async () => {
        modal.loading = true
        if (modal.batch) {
          await addUserRoleBatch({
            userIds: modal.userIds,
            roleIds: modal.checkedKeys,
          })
        } else {
          await addUserRole({
            userId: modal.userId,
            roleIds: modal.checkedKeys,
          })
        }
        createMessage.success('保存成功')
        modal.loading = false
        modal.visible = false
      },
    })
  }

  /**
   * 取消
   */
  function handleCancel() {
    modal.visible = false
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
      modal.treeList.push(node)
      if (node.children) {
        generateTreeList(node.children)
      }
    }
  }
  /**
   * 搜索
   */
  function search() {
    const value = XEUtils.toValueString(modal.searchName).toLowerCase()
    modal.expandedKeys = modal.treeList
      .map((node) => {
        if (
          modal.searchName &&
          node.pid &&
          XEUtils.toValueString(node.name)?.toLowerCase()?.indexOf(value) > -1
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
    modal.expandedKeys = keys
  }
  /**
   * 点击复选框触发
   */
  function onCheck(key) {
    modal.checkedKeys = key.checked
  }
  /**
   * 展开全部
   */
  function expandAll() {
    modal.expandedKeys = modal.allTreeKeys
  }
  /**
   * 合并全部
   */
  function closeAll() {
    modal.expandedKeys = []
  }
  /**
   * 全选
   */
  function checkALL() {
    modal.checkedKeys = modal.allTreeKeys
  }
  /**
   * 全不选
   */
  function cancelCheckALL() {
    modal.checkedKeys = []
  }

  defineExpose({ init })
</script>

<style scoped lang="less"></style>
