<template>
  <div class="mer_orderInfo">
    <a-row :gutter="[24, 24]">
      <a-col class="gutter-row" :span="24">
        <div class="orderTop">
          <div class="logoBox">
            <img src="@/assets/payicon/shopLogo.png" alt="" />
          </div>
          <div class="boxTitle">
            <div class="title">{{ infoData.mchName }}</div>
            <div class="info">
              <div class="info_item"
                >商户编号：<span>{{ infoData.mchNo || '暂无配置' }}</span>
              </div>
              <div class="info_item"
                >状态：<span>{{
                  infoData.status === MerchantStatusEnum.ENABLED ? '启用' : '禁用'
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </a-col>
      <a-col class="gutter-row" :span="24">
        <a-row :gutter="24">
          <a-col class="gutter-row" :span="15">
            <div class="orderLeft">
              <div class="left_item">
                <div class="common_title">支付订单</div>
                <div class="content_box">
                  <div class="content_item">
                    <div class="left">
                      <div class="title">订单数量</div>
                      <div class="number">
                        <CountTo
                          :startVal="0"
                          :endVal="payData.tradeCount || 0"
                          class="text-24px"
                        />
                      </div>
                    </div>
                    <div class="right"><img src="@/assets/payicon/index_order-1.png" alt="" /></div>
                  </div>
                  <div class="content_item">
                    <div class="left">
                      <div class="title">订单金额</div>
                      <div class="number">
                        <a-statistic
                          :value="payData.tradeAmount || 0"
                          :precision="2"
                          class="text-20px"
                        />
                      </div>
                    </div>
                    <div class="right"><img src="@/assets/payicon/index_order-2.png" alt="" /></div>
                  </div>
                  <div class="content_item">
                    <div class="left">
                      <div class="title">平均单笔金额</div>
                      <div class="number">
                        <a-statistic
                          :value="payData.avgAmount || 0"
                          :precision="2"
                          class="text-20px"
                        />
                      </div>
                    </div>
                    <div class="right"><img src="@/assets/payicon/index_order-3.png" alt="" /></div>
                  </div>
                  <div class="content_item">
                    <div class="left">
                      <div class="title">最大单笔金额</div>
                      <div class="number">
                        <a-statistic
                          :value="payData.maxAmount || 0"
                          :precision="2"
                          class="text-20px"
                        />
                      </div>
                    </div>
                    <div class="right"><img src="@/assets/payicon/index_order-4.png" alt="" /></div>
                  </div>
                </div>
              </div>
              <div class="left_item">
                <div class="common_title">退款订单</div>
                <div class="content_box">
                  <div class="content_item">
                    <div class="left">
                      <div class="title">订单数量</div>
                      <div class="number">
                        <CountTo
                          :startVal="0"
                          :endVal="refundData.tradeCount || 0"
                          class="text-24px"
                        />
                      </div>
                    </div>
                    <div class="right">
                      <img src="@/assets/payicon/index_order-1.png" alt="" />
                    </div>
                  </div>
                  <div class="content_item">
                    <div class="left">
                      <div class="title">订单金额</div>
                      <div class="number">
                        <a-statistic
                          :value="refundData.tradeAmount || 0"
                          :precision="2"
                          class="text-20px"
                        />
                      </div>
                    </div>
                    <div class="right">
                      <img src="@/assets/payicon/index_order-2.png" alt="" />
                    </div>
                  </div>
                  <div class="content_item">
                    <div class="left">
                      <div class="title">平均单笔金额</div>
                      <div class="number">
                        <a-statistic
                          :value="refundData.avgAmount || 0"
                          :precision="2"
                          class="text-20px"
                        />
                      </div>
                    </div>
                    <div class="right"
                      ><img src="@/assets/payicon/index_order-3.png" alt="" />
                    </div>
                  </div>
                  <div class="content_item">
                    <div class="left">
                      <div class="title">最大单笔金额</div>
                      <div class="number">
                        <a-statistic
                          :value="refundData.maxAmount || 0"
                          :precision="2"
                          class="text-20px"
                        />
                      </div>
                    </div>
                    <div class="right">
                      <img src="@/assets/payicon/index_order-4.png" alt="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a-col>
          <a-col class="gutter-row" :span="9">
            <div class="orderRight">
              <div class="common_title">通知公告</div>
              <div class="adverse_content">
                <div class="adverse_item" v-for="item in 18" :key="item">
                  <div class="left">公告{{ item }}</div>
                  <div class="date">2025-06-01</div>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </a-col>
    </a-row>
  </div>
</template>
<script lang="ts" setup>
  import { CountTo } from '@/components/CountTo'
  import { reactive, ref, watch } from 'vue'
  import { MerchantStatusEnum } from '@/enums/daxpay/daxpayEnum'
  import { payTradeReport, rfdTradeReport, TradeReportResult, getShopInfo } from '../IndexRepot.api'

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

  const payData = ref<TradeReportResult>({})
  const refundData = ref<TradeReportResult>({})
  const infoData = ref<any>({})

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

  /**
   * 初始化数据
   */
  function initData() {
    query.startDate = props.dateObj.startDate
    query.endDate = props.dateObj.endDate
    // 支付订单
    payTradeReport(query).then(({ data }) => {
      payData.value = data
    })
    // 退款订单
    rfdTradeReport(query).then(({ data }) => {
      refundData.value = data
    })
    getShopInfo().then(({ data }) => {
      infoData.value = data
    })
  }
</script>
<style lang="scss" scoped>
  .mer_orderInfo {
    //公共标题
    .common_title {
      box-sizing: border-box;
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
    .orderTop {
      display: flex;
      padding: 1.3021vw 1.0417vw;
      box-sizing: border-box;
      height: 7.2917vw;
      width: 100%;
      background-color: #fff;
      border-radius: 0.5208vw;
      .logoBox {
        img {
          height: 3.4896vw;
        }
      }
      .boxTitle {
        margin-left: 1.1979vw;
        .title {
          font-size: 1.25vw;
          color: #2567d1;
          font-weight: 600;
        }
        .info {
          display: flex;
          flex-wrap: wrap;
          width: 26.0417vw;
          .info_item {
            width: 45%;
            margin-top: 0.5208vw;
            font-size: 0.8333vw;
            color: #000000;
            span {
              font-weight: 600;
            }
          }
        }
      }
    }
    .orderLeft {
      height: 19.375vw;
      border-radius: 0.5208vw;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      .left_item {
        box-sizing: border-box;
        height: 48%;
        padding: 1.0417vw 0vw;
        border-radius: 0.5208vw;
        background-color: #fff;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 1.0417vw;
        .content_box {
          box-sizing: border-box;
          padding: 0vw 0.8333vw;
          display: flex;
          gap: 0.8333vw;
          .content_item {
            box-sizing: border-box;
            background-color: #f9fbff;
            border-radius: 0.5208vw;
            flex: 1;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            padding: 0.625vw 0.7292vw;
            .left {
              display: flex;
              flex-direction: column;
              gap: 0.7292vw;
              .title {
                font-size: 1.0938vw;
                color: #000000;
              }
              .number {
                font-size: 1.8229vw;
                color: #303133;
              }
            }
            .right {
              img {
                width: 2.7604vw;
                height: 2.7604vw;
              }
            }
          }
        }
      }
    }
    .orderRight {
      height: 19.375vw;
      padding: 1.4063vw 0vw 0.5208vw;
      background-color: #ffffff;
      box-sizing: border-box;
      border-radius: 0.5208vw;
      display: flex;
      flex-direction: column;
      gap: 0.6771vw;
      .adverse_content {
        padding: 0vw 1.0417vw 0vw;
        height: calc(100% - 2.4646vw);
        box-sizing: border-box;
        overflow: scroll;
        .adverse_item {
          display: flex;
          margin-bottom: 0.3125vw;
          box-sizing: border-box;
          justify-content: space-between;
          font-size: 0.7292vw;
          gap: 1.0417vw;
          .left {
            color: #606266;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            &:hover {
              color: red;
              cursor: pointer;
            }
          }
          .date {
            width: 3.9042vw;
            color: #909399;
          }
        }
      }
    }
  }
</style>
