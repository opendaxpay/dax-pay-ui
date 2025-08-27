<template>
  <div>
    <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
      <template #buttons>
        <a-space>
          <a-button type="primary" pre-icon="ant-design:plus-outlined" @click="add">新建</a-button>
        </a-space>
      </template>
    </vxe-toolbar>
    <vxe-table ey-field="id" ref="xTable" :data="records" :loading="loading">
      <vxe-column type="seq" width="60" />

      <vxe-column field="barPayType" title="支付场景" :min-width="110">
        <template #default="{ row }">
          <a href="javascript:" @click="show(row)">{{
            dictConvert('aggregate_bar_pay_type', row.barPayType)
          }}</a>
        </template>
      </vxe-column>
      <vxe-column field="channel" title="支付通道" align="center" :min-width="150">
        <template #default="{ row }">
          {{ dictConvert('channel', row.channel) }}
        </template>
      </vxe-column>
      <vxe-column field="payMethod" title="支付方式" align="center" :min-width="150">
        <template #default="{ row }">
          <template v-if="row.payMethod === PayMethodEnum.OTHER">
            {{ dictConvert(`${row.channel}_method`, row.otherMethod) }}
          </template>
          <template v-else>
            {{ dictConvert('pay_method', row.payMethod) }}
          </template>
        </template>
      </vxe-column>
      <vxe-column field="createTime" title="创建时间" :min-width="140" />
      <vxe-column fixed="right" :width="180" :showOverflow="false" title="操作">
        <template #default="{ row }">
          <a href="javascript:" @click="edit(row)">编辑</a>
          <a-divider type="vertical" />
          <a href="javascript:" style="color: red" @click="del(row)">删除</a>
        </template>
      </vxe-column>
    </vxe-table>
    <AggregateCodeEdit ref="aggregateCodeEdit" :appId="appId" @ok="queryPage" />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import {
    AggregateConfig,
    delAggregatePayCodeConfig,
    getAggregatePayCodeConfigs,
  } from './Aggregate.api'
  import { useMessage } from '@/hooks/web/useMessage'
  import AggregateCodeEdit from './AggregateCodeEdit.vue'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { useDict } from '@/hooks/bootx/useDict'
  import { PayMethodEnum } from '@/enums/daxpay/daxpayEnum'

  const { createMessage, createConfirm } = useMessage()
  const { dictConvert } = useDict()

  const loading = ref(false)
  const records = ref<AggregateConfig[]>([])

  const aggregateCodeEdit = ref<any>()

  const props = defineProps({
    appId: String,
  })
  onMounted(() => queryPage())

  /**
   * 查询列表
   */
  function queryPage() {
    loading.value = true
    getAggregatePayCodeConfigs(props.appId).then(({ data }) => {
      records.value = data
      loading.value = false
    })
  }

  /**
   * 新增
   */
  function add() {
    aggregateCodeEdit.value.init(null, FormEditType.Add)
  }

  /**
   * 编辑
   */
  function edit(record) {
    aggregateCodeEdit.value.init(record.id, FormEditType.Edit)
  }
  /**
   * 查看
   */
  function show(record) {
    aggregateCodeEdit.value.init(record.id, FormEditType.Show)
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
        delAggregatePayCodeConfig(record.id).then(() => {
          createMessage.success('删除成功')
          queryPage()
        })
      },
    })
  }
</script>

<style scoped lang="less"></style>
