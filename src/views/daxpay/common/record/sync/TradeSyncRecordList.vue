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
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }" />
      <div class="h-65vh">
        <vxe-table
          height="auto"
          key-field="id"
          ref="xTable"
          :data="pagination.records"
          :loading="loading"
        >
          <vxe-column type="seq" title="序号" width="60" />
          <vxe-column field="tradeNo" title="平台交易号" :min-width="230">
            <template #default="{ row }">
              <a @click="showOrder(row)">
                {{ row.tradeNo }}
              </a>
            </template>
          </vxe-column>
          <vxe-column field="bizTradeNo" title="商户交易号" :min-width="230" />
          <vxe-column field="outTradeNo" title="通道交易号" :min-width="250" />
          <vxe-column field="type" title="同步类型" :min-width="120">
            <template #default="{ row }">
              <a-tag>{{ dictConvert('trade_type', row.tradeType) }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="channel" title="同步通道" :min-width="150">
            <template #default="{ row }">
              <a-tag>{{ dictConvert('channel', row.channel) }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="outTradeStatus" title="通道状态" :min-width="150" />
          <vxe-column field="repairOrder" title="是否调整" width="170">
            <template #default="{ row }">
              <a-tag v-if="row.adjust" color="green"> 已调整 </a-tag>
              <a-tag v-else>未调整</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="errorMsg" title="错误消息" :min-width="160" />
          <vxe-column field="createTime" title="同步时间" :min-width="170" />
          <vxe-column field="mchName" title="商户" :min-width="150" />
          <vxe-column field="appName" title="应用" :min-width="150" />
          <vxe-column fixed="right" :min-width="50" :showOverflow="false" title="操作">
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
    <TradeSyncRecordInfo ref="tradeSyncRecordInfo" />
    <PayOrderInfo ref="payOrderInfo" />
    <RefundOrderInfo ref="refundOrderInfo" />
    <TransferOrderInfo ref="transferOrderInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { page, TradeSyncRecord } from './TradeSyncRecord.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { VxeTable, VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import BQuery from '@/components/Bootx/Query/BQuery.vue'
  import { LIST, QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { useDict } from '@/hooks/bootx/useDict'
  import { TradeTypeEnum } from '@/enums/daxpay/daxpayEnum'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import ALink from '/@/components/Link/Link.vue'
  import PayOrderInfo from '@/views/daxpay/common/order/pay/PayOrderInfo.vue'
  import TradeSyncRecordInfo from './TradeSyncRecordInfo.vue'
  import RefundOrderInfo from '@/views/daxpay/common/order/refund/RefundOrderInfo.vue'
  import TransferOrderInfo from '@/views/daxpay/common/order/transfer/TransferOrderInfo.vue'
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
  let syncStatusList = ref<LabeledValue[]>([])
  let payChannelList = ref<LabeledValue[]>([])
  let syncTypeList = ref<LabeledValue[]>([])

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'tradeNo', type: STRING, name: '平台交易号', placeholder: '请输入平台交易号' },
      { field: 'bizTradeNo', type: STRING, name: '商户交易号', placeholder: '请输入商户交易号' },
      { field: 'outTradeNo', type: STRING, name: '通道交易号', placeholder: '请输入通道交易号' },
      {
        field: 'syncType',
        type: LIST,
        name: '同步类型',
        placeholder: '请选择同步类型',
        selectList: syncTypeList.value,
      },
      {
        field: 'outTradeStatus',
        type: LIST,
        name: '同步结果',
        placeholder: '请选择同步结果',
        selectList: syncStatusList.value,
      },
      {
        field: 'channel',
        type: LIST,
        name: '同步通道',
        placeholder: '请选择同步通道',
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
  const tradeSyncRecordInfo = ref<any>()
  const payOrderInfo = ref<any>()
  const refundOrderInfo = ref<any>()
  const transferOrderInfo = ref<any>()

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
    syncStatusList.value = await dictDropDown('PaySyncStatus')
    payChannelList.value = await dictDropDown('channel')
    syncTypeList.value = await dictDropDown('PaymentType')
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
    }).then(({ data }) => {
      pageQueryResHandel(data)
    })
    return Promise.resolve()
  }
  /**
   * 查看
   */
  function show(record) {
    tradeSyncRecordInfo.value.init(record.id)
  }

  /**
   * 查看支付单信息
   */
  function showOrder(record: TradeSyncRecord) {
    if (record.tradeType === TradeTypeEnum.PAY) {
      payOrderInfo.value.init(record.tradeNo)
    } else if (record.tradeType === TradeTypeEnum.REFUND) {
      refundOrderInfo.value.init(record.tradeNo)
    } else if (record.tradeType === TradeTypeEnum.TRANSFER) {
      transferOrderInfo.value.init(record.tradeNo)
    }
  }
</script>

<style lang="less" scoped></style>
