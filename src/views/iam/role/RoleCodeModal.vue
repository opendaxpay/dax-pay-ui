<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    title="权限码配置"
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
        :auto-expand-parent="true"
        :tree-data="treeData"
        @check="onCheck"
        @expand="onExpand"
      >
        <template #title="{ title }">
          <span v-if="title?.toLowerCase()?.indexOf(searchName.toLowerCase()) > -1">
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
<script setup lang="ts">
  import { BasicDrawer } from '@/components/Drawer'
  import { useMessage } from '@/hooks/web/useMessage'
  import { ref } from 'vue'
  import { RoleTree } from '@/views/iam/role/Role.api'
  import { Tree, treeDataTranslate } from '@/utils/dataUtil'
  import { findIdsByRoleCode, saveRoleCode, treeByRoleCode } from '@/views/iam/role/RolePerm.api'
  import XEUtils from 'xe-utils'
  import { PermCodeTree } from '@/views/iam/perm/code/PermCode.api'

  const { createMessage, createConfirm } = useMessage()

  let loading = ref(false)
  let currentRole = ref<RoleTree>({})
  let visible = ref(false)
  let searchName = ref('')
  // 所有的key
  let allTreeKeys = ref<string[]>([])
  // 展开的key
  let expandedKeys = ref<string[]>([])
  // 被选中的key
  let checkedKeys = ref<string[]>([])
  //权限码树信息
  let treeData = ref<Tree[]>([])
  let treeList = ref<PermCodeTree[]>([])

  function init(record: RoleTree) {
    currentRole.value = record
    initAssign()
  }

  /**
   * 初始化权限码分配信息
   */
  async function initAssign() {
    visible.value = true
    loading.value = true
    searchName.value = ''
    expandedKeys.value = []
    // 当前角色的权限码
    await treeByRoleCode(currentRole.value.id).then((res) => {
      treeData.value = treeDataTranslate(res.data, 'id', 'title')
      generateTreeList(res.data)
    })
    // 当前角色已经选择的
    await findIdsByRoleCode(currentRole.value.id).then((res) => {
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
    saveRoleCode({
      roleId: currentRole.value.id,
      updateChildren,
      codeIds: checkedKeys.value,
    }).then(() => {
      createMessage.success('保存成功')
      handleCancel()
    })
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
    expandedKeys.value = keys
  }
  /**
   * 点击复选框触发
   */
  function onCheck(key) {
    checkedKeys.value = key
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

  defineExpose({ init })
</script>

<style scoped lang="less"></style>
