<template>
  <basic-modal
    title="退款订单"
    v-bind="$attrs"
    :loading="confirmLoading"
    :width="1200"
    :open="visible"
    :mask-closable="showable"
    @cancel="handleCancel"
  >
    <div class="dialogRow">
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">退款标题</div>
            <div class="rightContent">{{ order.title }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">退款金额(元)</div>
            <div class="rightContent">{{ order.amount ? order.amount : 0 }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <div class="gutterItem">
            <div class="leftTitle">退款通道</div>
            <div class="rightContent">{{ dictConvert('channel', order.channel) }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">退款号</div>
            <div class="rightContent">{{ order.refundNo }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">通道退款号</div>
            <div class="rightContent">{{ order.outRefundNo || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">商户退款号</div>
            <div class="rightContent">{{ order.bizRefundNo }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">支付订单号</div>
            <div class="rightContent">{{ order.orderNo }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">商户支付订单号</div>
            <div class="rightContent">{{ order.bizOrderNo }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">应用号</div>
            <div class="rightContent">
              {{ order.appId }}
            </div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">应用名称</div>
            <div class="rightContent">
              {{ order.appName }}
            </div>
          </div>
        </a-col>
      </a-row>
      <a-divider />
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">退款状态</div>
            <div class="rightContent">
              {{ dictConvert('refund_status', order.status) || '空' }}
            </div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">结算状态</div>
            <div class="rightContent">
              {{ dictConvert('settle_status', order.settleStatus) || '空' }}
            </div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">退款发起时间</div>
            <div class="rightContent">{{ order.createTime }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">退款完成时间</div>
            <div class="rightContent">
              {{ order.finishTime || '无' }}
            </div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="24" v-if="order.notifyUrl">
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
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">退款终端ip</div>
            <div class="rightContent">{{ order.clientIp }}</div>
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
      <a-button key="cancel" @click="handleCancel">取消</a-button>
    </template>
  </basic-modal>
</template>

<script lang="ts" setup>
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { getByRefundNo, RefundOrder } from './RefundOrder.api'
  import { BasicModal } from '@/components/Modal'
  import { useDict } from '@/hooks/bootx/useDict'
  import { ref } from 'vue'

  const { handleCancel, confirmLoading, visible, showable } = useFormEdit()
  const { dictConvert } = useDict()
  // 表单
  const order = ref<RefundOrder>({})

  // 入口
  async function init(refundNo) {
    visible.value = true
    confirmLoading.value = true
    getByRefundNo(refundNo).then(({ data }) => {
      order.value = data
      confirmLoading.value = false
    })
  }
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
