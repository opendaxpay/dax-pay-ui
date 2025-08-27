<template>
  <Card
    :tab-list="tabListTitle"
    v-bind="$attrs"
    :active-tab-key="activeKey"
    @tab-change="onTabChange"
  >
    <p v-if="activeKey === 'tab1'">
      <VisitAnalysis />
    </p>
    <p v-if="activeKey === 'tab2'">
      <VisitAnalysis />
    </p>
    <p v-if="activeKey === 'tab3'">
      <VisitAnalysis />
    </p>
  </Card>
</template>
<script lang="ts" setup>
  import { ref } from 'vue'
  import { Card } from 'ant-design-vue'
  import VisitAnalysis from './VisitAnalysis.vue'

  const activeKey = ref('tab1')

  const tabListTitle = [
    {
      key: 'tab1',
      tab: '支付通道',
    },
    {
      key: 'tab2',
      tab: '退款通道',
    },
    {
      key: 'tab3',
      tab: '支付方式',
    },
  ]

  function onTabChange(key) {
    activeKey.value = key
  }
</script>
