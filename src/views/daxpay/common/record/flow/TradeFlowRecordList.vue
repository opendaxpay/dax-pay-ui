<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query
        :query-params="model.queryParam"
        :default-item-count="3"
        :fields="fields"
        @query="queryPage"
        @reset="resetQueryParams"
      />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <span style="font-size: 18px">收入金额: {{ totalAmount.incomeAmount || 0 }} 元</span>
          <span style="font-size: 18px; margin-left: 50px"
            >退款金额: {{ totalAmount.refundAmount || 0 }} 元</span
          >
          <span style="font-size: 18px; margin-left: 50px"
            >转账金额: {{ totalAmount.transferAmount || 0 }} 元</span
          >
        </template>
      </vxe-toolbar>
      <div class="h-65vh">
        <vxe-table
          height="auto"
          key-field="id"
          ref="xTable"
          :data="pagination.records"
          :loading="loading"
        >
          <vxe-column type="seq" title="序号" width="60" />
          <vxe-column field="title" title="标题" :min-width="230" />
          <vxe-column field="amount" title="金额(元)" :min-width="120" sortable>
            <template #default="{ row }">
              {{ row.amount || '空' }}
            </template>
          </vxe-column>
          <vxe-column field="type" title="流水类型" :min-width="120">
            <template #default="{ row }">
              <a-tag>{{ dictConvert('trade_type', row.type) || '无' }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="channel" title="交易通道" :min-width="150">
            <template #default="{ row }">
              <a-tag>{{ dictConvert('channel', row.channel) || '无' }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="tradeNo" title="平台交易号" :min-width="230">
            <template #default="{ row }">
              <a @click="showOrder(row)">
                {{ row.tradeNo }}
              </a>
            </template>
          </vxe-column>
          <vxe-column field="bizTradeNo" title="商户交易号" :min-width="230" />
          <vxe-column field="outTradeNo" title="通道交易号" :min-width="230" />
          <vxe-column field="createTime" title="时间" :min-width="170" sortable />
          <vxe-column field="mchName" title="商户" :min-width="150" />
          <vxe-column field="appName" title="应用" :min-width="150" />
          <vxe-column fixed="right" :min-width="60" :showOverflow="false" title="操作">
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
    </div>
    <TradeFlowRecordInfo ref="tradeFlowRecordInfo" />
    <PayOrderInfo ref="payOrderInfo" />
    <RefundOrderInfo ref="refundOrderInfo" />
    <TransferOrderInfo ref="transferOrderInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { amountSummary, page, TradeFlowRecord } from './TradeFlowRecord.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { VxeTable, VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import BQuery from '@/components/Bootx/Query/BQuery.vue'
  import { LIST, QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { useDict } from '@/hooks/bootx/useDict'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import PayOrderInfo from '@/views/daxpay/common/order/pay/PayOrderInfo.vue'
  import RefundOrderInfo from '@/views/daxpay/common/order/refund/RefundOrderInfo.vue'
  import TransferOrderInfo from '@/views/daxpay/common/order/transfer/TransferOrderInfo.vue'
  import ALink from '@/components/Link/Link.vue'
  import TradeFlowRecordInfo from './TradeFlowRecordInfo.vue'
  import { TradeTypeEnum } from '@/enums/daxpay/daxpayEnum'
  import { dropdown as merchantDropdown } from '@/views/daxpay/common/assist/basic/MerchantQuery.api'
  import { dropdownByMchNo as mchAppDropdown } from '@/views/daxpay/common/assist/basic/MchAppQuery.api'

  // 使用hooks
  const {
    handleTableChange,
    pageQueryResHandel,
    resetQueryParams,
    pagination,
    pages,
    model,
    loading,
  } = useTablePage(queryPage)
  const { dictConvert, dictDropDown } = useDict()

  const mchNoOptions = ref<LabeledValue[]>([])
  const mchAppOptions = ref<LabeledValue[]>([])
  const payChannelList = ref<LabeledValue[]>([])
  const tradeFlowRecordTypeList = ref<LabeledValue[]>([])

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'title', type: STRING, name: '订单标题', placeholder: '请输入订单标题' },
      { field: 'tradeNo', type: STRING, name: '平台交易号', placeholder: '请输入平台交易号' },
      { field: 'bizTradeNo', type: STRING, name: '商户交易号', placeholder: '请输入商户交易号' },
      { field: 'outTradeNo', type: STRING, name: '通道交易号', placeholder: '请输入通道交易号' },
      {
        field: 'type',
        type: LIST,
        name: '流水类型',
        placeholder: '请选择流水类型',
        selectList: tradeFlowRecordTypeList.value,
      },
      {
        field: 'channel',
        type: LIST,
        name: '交易通道',
        placeholder: '请选择交易通道',
        selectList: payChannelList.value,
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
  const payOrderInfo = ref<any>()
  const refundOrderInfo = ref<any>()
  const transferOrderInfo = ref<any>()
  const tradeFlowRecordInfo = ref<any>()
  const totalAmount = ref({
    incomeAmount: 0.0,
    refundAmount: 0.0,
    transferAmount: 0.0,
  })

  onMounted(() => {
    initData()
    vxeBind()
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
    tradeFlowRecordTypeList.value = await dictDropDown('trade_type')
    payChannelList.value = await dictDropDown('channel')
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
    // 分页查询
    page({
      ...model.queryParam,
      ...pages,
    }).then(({ data }) => {
      pageQueryResHandel(data)
    })
    // 金额汇总
    amountSummary(model.queryParam).then(({ data }) => {
      totalAmount.value = data
    })
    return Promise.resolve()
  }

  /**
   * 查看
   */
  function show(record) {
    tradeFlowRecordInfo.value.init(record.id)
  }

  /**
   * 查看支付单信息
   */
  function showOrder(record: TradeFlowRecord) {
    if (record.type === TradeTypeEnum.PAY) {
      payOrderInfo.value.init(record.tradeNo)
    } else if (record.type === TradeTypeEnum.REFUND) {
      refundOrderInfo.value.init(record.tradeNo)
    } else if (record.type === TradeTypeEnum.TRANSFER) {
      transferOrderInfo.value.init(record.tradeNo)
    }
  }
</script>

<style lang="less" scoped></style>
