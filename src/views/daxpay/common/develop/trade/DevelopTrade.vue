<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <div class="flex justify-center" style="flex-wrap: wrap">
        <a-radio-group v-model:value="tradeType" button-style="solid">
          <a-radio-button v-for="item in tradeTypes" :key="item.value" :value="item.value">{{
            item.label
          }}</a-radio-button>
        </a-radio-group>
        <div style="width: 100%; height: 25px"></div>
        <develop-trade-pay v-if="tradeType === TradeTypeEnum.PAY" />
        <develop-trade-refund v-if="tradeType === TradeTypeEnum.REFUND" />
        <develop-trade-transfer v-if="tradeType === TradeTypeEnum.TRANSFER" />
        <develop-trade-gateway v-if="tradeType === 'gateway'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { TradeTypeEnum } from '@/enums/daxpay/daxpayEnum'
  import { useDict } from '@/hooks/bootx/useDict'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import DevelopTradePay from './DevelopTradePay.vue'
  import DevelopTradeRefund from './DevelopTradeRefund.vue'
  import DevelopTradeTransfer from './DevelopTradeTransfer.vue'
  import DevelopTradeGateway from './DevelopTradeGateway.vue'

  const { dictDropDown } = useDict()

  let tradeType = ref<string>(TradeTypeEnum.PAY)
  let tradeTypes = ref<LabeledValue[]>([])

  onMounted(() => initData())

  /**
   * 初始化数据
   */
  async function initData() {
    tradeTypes.value.push({ value: TradeTypeEnum.PAY, label: '支付' })
    tradeTypes.value.push({ value: TradeTypeEnum.REFUND, label: '退款' })
    tradeTypes.value.push({ value: TradeTypeEnum.TRANSFER, label: '转账' })
    tradeTypes.value.push({ value: 'gateway', label: '网关支付' })
  }
</script>

<style scoped lang="less"></style>
