<template>
  <basic-modal
    title="查看通知任务"
    v-bind="$attrs"
    :loading="confirmLoading"
    :width="1200"
    :open="visible"
    :mask-closable="showable"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-descriptions title="" bordered :column="{ lg: 2, md: 1 }">
        <a-descriptions-item label="平台订单号" :span="2">
          <a-tag>{{ task.tradeNo }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="通知类型" :span="1">
          <a-tag>{{ dictConvert('notify_content_type', task.notifyType) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="是否发送成功" :span="1">
          <a-tag v-if="task.success" color="green">是</a-tag>
          <a-tag v-else color="red">否</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="发送次数" :span="1">
          {{ task.sendCount }}
        </a-descriptions-item>
        <a-descriptions-item label="下次发送时间" :span="1">
          {{ task.nextTime || '空' }}
        </a-descriptions-item>
        <a-descriptions-item label="延迟重试次数" :span="1">
          {{ task.delayCount || 0 }}
        </a-descriptions-item>
        <a-descriptions-item label="发送地址" :span="1">
          {{ task.url || '无' }}
        </a-descriptions-item>
        <a-descriptions-item label="最后发送时间" :span="1">
          {{ task.latestTime || '空' }}
        </a-descriptions-item>
        <a-descriptions-item label="创建时间" :span="1">
          {{ task.createTime }}
        </a-descriptions-item>
        <a-descriptions-item label="商户号" :span="1">
          {{ task.mchNo }}
        </a-descriptions-item>
        <a-descriptions-item label="应用AppId" :span="1">
          {{ task.appId }}
        </a-descriptions-item>
        <a-descriptions-item label="消息内容" :span="2">
          <json-preview :data="JSON.parse(task.content || '{}')" />
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button key="cancel" @click="handleCancel">取消</a-button>
      </a-space>
    </template>
  </basic-modal>
</template>

<script lang="ts" setup>
  import useFormEdit from '@/hooks/bootx/useFormEdit'
  import { get, NotifyTask } from './NotifyTask.api'
  import { BasicModal } from '@/components/Modal'
  import { useDict } from '@/hooks/bootx/useDict'
  import JsonPreview from '@/components/CodeEditor/src/json-preview/JsonPreview.vue'
  import { ref } from 'vue'

  const { handleCancel, confirmLoading, visible, showable } = useFormEdit()
  const { dictConvert } = useDict()

  let task = ref<NotifyTask>({})
  /**
   *
   */
  async function init(record: NotifyTask) {
    task.value = record
    visible.value = true
    confirmLoading.value = true
    await get(record.id).then(({ data }) => {
      task.value = data
    })
    confirmLoading.value = false
  }
  // 获取信息
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
