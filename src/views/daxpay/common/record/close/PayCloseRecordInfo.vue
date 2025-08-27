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
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">订单号</div>
            <div class="rightContent"> {{ record.orderNo }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">业务号</div>
            <div class="rightContent"> {{ record.bizOrderNo }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">支付通道</div>
            <div class="rightContent">{{ dictConvert('channel', record.channel) }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">关闭类型</div>
            <div class="rightContent">{{ dictConvert('close_type', record.closeType) }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">是否关闭成功</div>
            <div class="rightContent">{{ record.closed ? '成功' : '失败' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">客户端IP</div>
            <div class="rightContent">{{ record.clientIp || '无' }}</div>
          </div>
        </a-col>
      </a-row>
      <a-divider />
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12" v-if="record.errorCode">
          <div class="gutterItem">
            <div class="leftTitle">错误编码</div>
            <div class="rightContent">{{ record.errorCode }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12" v-if="record.errorMsg">
          <div class="gutterItem">
            <div class="leftTitle">错误信息</div>
            <div class="rightContent">
              {{ record.errorMsg }}
            </div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">关闭时间</div>
            <div class="rightContent">{{ record.createTime }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">商户号</div>
            <div class="rightContent">{{ record.mchNo }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">应用AppId</div>
            <div class="rightContent">{{ record.appId }}</div>
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
  import { get, PayCloseRecord } from './PayCloseRecord.api'
  import { BasicModal } from '@/components/Modal'
  import { useDict } from '@/hooks/bootx/useDict'
  import { ref } from 'vue'

  const { handleCancel, confirmLoading, visible, showable } = useFormEdit()
  const { dictConvert } = useDict()

  // 表单
  const record = ref<PayCloseRecord>({})
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

<style lang="less" scoped></style>
