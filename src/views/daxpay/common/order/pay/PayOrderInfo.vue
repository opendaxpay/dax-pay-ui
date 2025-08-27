<template>
  <basic-modal
    title="查看支付订单"
    v-bind="$attrs"
    :loading="confirmLoading"
    :width="1200"
    :open="visible"
    :mask-closable="showable"
    @cancel="handleCancel"
  >
    <div class="dialogRow">
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="24">
          <div class="gutterItem">
            <div class="leftTitle">标题</div>
            <div class="rightContent">{{ order.title }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">支付通道</div>
            <div class="rightContent">{{ dictConvert('channel', order.channel) }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">支付方式</div>
            <template v-if="order.method === PayMethodEnum.OTHER">
              <div class="rightContent">{{
                dictConvert(`${order.channel}_method`, order.otherMethod)
              }}</div>
            </template>
            <template v-else>
              <div class="rightContent">{{ dictConvert('pay_method', order.method) }}</div>
            </template>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">应用名称</div>
            <div class="rightContent"> {{ order.appName || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">应用号</div>
            <div class="rightContent"> {{ order.appId || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">金额(元)</div>
            <div class="rightContent">{{ order.amount }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">可退金额(元)</div>
            <div class="rightContent">{{ order.refundableBalance }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">实付金额(元)</div>
            <div class="rightContent">{{ order.realAmount || '空' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-divider />
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="24">
          <div class="gutterItem">
            <div class="leftTitle">订单号</div>
            <div class="rightContent"> {{ order.orderNo }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="24">
          <div class="gutterItem">
            <div class="leftTitle">商户订单号</div>
            <div class="rightContent"> {{ order.bizOrderNo || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">通道交易号</div>
            <div class="rightContent">{{ order.outOrderNo || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">透传订单号</div>
            <div class="rightContent"> {{ orderExtend.transOrderNo || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">支付状态</div>
            <div class="rightContent">{{ dictConvert('pay_status', order.status) }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">退款状态</div>
            <div class="rightContent">
              {{ dictConvert('pay_refund_status', order.refundStatus) || '无' }}</div
            >
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">结算状态</div>
            <div class="rightContent">
              {{ dictConvert('settle_status', order.settleStatus) || '无' }}</div
            >
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="16">
          <div class="gutterItem">
            <div class="leftTitle">描述</div>
            <div class="rightContent"> {{ order.description || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="24">
          <div class="gutterItem">
            <div class="leftTitle">通知地址</div>
            <div class="rightContent"> {{ order.notifyUrl || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="24" v-if="order.attach">
          <div class="gutterItem">
            <div class="leftTitle">商户扩展参数</div>
            <div class="rightContent"> {{ order.attach || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="24" v-if="order.extraParam">
          <div class="gutterItem">
            <div class="leftTitle">附加参数</div>
            <div class="rightContent"> {{ order.extraParam || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="24" v-if="order.errorMsg">
          <div class="gutterItem">
            <div class="leftTitle">错误信息</div>
            <div class="rightContent"> {{ order.errorMsg || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-divider />
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">自动分账</div>
            <div class="rightContent"> {{ order.autoAllocation || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">分账状态</div>
            <div class="rightContent">{{
              dictConvert('pay_alloc_status', order.allocStatus) || '无'
            }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">付款用户ID</div>
            <div class="rightContent"> {{ orderExtend.buyerId || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">支付产品</div>
            <div class="rightContent"> {{ orderExtend.tradeProduct || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">交易方式</div>
            <div class="rightContent"> {{ orderExtend.tradeWay || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">银行卡类型</div>
            <div class="rightContent"> {{ orderExtend.bankType || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">参加活动类型</div>
            <div class="rightContent"> {{ orderExtend.promotionType || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-divider />
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">请求时间</div>
            <div class="rightContent"> {{ order.reqTime || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">过期时间</div>
            <div class="rightContent"> {{ order.expiredTime || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">支付时间</div>
            <div class="rightContent"> {{ order.payTime || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">关闭时间</div>
            <div class="rightContent"> {{ order.closeTime || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">创建时间</div>
            <div class="rightContent"> {{ order.createTime || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">终端IP</div>
            <div class="rightContent"> {{ order.clientIp || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">商户号</div>
            <div class="rightContent"> {{ order.mchNo || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8" v-if="order.agentNo">
          <div class="gutterItem">
            <div class="leftTitle">代理商号</div>
            <div class="rightContent"> {{ order.agentNo || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8" v-if="order.isvNo">
          <div class="gutterItem">
            <div class="leftTitle">服务商号</div>
            <div class="rightContent"> {{ order.isvNo || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">商户名称</div>
            <div class="rightContent"> {{ order.mchName || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8" v-if="order.agentName">
          <div class="gutterItem">
            <div class="leftTitle">代理商名称</div>
            <div class="rightContent"> {{ order.agentName || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8" v-if="order.isvName">
          <div class="gutterItem">
            <div class="leftTitle">服务商名称</div>
            <div class="rightContent"> {{ order.isvName || '无' }}</div>
          </div>
        </a-col>
      </a-row>
    </div>

    <template #footer>
      <a-space>
        <a-button key="cancel" @click="handleCancel">取消</a-button>
      </a-space>
    </template>
  </basic-modal>
</template>

<script lang="ts" setup>
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { PayOrder, getOrderByOrderNo, getOrderExtend, PayOrderExtend } from './PayOrder.api'
  import { BasicModal } from '@/components/Modal'
  import { useDict } from '@/hooks/bootx/useDict'
  import { ref } from 'vue'
  import { PayMethodEnum } from '@/enums/daxpay/daxpayEnum'

  const { handleCancel, confirmLoading, visible, showable } = useFormEdit()
  const { dictConvert } = useDict()

  let order = ref<PayOrder>({})
  let orderExtend = ref<PayOrderExtend>({})
  // 入口
  async function init(orderNo: string) {
    visible.value = true
    confirmLoading.value = true
    await getOrderByOrderNo(orderNo).then(({ data }) => {
      order.value = data
    })
    await getOrderExtend(order.value.id).then(({ data }) => {
      orderExtend.value = data
    })
    confirmLoading.value = false
  }
  // 获取信息
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
