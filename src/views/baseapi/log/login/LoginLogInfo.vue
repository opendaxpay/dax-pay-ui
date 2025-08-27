<template>
  <basic-modal
    v-bind="$attrs"
    :loading="confirmLoading"
    width="50%"
    title="查看"
    :open="visible"
    @cancel="visible = false"
  >
    <description :column="2" size="default" :data="data" :schema="schema" />
    <template #footer>
      <a-button key="cancel" @click="visible = false">取消</a-button>
    </template>
  </basic-modal>
</template>

<script lang="ts" setup>
  import { Description, DescItem } from '@/components/Description'
  import { get, LoginLog } from './LoginLog.api'

  import BasicModal from '@/components/Modal/src/BasicModal.vue'
  import { findOneByField } from '@/utils/dataUtil'
  import { Client, findAll } from '@/views/iam/client/Client.api'
  import { onMounted, ref } from 'vue'

  onMounted(() => {
    initClients()
  })

  let clients = ref<Client[]>([])
  let data = ref<LoginLog>()
  let visible = ref(false)
  let confirmLoading = ref(false)
  let schema = [
    { field: 'account', label: '登录账号' },
    { field: 'login', label: '登录成功状态', render: (curVal) => (curVal ? '成功' : '失败') },
    { field: 'client', label: '登录终端', render: (curVal) => getClient(curVal) },
    { field: 'ip', label: '登录IP地址' },
    { field: 'browser', label: '浏览器类型' },
    { field: 'os', label: '操作系统' },
    { field: 'msg', label: '提示消息' },
    { field: 'loginTime', label: '访问时间' },
  ] as DescItem[]

  function show(id) {
    visible.value = true
    confirmLoading.value = true
    get(id).then((res) => {
      data.value = res.data
      confirmLoading.value = false
    })
  }

  /**
   * 初始化终端信息
   */
  async function initClients() {
    const { data } = await findAll()
    clients.value = data
  }

  /**
   * 获取终端信息
   */
  function getClient(code) {
    return findOneByField(clients.value, code, 'code')?.['name']
  }
  defineExpose({
    show,
  })
</script>

<style scoped></style>
