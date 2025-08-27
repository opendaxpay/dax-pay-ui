<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <a-tabs v-model:activeKey="activeKey" tabPosition="left" style="min-height: 550px">
        <a-tab-pane :key="1" tab="公共配置">
          <Gateway-config-edit />
        </a-tab-pane>
        <a-tab-pane :key="2" tab="PC收银配置">
          <Cashier-group-config-list type="pc" />
        </a-tab-pane>
        <a-tab-pane :key="3" tab="H5收银配置">
          <Cashier-group-config-list type="h5" />
        </a-tab-pane>
        <a-tab-pane :key="4" tab="聚合支付配置">
          <Aggregate-config-list />
        </a-tab-pane>
        <a-tab-pane :key="5" tab="付款码支付配置">
          <Aggregate-code-list />
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  import GatewayConfigEdit from './GatewayConfigEdit.vue'
  import CashierGroupConfigList from './cashier/CashierGroupConfigList.vue'
  import AggregateConfigList from './aggregate/AggregateConfigList.vue'
  import AggregateCodeList from './aggregate/AggregateCodeList.vue'

  const activeKey = ref(1)

  /**
   * 入口
   */
  function init() {
    activeKey.value = 1
  }
</script>

<style scoped lang="less"></style>
