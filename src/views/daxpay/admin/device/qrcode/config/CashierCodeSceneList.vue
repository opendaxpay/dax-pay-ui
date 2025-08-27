<template>
  <basic-modal
    destroyOnClose
    :footer="null"
    width="75%"
    title="码牌支付场景配置"
    :mask-closable="true"
    :open="visible"
    @cancel="handleCancel"
  >
    <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
      <template #buttons>
        <a-space>
          <a-button type="primary" pre-icon="ant-design:plus-outlined" @click="add">新建</a-button>
        </a-space>
      </template>
    </vxe-toolbar>
    <vxe-table ey-field="id" ref="xTable" :data="records" :loading="loading">
      <vxe-column type="seq" width="60" />
      <vxe-column field="scene" title="场景" align="center" :min-width="150">
        <template #default="{ row }">
          {{ dictConvert('cashier_scene', row.scene) }}
        </template>
      </vxe-column>
      <vxe-column field="channel" title="支付通道" align="center" :min-width="100">
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
      <vxe-column field="needOpenId" title="获取OpenId" align="center" :min-width="150">
        <template #default="{ row }">
          <a-tag :color="row.needOpenId ? 'green' : 'red'">
            {{ row.needOpenId ? '需要' : '不需要' }}
          </a-tag>
        </template>
      </vxe-column>
      <vxe-column field="callType" title="调用类型" align="center" :min-width="150">
        <template #default="{ row }">
          {{ dictConvert('gateway_call_type', row.callType) }}
        </template>
      </vxe-column>
      <vxe-column fixed="right" :width="150" :showOverflow="false" title="操作">
        <template #default="{ row }">
          <a href="javascript:" @click="show(row)">查看</a>
          <a-divider type="vertical" />
          <a href="javascript:" @click="edit(row)">编辑</a>
          <a-divider type="vertical" />
          <a href="javascript:" style="color: red" @click="del(row)">删除</a>
        </template>
      </vxe-column>
    </vxe-table>
    <cashier-code-scene-edit ref="codeCardSceneConfigEdit" @ok="queryPage" />
  </basic-modal>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import {
    CashierCodeSceneConfig,
    getCodeSceneConfigs,
    removeCodeSceneConfig,
  } from './CashierCodeConfig.api'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { useMessage } from '@/hooks/web/useMessage'
  import { useDict } from '@/hooks/bootx/useDict'
  import BasicModal from '@/components/Modal/src/BasicModal.vue'
  import { PayMethodEnum } from '@/enums/daxpay/daxpayEnum'
  import CashierCodeSceneEdit from '@/views/daxpay/admin/device/qrcode/config/CashierCodeSceneEdit.vue'

  const { createConfirm, createMessage } = useMessage()
  const { dictConvert } = useDict()

  const currentConfigId = ref<string>('')
  const loading = ref(false)
  const visible = ref(false)
  const records = ref<CashierCodeSceneConfig[]>([])

  const codeCardSceneConfigEdit = ref<any>()
  /**
   * 初始化并展示
   */
  async function init(configId) {
    visible.value = true
    currentConfigId.value = configId
    queryPage()
  }

  /**
   * 查询
   */
  function queryPage() {
    // 列表信息
    loading.value = true
    getCodeSceneConfigs(currentConfigId.value).then(({ data }) => {
      records.value = data
      loading.value = false
    })
  }

  /**
   * 关闭页面
   */
  function handleCancel() {
    visible.value = false
  }

  /**
   * 新增
   */
  function add() {
    codeCardSceneConfigEdit.value.init(null, FormEditType.Add, currentConfigId.value)
  }
  /**
   * 编辑
   */
  function edit(record) {
    codeCardSceneConfigEdit.value.init(record.id, FormEditType.Edit, currentConfigId.value)
  }
  /**
   * 查看
   */
  function show(record) {
    codeCardSceneConfigEdit.value.init(record.id, FormEditType.Show, currentConfigId.value)
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
        removeCodeSceneConfig(record.id).then(() => {
          createMessage.success('删除成功')
          queryPage()
        })
      },
    })
  }
  defineExpose({
    init,
  })
</script>
<style scoped lang="less"></style>
