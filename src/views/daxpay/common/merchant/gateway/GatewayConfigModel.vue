<template>
  <basic-modal
    destroyOnClose
    :footer="null"
    v-bind="$attrs"
    width="75%"
    title="网关支付配置"
    :mask-closable="false"
    :open="visible"
    @cancel="handleCancel"
  >
    <a-tabs v-model:activeKey="activeKey" tabPosition="left" style="min-height: 550px">
      <a-tab-pane :key="1" tab="公共配置">
        <Gateway-config-edit
          :appId="currentAppId"
          v-model:read-system="readSystem"
        />
      </a-tab-pane>
      <a-tab-pane :key="2" tab="PC收银配置" v-if="readSystem === false">
        <Cashier-group-config-list :appId="currentAppId" type="pc" />
      </a-tab-pane>
      <a-tab-pane :key="3" tab="H5收银配置" v-if="readSystem === false">
        <Cashier-group-config-list :appId="currentAppId" type="h5" />
      </a-tab-pane>
      <a-tab-pane :key="4" tab="聚合支付配置" v-if="readSystem === false">
        <Aggregate-config-list :appId="currentAppId" />
      </a-tab-pane>
      <a-tab-pane :key="5" tab="付款码支付配置" v-if="readSystem === false">
        <Aggregate-code-list :appId="currentAppId" />
      </a-tab-pane>
    </a-tabs>
  </basic-modal>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import GatewayConfigEdit from './GatewayConfigEdit.vue'
  import CashierGroupConfigList from './cashier/CashierGroupConfigList.vue'
  import AggregateConfigList from './aggregate/AggregateConfigList.vue'
  import AggregateCodeList from './aggregate/AggregateCodeList.vue'
  import BasicModal from '@/components/Modal/src/BasicModal.vue'
  import { MchApp } from '@/views/daxpay/admin/merchant/app/MchAppAdmin.api'

  const visible = ref(false)
  const activeKey = ref(1)
  const currentApp = ref<MchApp>({})
  const currentAppId = ref<string>('')
  const readSystem = ref<boolean>()

  /**
   * 入口
   */
  function init(mchApp: MchApp) {
    visible.value = true
    activeKey.value = 1
    currentApp.value = mchApp
    currentAppId.value = mchApp.appId as string
  }

  /**
   * 关闭页面
   */
  function handleCancel() {
    visible.value = false
  }

  defineExpose({ init })
</script>

<style scoped lang="less"></style>
