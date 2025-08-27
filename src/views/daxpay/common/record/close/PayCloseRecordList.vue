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
          :data="pagination.records"
          :loading="loading"
          :sort-config="{ remote: true, trigger: 'cell' }"
          @sort-change="sortChange"
        >
          <vxe-column type="seq" title="序号" width="60" />
          <vxe-column field="orderNo" title="订单号" :min-width="220">
            <template #default="{ row }">
              <a @click="showPayOder(row.orderNo)">
                {{ row.orderNo }}
              </a>
            </template>
          </vxe-column>
          <vxe-column field="bizOrderNo" title="商户订单号" :min-width="180" />
          <vxe-column field="closeType" title="关闭类型" :min-width="80">
            <template #default="{ row }">
              <a-tag>{{ dictConvert('close_type', row.closeType) }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="closed" title="关闭状态" :min-width="80">
            <template #default="{ row }">
              <a-tag v-if="row.closed" color="green">成功</a-tag>
              <a-tag v-else color="red">失败</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="channel" title="支付通道" :min-width="150">
            <template #default="{ row }">
              {{ dictConvert('channel', row.channel) }}
            </template>
          </vxe-column>
          <vxe-column field="errorMsg" title="错误消息" :min-width="180" />
          <vxe-column field="clientIp" title="客户端IP" :min-width="120" />
          <vxe-column field="createTime" title="创建时间" :min-width="140" />
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
    </div>
    <PayCloseRecordInfo ref="payCloseRecordInfo" />
    <PayOrderInfo ref="payOrderInfo" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { page } from './PayCloseRecord.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { VxeTable, VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import BQuery from '@/components/Bootx/Query/BQuery.vue'
  import { LIST, QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { useDict } from '@/hooks/bootx/useDict'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import PayCloseRecordInfo from './PayCloseRecordInfo.vue'
  import PayOrderInfo from '@/views/daxpay/common/order/pay/PayOrderInfo.vue'
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
  let payChannelList = ref<LabeledValue[]>([])
  let closeTypeList = ref<LabeledValue[]>([])

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'orderNo', type: STRING, name: '订单号', placeholder: '请输入订单号' },
      { field: 'bizOrderNo', type: STRING, name: '商户订单号', placeholder: '请输入商户订单号' },
      {
        field: 'channel',
        type: LIST,
        name: '支付通道',
        placeholder: '请选择支付通道',
        selectList: payChannelList.value,
      },
      {
        field: 'closeType',
        type: LIST,
        name: '关闭类型',
        placeholder: '请选择订单关闭类型',
        selectList: closeTypeList.value,
      },
      {
        field: 'closed',
        type: LIST,
        name: '关闭状态',
        placeholder: '请选择关闭状态',
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

  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const payCloseRecordInfo = ref<any>()
  const payOrderInfo = ref<any>()
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
    payChannelList.value = await dictDropDown('channel')
    closeTypeList.value = await dictDropDown('close_type')
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
    payCloseRecordInfo.value.init(record.id)
  }

  /**
   * 查看支付单信息
   */
  function showPayOder(orderNo) {
    payOrderInfo.value.init(orderNo)
  }
</script>

<style lang="less" scoped></style>
