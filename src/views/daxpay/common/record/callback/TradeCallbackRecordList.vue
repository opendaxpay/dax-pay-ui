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
          height="auto"
          key-field="id"
          ref="xTable"
          :cell-style="cellStyle"
          :data="pagination.records"
          :loading="loading"
          :sort-config="{ remote: true, trigger: 'cell' }"
          @sort-change="sortChange"
        >
          <vxe-column type="seq" title="序号" width="60" />
          <vxe-column field="tradeNo" title="交易号" :min-width="230">
            <template #default="{ row }">
              <a @click="showOrder(row)">
                {{ row.tradeNo }}
              </a>
            </template>
          </vxe-column>
          <vxe-column field="outTradeNo" title="通道交易号" :min-width="230" />
          <vxe-column field="channel" title="支付通道" :min-width="150">
            <template #default="{ row }">
              <a-tag>{{ dictConvert('channel', row.channel) || '无' }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="callbackType" title="交易类型" :min-width="100">
            <template #default="{ row }">
              <a-tag>{{ dictConvert('trade_type', row.callbackType) || '无' }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="status" title="处理状态" :min-width="100">
            <template #default="{ row }">
              {{ dictConvert('callback_status', row.status) || '无' }}
            </template>
          </vxe-column>
          <vxe-column field="msg" title="提示信息" :min-width="250" />
          <vxe-column field="createTime" title="通知时间" sortable :min-width="170" />
          <vxe-column field="mchName" title="商户" :min-width="150" />
          <vxe-column field="appName" title="应用" :min-width="150" />
          <vxe-column fixed="right" width="60" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <span>
                <a-link @click="show(row)">查看</a-link>
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
      <PayOrderInfo ref="payOrderInfo" />
      <RefundOrderInfo ref="refundOrderInfo" />
      <TransferOrderInfo ref="transferOrderInfo" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { page, TradeCallbackRecord, cellStyle } from './TradeCallbackRecord.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { VxeTable, VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import { LIST, QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { useDict } from '@/hooks/bootx/useDict'
  import CallbackRecordInfo from './TradeCallbackRecordInfo.vue'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import PayOrderInfo from '@/views/daxpay/common/order/pay/PayOrderInfo.vue'
  import RefundOrderInfo from '@/views/daxpay/common/order/refund/RefundOrderInfo.vue'
  import TransferOrderInfo from '@/views/daxpay/common/order/transfer/TransferOrderInfo.vue'
  import { TradeTypeEnum } from '@/enums/daxpay/daxpayEnum'
  import { dropdown as merchantDropdown } from '@/views/daxpay/common/assist/basic/MerchantQuery.api'
  import { dropdownByMchNo as mchAppDropdown } from '@/views/daxpay/common/assist/basic/MchAppQuery.api'

  // 使用hooks
  const {
    handleTableChange,
    pageQueryResHandel,
    resetQueryParams,
    pagination,
    sortChange,
    sortParam,
    pages,
    model,
    loading,
  } = useTablePage(queryPage)
  const { dictConvert, dictDropDown } = useDict()

  const mchNoOptions = ref<LabeledValue[]>([])
  const mchAppOptions = ref<LabeledValue[]>([])
  let channelList = ref<LabeledValue[]>([])
  let callbackTypeList = ref<LabeledValue[]>([])
  let callbackStatusList = ref<LabeledValue[]>([])

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'tradeNo', type: STRING, name: '交易号', placeholder: '请输入平台交易号' },
      { field: 'outTradeNo', type: STRING, name: '通道交易号', placeholder: '请输入通道交易号' },
      {
        field: 'channel',
        type: LIST,
        name: '支付通道',
        placeholder: '请选择通道',
        selectList: channelList.value,
      },
      {
        field: 'callbackType',
        type: LIST,
        name: '交易类型',
        placeholder: '请选择交易类型',
        selectList: callbackTypeList.value,
      },
      {
        field: 'status',
        type: LIST,
        name: '处理状态',
        placeholder: '请选择消息处理状态',
        selectList: callbackStatusList.value,
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

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const callbackRecordInfo = ref<any>()
  const payOrderInfo = ref<any>()
  const refundOrderInfo = ref<any>()
  const transferOrderInfo = ref<any>()
  watch(
    () => model.queryParam?.mchNo,
    (value) => changeMch(value),
  )
  onMounted(() => {
    initData()
    vxeBind()
    queryPage()
  })
  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  /**
   * 初始化
   */
  async function initData() {
    merchantDropdown().then(({ data }) => {
      mchNoOptions.value = data
    })
    channelList.value = await dictDropDown('channel')
    callbackTypeList.value = await dictDropDown('trade_type')
    callbackStatusList.value = await dictDropDown('callback_status')
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
    return Promise.resolve()
  }
  /**
   * 查看
   */
  function show(record) {
    callbackRecordInfo.value.init(record.id)
  }

  /**
   * 查看订单单信息
   */
  function showOrder(record: TradeCallbackRecord) {
    if (record.callbackType === TradeTypeEnum.PAY) {
      payOrderInfo.value.init(record.tradeNo)
    } else if (record.callbackType === TradeTypeEnum.REFUND) {
      refundOrderInfo.value.init(record.tradeNo)
    } else if (record.callbackType === TradeTypeEnum.TRANSFER) {
      transferOrderInfo.value.init(record.tradeNo)
    }
  }
</script>

<style lang="less" scoped></style>
