<template>
  <basic-modal
    title="查看"
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
            <div class="leftTitle">平台交易号</div>
            <div class="rightContent">{{ form.tradeNo }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="24">
          <div class="gutterItem">
            <div class="leftTitle">通道交易号</div>
            <div class="rightContent">{{ form.outTradeNo }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">支付通道</div>
            <div class="rightContent">{{ dictConvert('channel', form.channel) || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">交易类型</div>
            <div class="rightContent">{{
              dictConvert('trade_type', form.callbackType) || '无'
            }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">处理状态</div>
            <div class="rightContent">{{
              dictConvert('callback_status', form.status) || '无'
            }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">通知时间</div>
            <div class="rightContent">{{ form.createTime }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">处理状态</div>
            <div class="rightContent">{{
              dictConvert('callback_status', form.status) || '无'
            }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12" v-if="form.errorMsg">
          <div class="gutterItem">
            <div class="leftTitle">提示消息</div>
            <div class="rightContent">{{ form.errorMsg }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">商户号</div>
            <div class="rightContent"> {{ form.mchNo }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12" v-if="form.errorMsg">
          <div class="gutterItem">
            <div class="leftTitle">应用AppId</div>
            <div class="rightContent">{{ form.appId }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">通知消息</div>
            <div class="rightContent">
              <json-preview :data="JSON.parse(form.notifyInfo || '{}')"
            /></div>
          </div>
        </a-col>
      </a-row>
      <a-divider />
    </div>

    <template #footer>
      <a-button key="cancel" @click="handleCancel">取消</a-button>
    </template>
  </basic-modal>
</template>

<script lang="ts" setup>
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { get, TradeCallbackRecord } from './TradeCallbackRecord.api'
  import { BasicModal } from '@/components/Modal'
  import { useDict } from '@/hooks/bootx/useDict'
  import JsonPreview from '@/components/CodeEditor/src/json-preview/JsonPreview.vue'
  import { ref } from 'vue'

  const { handleCancel, confirmLoading, visible, showable } = useFormEdit()
  const { dictConvert } = useDict()

  // 表单
  let form = ref<TradeCallbackRecord>({})
  // 入口
  function init(id) {
    visible.value = true
    confirmLoading.value = true
    get(id).then(({ data }) => {
      form.value = data
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
