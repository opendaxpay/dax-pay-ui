<template>
  <div>
    <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
      <template #buttons>
        <a-space>
          <a-button
            v-if="type !== 'h5'"
            type="primary"
            pre-icon="ant-design:plus-outlined"
            @click="add"
            >新建</a-button
          >
          <a-button
            v-if="records.length === 0 && type === 'h5'"
            type="primary"
            pre-icon="ant-design:plus-outlined"
            @click="createDefault"
            >创建默认分组</a-button
          >
        </a-space>
      </template>
    </vxe-toolbar>
    <vxe-table ey-field="id" ref="xTable" :data="records" :loading="loading">
      <vxe-column type="seq" width="60" />
      <vxe-column field="name" title="分组名称" :min-width="150">
        <template #default="{ row }">
          <a href="javascript:" @click="show(row)">{{ row.name }}</a>
        </template>
      </vxe-column>
      <!--      <vxe-column field="name" title="是否推荐" :min-width="150">-->
      <!--        <template #default="{ row }">-->
      <!--          <a-tag :color="row.recommend ? 'green' : 'red'">-->
      <!--            {{ row.recommend ? '推荐' : '未推荐' }}-->
      <!--          </a-tag>-->
      <!--        </template>-->
      <!--      </vxe-column>-->
      <vxe-column field="sortNo" title="排序" :min-width="70" />
      <vxe-column fixed="right" :width="200" :showOverflow="false" title="操作">
        <template #default="{ row }">
          <a href="javascript:" @click="edit(row)">编辑</a>
          <a-divider type="vertical" />
          <a href="javascript:" @click="list(row)">支付配置项</a>
          <a-divider type="vertical" />
          <a href="javascript:" style="color: red" @click="del(row)">删除</a>
        </template>
      </vxe-column>
    </vxe-table>
    <CashierItemConfigList ref="cashierItemConfigList" :type="type" />
    <CashierGroupConfigEdit
      ref="cashierGroupConfigEdit"
      :type="type"
      @ok="queryPage"
    />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import {
    CashierGroupConfig,
    delGroupConfig,
    getGroupConfigs,
    saveDefaultGroup,
  } from './Cashier.api'
  import { useMessage } from '@/hooks/web/useMessage'
  import CashierItemConfigList from './CashierItemConfigList.vue'
  import CashierGroupConfigEdit from './CashierGroupConfigEdit.vue'
  import { FormEditType } from '@/enums/formTypeEnum'

  const { createMessage, createConfirm } = useMessage()

  const loading = ref(false)
  const records = ref<CashierGroupConfig[]>([])

  const cashierItemConfigList = ref<any>() //配置弹窗
  const cashierGroupConfigEdit = ref<any>() //新增编辑弹窗

  const props = defineProps({
    type: String,
  })

  onMounted(() => queryPage())

  /**
   * 查询列表
   */
  function queryPage() {
    loading.value = true
    getGroupConfigs(props.type).then(({ data }) => {
      records.value = data
      loading.value = false
    })
  }

  /**
   * 新增
   */
  function add() {
    cashierGroupConfigEdit.value.init(null, FormEditType.Add)
  }

  /**
   * 创建默认分组
   */
  function createDefault() {
    createConfirm({
      iconType: 'info',
      title: '提醒',
      content: '是否创建默认分组',
      onOk: () => {
        loading.value = true
        saveDefaultGroup().then(() => {
          createMessage.success('创建成功')
          queryPage()
        })
      },
    })
  }

  /**
   * 编辑
   */
  function edit(record) {
    cashierGroupConfigEdit.value.init(record.id, FormEditType.Edit)
  }
  /**
   * 查看
   */
  function show(record) {
    cashierGroupConfigEdit.value.init(record.id, FormEditType.Show)
  }
  /**
   * 配置项列表
   */
  function list(record) {
    cashierItemConfigList.value.init(record.id)
  }

  /**
   * 删除
   */
  function del(record) {
    createConfirm({
      iconType: 'warning',
      title: '删除',
      content: '是否删除该数据',
      onOk: () => {
        loading.value = true
        delGroupConfig(record.id).then(() => {
          createMessage.success('删除成功')
          queryPage()
        })
      },
    })
  }
</script>

<style scoped lang="less"></style>
