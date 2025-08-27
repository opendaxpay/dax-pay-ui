<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <a-transfer
        show-search
        v-model:target-keys="targetKeys"
        :data-source="list"
        :filter-option="filterOption"
        :render="(item) => item.title"
      />
      <a-button class="mt-5" type="primary" :disabled="!targetKeys.length" @click="submit"
        >删除</a-button
      >
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { getCachePrefix, clearCacheByPrefix } from './CacheClear.api'
  import { useMessage } from '@/hooks/web/useMessage'

  const { createMessage, createConfirm } = useMessage()

  interface Data {
    key: string
    title: string
    description: string
    chosen: boolean
  }
  const list = ref<Data[]>([])

  const targetKeys = ref<string[]>([])
  onMounted(() => {
    initData()
  })
  function initData() {
    getCachePrefix().then(({ data }) => {
      list.value = data.map((item) => {
        return {
          key: item,
          title: item,
          description: item,
          chosen: false,
        }
      })
    })
  }

  /**
   * 提交
   */
  function submit() {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否删除选中的缓存前缀对应的数据',
      onOk: () => {
        clearCacheByPrefix(targetKeys.value).then(() => {
          createMessage.success('缓存清除成功')
        })
      },
    })
  }

  /**
   * 搜索
   */
  function filterOption(inputValue: string, option: Data) {
    return option.description.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
  }
</script>
