<template>
  <basic-modal
    title="转账订单"
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
            <div class="leftTitle">转账号</div>
            <div class="rightContent">{{ order.transferNo }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">商户转账号</div>
            <div class="rightContent">{{ order.transferNo }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">通道转账号</div>
            <div class="rightContent">{{ order.outTransferNo }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">标题</div>
            <div class="rightContent">{{ order.title }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">转账金额(元)</div>
            <div class="rightContent">{{ order.amount || '无' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">转账原因</div>
            <div class="rightContent">{{ order.reason }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">收款人姓名</div>
            <div class="rightContent">{{ order.payeeName || '空' }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">收款人账号</div>
            <div class="rightContent"> {{ order.payeeAccount }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">状态</div>
            <div class="rightContent">{{
              dictConvert('transfer_status', order.status) || '空'
            }}</div>
          </div>
        </a-col>
      </a-row>
      <a-divider />
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">创建时间</div>
            <div class="rightContent">{{ order.createTime }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">完成时间</div>
            <div class="rightContent"> {{ order.finishTime }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12" v-if="order.errorCode">
          <div class="gutterItem">
            <div class="leftTitle">错误码</div>
            <div class="rightContent">{{ order.errorCode }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12" v-if="order.errorMsg">
          <div class="gutterItem">
            <div class="leftTitle">错误信息</div>
            <div class="rightContent"> {{ order.errorMsg }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">终端ip</div>
            <div class="rightContent">{{ order.clientIp }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">商户号</div>
            <div class="rightContent"> {{ order.mchNo }}</div>
          </div>
        </a-col>
      </a-row>
      <a-row :gutter="[16, 24]">
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">应用AppId</div>
            <div class="rightContent">{{ order.appId }}</div>
          </div>
        </a-col>
        <a-col class="gutter-row" :span="12">
          <div class="gutterItem">
            <div class="leftTitle">商户扩展参数</div>
            <div class="rightContent"> {{ order.attach || '无' }}</div>
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
  import { findByTransferNo, TransferOrder } from './TransferOrder.api'
  import { BasicModal } from '@/components/Modal'
  import { useDict } from '@/hooks/bootx/useDict'
  import { ref } from 'vue'

  const { handleCancel, confirmLoading, visible, showable } = useFormEdit()
  const { dictConvert } = useDict()
  // 表单
  const order = ref<TransferOrder>({})

  // 入口
  async function init(transferNo) {
    visible.value = true
    confirmLoading.value = true
    findByTransferNo(transferNo).then(({ data }) => {
      order.value = data
      confirmLoading.value = false
    })
  }
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped>
  :deep(.ant-descriptions-item-label) {
    width: 200px;
  }
  :deep(.ant-descriptions-item-content) {
    width: 400px;
  }
</style>
