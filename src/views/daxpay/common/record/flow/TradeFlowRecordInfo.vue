<template>
  <basic-modal
    title="查看交易流水"
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
            <div class="rightContent">{{ record.title }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">流水类型</div>
            <div class="rightContent">{{ dictConvert('trade_type', record.type) || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">交易金额(元)</div>
            <div class="rightContent">{{ record.amount || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="24">
          <div class="gutterItem">
            <div class="leftTitle">平台交易号</div>
            <div class="rightContent">{{ record.tradeNo }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="24">
          <div class="gutterItem">
            <div class="leftTitle">商户交易号</div>
            <div class="rightContent"> {{ record.bizTradeNo }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="24">
          <div class="gutterItem">
            <div class="leftTitle">通道交易号</div>
            <div class="rightContent"> {{ record.outTradeNo || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-divider />
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">交易通道</div>
            <div class="rightContent">{{ dictConvert('channel', record.channel) }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">创建时间</div>
            <div class="rightContent"> {{ record.createTime }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">商户号</div>
            <div class="rightContent"> {{ record.mchNo }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">应用AppId</div>
            <div class="rightContent"> {{ record.appId }}</div>
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
  import { get, TradeFlowRecord } from './TradeFlowRecord.api'
  import { BasicModal } from '@/components/Modal'
  import { useDict } from '@/hooks/bootx/useDict'
  import { ref } from 'vue'

  const { handleCancel, confirmLoading, visible, showable } = useFormEdit()
  const { dictConvert } = useDict()

  // 表单
  let record = ref<TradeFlowRecord>({})
  // 入口
  function init(id) {
    visible.value = true
    confirmLoading.value = true
    get(id).then(({ data }) => {
      record.value = data
      confirmLoading.value = false
    })
  }

  defineExpose({
    init,
  })
</script>

<style lang="less" scoped>
  :deep(.ant-descriptions-item-label) {
    width: 170px;
  }
</style>
