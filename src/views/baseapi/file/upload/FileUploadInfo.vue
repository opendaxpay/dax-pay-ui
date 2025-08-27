<template>
  <basic-modal
    v-bind="$attrs"
    :loading="confirmLoading"
    :width="1000"
    title="查看"
    :open="visible"
    @cancel="visible = false"
  >
    <description :column="1" :data="data" :schema="schema" />
    <template #footer>
      <a-button type="primary" @click="down(data)">后台下载</a-button>
      <a-button @click="visible = false">取消</a-button>
    </template>
  </basic-modal>
</template>

<script setup lang="ts">
  import BasicModal from '/@/components/Modal/src/BasicModal.vue'
  import { DescItem, Description } from '@/components/Description'
  import { downloadFile, get, UpdateFileInfo } from './FileUpload.api'
  import { ref } from 'vue'
  import { useMessage } from '@/hooks/web/useMessage'

  const data = ref<UpdateFileInfo>({})
  const confirmLoading = ref<boolean>(false)
  const visible = ref<boolean>(false)
  const { createConfirm } = useMessage()
  let schema = [
    { field: 'id', label: '主键' },
    { field: 'originalFilename', label: '原始文件名' },
    { field: 'filename', label: '文件储存名称' },
    { field: 'url', label: '存储和访问路径' },
    { field: 'ext', label: '文件扩展名' },
    { field: 'contentType', label: 'MIME类型' },
    { field: 'platformName', label: '存储平台' },
    { field: 'createTime', label: '创建时间' },
  ] as DescItem[]

  /**
   * 初始化数据
   */
  function init(id) {
    visible.value = true
    get(id).then((res) => {
      data.value = res.data
    })
  }

  /**
   * 下载文件
   */
  function down(info: UpdateFileInfo) {
    createConfirm({
      iconType: 'info',
      title: '提示',
      content: '是否要从后台下载该文件，注意请不要下载大文件，可能导致系统的不可',
      onOk: async () => {
        downloadFile(info.url).then((response) => {
          // 创建一个临时 URL 指向这个 blob 对象
          const url = window.URL.createObjectURL(new Blob([response.data]))

          // 创建 a 标签进行下载
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', info?.originalFilename as string) // 设置你想要的文件名
          document.body.appendChild(link)
          link.click()

          // 清理资源
          link.remove()
          window.URL.revokeObjectURL(url)
        })
      },
    })
  }
  defineExpose({ init })
</script>

<style scoped lang="less"></style>
