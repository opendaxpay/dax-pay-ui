<template>
  <basic-drawer
    v-bind="$attrs"
    width="70%"
    title="通道终端报备管理"
    :mask-closable="true"
    :open="visible"
    @close="visible = false"
  >
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }" />
      <div class="h-65vh">
        <vxe-table
          height="auto"
          key-field="id"
          ref="xTable"
          :data="record"
          :loading="loading"
          @sort-change="sortChange"
        >
          <vxe-column type="seq" title="序号" width="60" />
          <vxe-column field="channel" title="通道" :min-width="150">
            <template #default="{ row }">
              <a-link @click="show(row)" v-if="row.id">
                {{ dictConvert('channel', row.channel) }}
              </a-link>
              <template v-if="!row.id">
                {{ dictConvert('channel', row.channel) }}
              </template>
            </template>
          </vxe-column>
          <vxe-column field="type" title="报送类型" :min-width="150">
            <template #default="{ row }">
              {{ dictConvert('terminal_type', row.type) }}
            </template>
          </vxe-column>
          <vxe-column field="status" title="状态" :min-width="120" align="center">
            <template #default="{ row }">
              {{ dictConvert('channel_terminal_status', row.status) || '未创建' }}
            </template>
          </vxe-column>
          <vxe-column field="outTerminalNo" title="通道终端号" :min-width="160" />
          <vxe-column field="errorMsg" title="错误信息" :min-width="220" />
          <vxe-column fixed="right" width="220" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <template v-if="['wait', 'logged'].includes(row.status)">
                <a-link danger @click="submitInfo(row)">报送</a-link>
                <a-divider type="vertical" />
              </template>
              <template v-if="row.status === 'submit'">
                <a-link danger @click="cancelInfo(row)">注销</a-link>
                <a-divider type="vertical" />
              </template>
              <a-link v-if="!row.id" @click="genData(row)">生成配置</a-link>
              <template v-if="row.id">
                <a-link @click="edit(row)">信息修改</a-link>
                <a-divider type="vertical" />
                <a-link @click="syncInfo(row)">信息同步</a-link>
              </template>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </div>
    <ChannelTerminalEdit ref="channelTerminalEdit" @ok="queryPage" />
  </basic-drawer>
</template>

<script setup lang="ts">
  import ALink from '@/components/Link/Link.vue'
  import { VxeTable, VxeTableInstance, VxeToolbar, VxeToolbarInstance } from 'vxe-table'
  import ChannelTerminalEdit from './ChannelTerminalEdit.vue'
  import { BasicDrawer } from '@/components/Drawer'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { useMessage } from '@/hooks/web/useMessage'
  import { useDict } from '@/hooks/bootx/useDict'
  import { onMounted, ref } from 'vue'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { cancel, ChannelTerminal, getAndCreate, list, submit, sync } from './ChannelTerminal.api'

  // 使用hooks
  const { sortChange, model, loading } = useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()
  const { dictConvert } = useDict()

  const currentTerminalId = ref<string>()
  const visible = ref(false)
  const channelTerminalEdit = ref<any>()

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const record = ref<ChannelTerminal[]>([])

  onMounted(() => {
    vxeBind()
  })

  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  /**
   * 入口
   */
  async function init(terminalId) {
    visible.value = true
    currentTerminalId.value = terminalId
    queryPage().then()
  }

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true
    list({
      ...model.queryParam,
      terminalId: currentTerminalId.value,
    }).then(({ data }) => {
      loading.value = false
      record.value = data
    })
    return Promise.resolve()
  }

  /**
   * 编辑
   */
  function edit(record) {
    channelTerminalEdit.value.init(record, FormEditType.Edit)
  }

  /**
   * 查看
   */
  function show(record) {
    channelTerminalEdit.value.init(record, FormEditType.Show)
  }

  /**
   * 报备
   */
  function submitInfo(record) {
    createConfirm({
      iconType: 'info',
      title: '提示',
      content: '请确定要报备当前终端设备！',
      onOk: () => {
        loading.value = true
        submit(record.id).then(() => {
          createMessage.success('报备提交成功')
          queryPage()
        })
      },
    })
  }

  /**
   * 注销报备
   */
  function cancelInfo(record) {
    createConfirm({
      iconType: 'info',
      title: '提示',
      content: '请确定要取消报备当前终端设备！',
      onOk: () => {
        loading.value = true
        cancel(record.id).then(() => {
          createMessage.success('取消报备提交成功')
          queryPage()
        })
      },
    })
  }

  /**
   * 生成数据
   */
  function genData(record){
    const { channel, type: terminalType, terminalId } = record
    getAndCreate({
      channel: channel,
      terminalId: terminalId,
      terminalType: terminalType,
    }).then(() => {
      queryPage()
    })
  }

  /**
   * 同步报备
   */
  function syncInfo(record) {
    createConfirm({
      iconType: 'info',
      title: '提示',
      content: '请确定要同步当前终端设备的报备状态！',
      onOk: () => {
        loading.value = true
        sync(record.id).then(() => {
          createMessage.success('同步成功')
          queryPage()
        })
      },
    })
  }

  defineExpose({
    init,
  })
</script>

<style scoped lang="less"></style>
