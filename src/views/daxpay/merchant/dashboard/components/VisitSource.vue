<template>
  <div class="chartPie_index">
    <div class="chartPie_item">
      <div class="common_title">支付通道</div>
      <Card :loading="loading" :bordered="false">
        <div ref="payChannel" :style="{ width: '100%', height: '300px' }"></div>
      </Card>
    </div>

    <div class="chartPie_item">
      <div class="common_title">支付方式</div>
      <Card :loading="loading" :bordered="false">
        <div ref="payMethod" :style="{ width: '100%', height: '300px' }"></div>
      </Card>
    </div>
    <div class="chartPie_item">
      <div class="common_title">退款通道</div>
      <Card :loading="loading" :bordered="false">
        <div ref="refundChannel" :style="{ width: '100%', height: '300px' }"></div>
      </Card>
    </div>

    <div class="tradeStatisticsBox">
      <div class="common_title">交易统计</div>
      <div ref="tradeStatistics" :style="{ width: '100%', height: '300px' }"></div>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { reactive, Ref, ref, watch } from 'vue'
  import { Card } from 'ant-design-vue'
  import { useECharts } from '@/hooks/web/useECharts'
  // import { toDateString } from 'xe-utils'
  import {
    payChannelReport,
    payMethodReport,
    refundChannelReport,
    TradeReportResult,
    tradeStatisticsReport,
  } from '../IndexRepot.api'

  const payChannel = ref<HTMLDivElement | null>(null)
  const refundChannel = ref<HTMLDivElement | null>(null)
  const payMethod = ref<HTMLDivElement | null>(null)
  const tradeStatistics = ref<HTMLDivElement | null>(null)
  const loading = ref(false)

  const props = defineProps({
    dateObj: {
      type: Object,
      default: () => {},
    },
  })

  const query = reactive({
    startDate: '',
    endDate: '',
  })

  //监听查询标识 重新查询
  watch(
    () => props.dateObj.sign,
    () => {
      initData() //调用数据
    },
    {
      deep: true,
      immediate: true,
    },
  )
  // 饼状图
  const chartData = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      left: 'right',
      top: 'center',
      orient: 'vertical',
      width: 120,
      maxHeight: 200, // 最大高度，超出后显示上下箭头翻页
      pageIconColor: '#ccc',
      pageIconInactiveColor: '#888',
      pageIconSize: 10,
      itemGap: 10,
    },
    series: [
      {
        name: '',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['30%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '12',
            fontWeight: 'bold',
          },
        },
        data: [],
        animationType: 'scale',
        animationEasing: 'exponentialInOut',
      },
    ],
  }
  // 折线图
  const lineOption = {
    title: {
      text: '',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['支付金额', '退款金额', '支付笔数', '退款笔数'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    toolbox: {
      feature: {
        saveAsImage: {},
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [],
    },
    yAxis: [
      {
        type: 'value',
        name: '金额（元）',
        min: 0,
      },
      {
        type: 'value',
        name: '笔数',
        min: 0,
      },
    ],
    series: [],
  }

  const payChannelChart = useECharts(payChannel as Ref<HTMLDivElement>)
  const refundChannelChart = useECharts(refundChannel as Ref<HTMLDivElement>)
  const payMethodChart = useECharts(payMethod as Ref<HTMLDivElement>)
  const tradeStatisticsChart = useECharts(tradeStatistics as Ref<HTMLDivElement>)
  /**
   * 初始化数据
   */
  function initData() {
    query.startDate = props.dateObj.startDate
    query.endDate = props.dateObj.endDate
    //支付通道
    payChannelReport(query).then(({ data }) => {
      const options = JSON.parse(JSON.stringify(chartData))
      options.series[0].name = '支付通道'
      options.series[0].data = data.map((item: TradeReportResult, index) => {
        return {
          name: item.title ? item.title : `暂未配置${index}`,
          value: item.tradeAmount,
        }
      })
      payChannelChart.setOptions(options as any)
    })
    //支付方式
    refundChannelReport(query).then(({ data }) => {
      const options = JSON.parse(JSON.stringify(chartData))
      options.series[0].name = '退款通道'
      options.series[0].data = data.map((item: TradeReportResult) => {
        return {
          name: item.title,
          value: item.tradeAmount,
        }
      })
      refundChannelChart.setOptions(options as any)
    })
    //退款通道
    payMethodReport(query).then(({ data }) => {
      const options = JSON.parse(JSON.stringify(chartData))
      options.series[0].name = '支付方式'
      options.series[0].data = data.map((item: TradeReportResult) => {
        return {
          name: item.title,
          value: item.tradeAmount,
        }
      })
      payMethodChart.setOptions(options as any)
    })
    //交易统计报表
    tradeStatisticsReport(query).then(({ data }) => {
      const options = JSON.parse(JSON.stringify(lineOption))
      options.xAxis.data = data.map((item: any) => item.localDate)
      options.series = [
        {
          name: '支付金额',
          type: 'line',
          yAxisIndex: 0,
          data: data.map((item) => item.payAmount),
        },
        {
          name: '退款金额',
          type: 'line',
          yAxisIndex: 0,
          data: data.map((item) => item.refundAmount),
        },
        {
          name: '支付笔数',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((item) => item.payCount),
        },
        {
          name: '退款笔数',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((item) => item.refundCount),
        },
      ]
      tradeStatisticsChart.setOptions(options as any)
    })
  }
</script>
<style lang="scss" scoped>
  .chartPie_index {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    //公共标题
    .common_title {
      font-size: 0.9375vw;
      width: 100%;
      padding-left: 0.8333vw;
      position: relative;
      display: flex;
      align-items: center;
      color: #2e3853;
      font-size: 0.9375vw;
      font-weight: 600;
      &::before {
        position: absolute;
        left: 0;
        content: '';
        width: 0.2283vw;
        height: 0.8854vw;
        background-color: #4073e1;
        border-radius: 0px 0.5208vw 0.5208vw 0px;
      }
    }
    .chartPie_item {
      width: 32.5%;
      padding-top: 1.0417vw;
      background-color: #ffffff;
      border-radius: 0.5208vw;
    }
    .tradeStatisticsBox {
      width: 100%;
      padding-top: 1.0417vw;
      margin-top: 1.0417vw;
      background-color: #ffffff;
      border-radius: 0.5208vw;
    }
  }
</style>
