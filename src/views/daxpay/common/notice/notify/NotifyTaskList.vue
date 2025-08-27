<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query
        :query-params="model.queryParam"
        :fields="fields"
        @query="queryPage"
        @reset="resetQueryParams"
      />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }" />
      <div class="h-65vh">
        <vxe-table
          key-field="id"
          ref="xTable"
          height="auto"
          :data="pagination.records"
          :loading="loading"
          :sort-config="{ remote: true, trigger: 'cell' }"
          @sort-change="sortChange"
        >
          <vxe-column type="seq" title="序号" width="60" />
          <vxe-column field="orderId" title="平台交易号" :min-width="230">
            <template #default="{ row }">
              <a-link @click="showOrder(row)">
                {{ row.tradeNo }}
              </a-link>
            </template>
          </vxe-column>
          <vxe-column field="notifyType" title="通知类型" :min-width="180">
            <template #default="{ row }">
              <a-tag>{{ dictConvert('notify_content_type', row.notifyType) }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="success" title="发送状态" sortable :min-width="120">
            <template #default="{ row }">
              <a-tag v-if="row.success" color="green">成功</a-tag>
              <a-tag v-else color="red">失败</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="sendCount" title="发送次数" sortable :min-width="120" />
          <vxe-column field="nextTime" title="下次发送时间" sortable :min-width="170" />
          <vxe-column field="delayCount" title="延迟重试次数" sortable :min-width="150" />
          <vxe-column field="latestTime" title="最后发送时间" sortable :min-width="170" />
          <vxe-column field="createTime" title="创建时间" sortable :min-width="140" />
          <vxe-column field="mchName" title="商户" :min-width="150" />
          <vxe-column field="appName" title="应用" :min-width="150" />
          <vxe-column fixed="right" width="180" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <a-link @click="show(row)">查看</a-link>
              <a-divider type="vertical" />
              <a-link @click="showRecord(row)">记录列表</a-link>
              <a-divider type="vertical" />
              <a-link @click="resetSend(row)">重发</a-link>
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
    </div>
    <NotifyTaskInfo ref="notifyTaskInfo" />
    <PayOrderInfo ref="payOrderInfo" />
    <RefundOrderInfo ref="refundOrderInfo" />
    <TransferOrderInfo ref="transferOrderInfo" />
    <NotifyRecordList ref="notifyRecordList" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { NotifyTask, page, send } from './NotifyTask.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import BQuery from '@/components/Bootx/Query/BQuery.vue'
  import { useMessage } from '@/hooks/web/useMessage'
  import { LIST, QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { useDict } from '@/hooks/bootx/useDict'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import ALink from '@/components/Link/Link.vue'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import NotifyTaskInfo from './NotifyTaskInfo.vue'
  import PayOrderInfo from '@/views/daxpay/common/order/pay/PayOrderInfo.vue'
  import TransferOrderInfo from '@/views/daxpay/common/order/transfer/TransferOrderInfo.vue'
  import NotifyRecordList from './NotifyRecordList.vue'
  import { NotifyContentTypeEnum } from '@/enums/daxpay/daxpayEnum'
  import RefundOrderInfo from '@/views/daxpay/common/order/refund/RefundOrderInfo.vue'
  import { dropdown as merchantDropdown } from '@/views/daxpay/common/assist/basic/MerchantQuery.api'
  import { dropdownByMchNo as mchAppDropdown } from '@/views/daxpay/common/assist/basic/MchAppQuery.api'

  // 使用hooks
  const {
    handleTableChange,
    pageQueryResHandel,
    sortChange,
    resetQueryParams,
    pagination,
    pages,
    sortParam,
    model,
    loading,
  } = useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()
  const { dictConvert, dictDropDown } = useDict()
  let noticeTypeList = ref<LabeledValue[]>([])

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'tradeNo', type: STRING, name: '平台交易号', placeholder: '请输入平台交易号' },
      {
        field: 'noticeType',
        type: LIST,
        name: '通知类型',
        placeholder: '请选择通知类型',
        selectList: noticeTypeList.value,
      },
      {
        field: 'success',
        type: LIST,
        name: '发送状态',
        placeholder: '请选择发送状态',
        selectList: [
          { label: '成功', value: 'true' },
          { label: '失败', value: 'false' },
        ],
      },
      {
        field: 'mchNo',
        type: LIST,
        name: '商户号',
        placeholder: '请选择商户号',
        selectList: mchNoOptions.value,
      },
      {
        field: 'appId',
        type: LIST,
        name: '应用号',
        placeholder: '请先选择商户后选择应用号',
        selectList: mchAppOptions.value,
      },
    ] as QueryField[]
  })

  const mchNoOptions = ref<LabeledValue[]>([])
  const mchAppOptions = ref<LabeledValue[]>([])
  const notifyRecordList = ref<any>()
  const notifyTaskInfo = ref<any>()
  const payOrderInfo = ref<any>()
  const refundOrderInfo = ref<any>()
  const transferOrderInfo = ref<any>()
  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()

  onMounted(() => {
    vxeBind()
    initData()
    queryPage()
  })
  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }
  watch(
    () => model.queryParam?.mchNo,
    (value) => changeMch(value),
  )

  /**
   * 初始化
   */
  async function initData() {
    merchantDropdown().then(({ data }) => {
      mchNoOptions.value = data
    })
    noticeTypeList.value = await dictDropDown('notify_content_type')
  }
  /**
   * 商户变动后更新应用列表
   */
  function changeMch(mchNo) {
    if (mchNo) {
      mchAppDropdown(mchNo).then(({ data }) => {
        mchAppOptions.value = data
      })
    } else {
      mchAppOptions.value = []
      model.queryParam.appId = undefined
    }
  }
  /**
   * 分页查询
   */
  function queryPage() {
    loading.value = true
    page({
      ...model.queryParam,
      ...pages,
      ...sortParam,
    }).then(({ data }) => {
      pageQueryResHandel(data)
    })
  }

  /**
   * 重新发送消息
   */
  function resetSend(record: NotifyTask) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否重新发送通知消息？',
      onOk: () => {
        loading.value = true
        send(record.id).then(() => {
          createMessage.success('请求已发送')
          queryPage()
        })
      },
    })
  }

  /**
   * 查看
   */
  function show(record) {
    notifyTaskInfo.value.init(record)
  }
  /**
   * 查看记录列表
   */
  function showRecord(record) {
    notifyRecordList.value.init(record)
  }
  /**
   * 查看订单信息
   */
  function showOrder(record: NotifyTask) {
    console.log(record.notifyType)
    if (record.notifyType === NotifyContentTypeEnum.PAY) {
      payOrderInfo.value.init(record.tradeNo)
    } else if (record.notifyType === NotifyContentTypeEnum.REFUND) {
      refundOrderInfo.value.init(record.tradeNo)
    } else if (record.notifyType === NotifyContentTypeEnum.TRANSFER) {
      transferOrderInfo.value.init(record.tradeNo)
    }
  }
</script>

<style lang="less" scoped></style>
