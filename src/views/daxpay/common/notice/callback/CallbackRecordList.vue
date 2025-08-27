<template>
  <basic-drawer
    forceRender
    v-bind="$attrs"
    title="通知明细列表"
    width="60%"
    :open="visible"
    @close="visible = false"
  >
    <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }" />
    <div class="h-75vh">
      <vxe-table
        key-field="id"
        height="auto"
        ref="xTable"
        :data="pagination.records"
        :loading="loading"
        :sort-config="{ remote: true, trigger: 'cell' }"
        @sort-change="sortChange"
      >
        <vxe-column type="seq" width="60" />
        <vxe-column field="reqCount" title="请求次数" sortable>
          <template #default="{ row }">
            <a-tag color="green">{{ row.reqCount || '空' }}</a-tag>
          </template>
        </vxe-column>
        <vxe-column field="channel" title="是否成功">
          <template #default="{ row }">
            <a-tag v-if="row.success" color="green">成功</a-tag>
            <a-tag v-else color="red">失败</a-tag>
          </template>
        </vxe-column>
        <vxe-column field="sendType" title="发送类型">
          <template #default="{ row }">
            <a-tag>{{ dictConvert('notice_send_type', row.sendType) }}</a-tag>
          </template>
        </vxe-column>
        <vxe-column field="errorMsg" title="错误信息" :min-width="200" />
        <vxe-column field="createTime" title="发送时间" />
        <vxe-column fixed="right" width="60" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <span>
              <a href="javascript:" @click="show(row)">查看</a>
            </span>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
    <vxe-pager
      size="medium"
      :loading="loading"
      :current-page="pagination.current"
      :page-size="pagination.size"
      :total="pagination.total"
      @page-change="handleTableChange"
    />
    <CallbackRecordInfo ref="callbackRecordInfo" />
  </basic-drawer>
</template>

<script setup lang="ts">
  import { nextTick, ref } from 'vue'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import BasicDrawer from '/@/components/Drawer/src/BasicDrawer.vue'
  import { useDict } from '@/hooks/bootx/useDict'
  import { pageRecord, CallbackRecord } from './CallbackTask.api'
  import CallbackRecordInfo from './CallbackRecordInfo.vue'

  // 使用hooks
  const {
    handleTableChange,
    pageQueryResHandel,
    sortChange,
    pages,
    pagination,
    sortParam,
    loading,
  } = useTablePage(queryPage)
  const { dictConvert } = useDict()

  let visible = ref(false)
  let task = ref<CallbackRecord>({})
  let callbackRecordInfo = ref<any>()
  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()

  nextTick(() => {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  })

  /**
   * 入口
   */
  function init(record: CallbackRecord) {
    visible.value = true
    task.value = record
    queryPage()
  }

  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true
    pageRecord({
      taskId: task.value.id,
      ...pages,
      ...sortParam,
    }).then(({ data }) => {
      pageQueryResHandel(data)
    })
  }
  /**
   * 查看
   */
  function show(record) {
    callbackRecordInfo.value.init(record)
  }
  defineExpose({
    init,
  })
</script>

<style scoped lang="less"></style>
