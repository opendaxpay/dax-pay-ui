<template>
  <div class="merchart_index">
    <div class="datequeryBox">
      <a-alert message="欢 迎 使 用 DaxPay 商 户 端" type="info" />
      <div class="date">
        <a-range-picker
          v-model:value="dateValue"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          :allow-clear="false"
        />
        <a-button type="primary" @click="searchBtn" class="ml-5">查询</a-button>
      </div>
    </div>

    <div class="scrollBox_index">
      <!--  支付/退款/商户/服务商信息 -->
      <GrowCard :loading="loading" class="enter-y" :dateObj="dateObj" />
      <!--  支付通道 支付方式 退款通道 数量占比   -->
      <VisitSource class="md:flex enter-y mt-5" :loading="loading" :dateObj="dateObj" />
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { reactive, ref } from 'vue'
  import GrowCard from './components/GrowCard.vue'
  import VisitSource from './components/VisitSource.vue'
  import dayjs from 'dayjs'

  //默认绑定最近七天
  const dateValue = ref<[string, string]>([
    dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ])

  //选择框绑定的数据
  const dateObj = reactive({
    startDate: dateValue.value[0],
    endDate: dateValue.value[1],
    sign: 0,
  })
  //查询按钮
  const searchBtn = () => {
    dateObj.startDate = dateValue.value[0]
    dateObj.endDate = dateValue.value[1]
    dateObj.sign = Math.floor(100000 + Math.random() * 900000) // 生成 6 位随机数
  }

  const loading = ref(true)
  setTimeout(() => {
    loading.value = false
  }, 1500)
</script>
<style lang="scss">
  .merchart_index {
    padding: 0.625vw 0vw;
    width: 100%;
    height: 100%;
    background-color: #f0f4fb;
    .datequeryBox {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 2.5833vw;
      padding: 0vw 1.0417vw;
    }
    .scrollBox_index {
      width: 100%;
      padding: 0.625vw 1.0417vw;
    }
  }
</style>
<style lang="scss">
  .datequeryBox {
    .ant-alert {
      flex: 1;
      margin-right: 1.5625vw;
      padding: 0.4167vw 0.625vw;
    }
  }
</style>
