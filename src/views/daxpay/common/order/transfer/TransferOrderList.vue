<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query
        :query-params="model.queryParam"
        :fields="fields"
        :default-item-count="3"
        :sort-config="{ remote: true, trigger: 'cell' }"
        @query="queryPage"
        @reset="resetQueryParams"
        @sort-change="sortChange"
      />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <span style="font-size: 18px">转账金额: {{ totalAmount || 0 }} 元</span>
        </template>
      </vxe-toolbar>
      <div class="h-64vh">
        <vxe-table
          height="auto"
          key-field="id"
          ref="xTable"
          :cell-style="cellStyle"
          :sort-config="{ remote: true, trigger: 'cell' }"
          :data="pagination.records"
          :loading="loading"
          @sort-change="sortChange"
        >
          <vxe-column type="seq" title="序号" width="60" />
          <vxe-column field="transferNo" title="转账号" :min-width="230">
            <template #default="{ row }">
              <a @click="show(row)">
                {{ row.transferNo }}
              </a>
            </template>
          </vxe-column>
          <vxe-column field="bizTransferNo" title="商户转账号" :min-width="230" />
          <vxe-column field="title" title="标题" :min-width="160" />
          <vxe-column field="channel" title="转账通道" :min-width="120">
            <template #default="{ row }">
              {{ dictConvert('channel', row.channel) }}
            </template>
          </vxe-column>
          <vxe-column field="amount" title="金额(元)" :min-width="140">
            <template #default="{ row }">
              {{ row.amount }}
            </template>
          </vxe-column>
          <vxe-column field="status" title="状态" :min-width="80">
            <template #default="{ row }">
              {{ dictConvert('transfer_status', row.status) }}
            </template>
          </vxe-column>
          <vxe-column field="reason" title="转账原因" :min-width="160" />
          <vxe-column field="createTime" title="创建时间" sortable :min-width="140" />
          <vxe-column field="mchName" title="商户" :min-width="150" />
          <vxe-column field="appName" title="应用" :min-width="150" />
          <vxe-column fixed="right" :width="120" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <a-link @click="show(row)">查看</a-link>
              <a-divider type="vertical" />
              <a-dropdown>
                <a>
                  更多
                  <icon icon="ant-design:down-outlined" :size="12" />
                </a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item
                      v-if="
                        [TransferStatusEnum.FAIL, TransferStatusEnum.PROGRESS].includes(row.status)
                      "
                    >
                      <a-link @click="sync(row)">同步</a-link>
                    </a-menu-item>
                    <a-menu-item
                      v-if="
                        [TransferStatusEnum.FAIL, TransferStatusEnum.PROGRESS].includes(row.status)
                      "
                    >
                      <a-link @click="reset(row)">重试</a-link>
                    </a-menu-item>
                    <a-menu-item v-if="[TransferStatusEnum.FAIL].includes(row.status)">
                      <a-link @click="closeOrder(row)" danger>关闭</a-link>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
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
      <TransferOrderInfo ref="transferOrderInfo" @ok="queryPage" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import {
    closeTransfer,
    getTotalAmount,
    page,
    retryTransfer,
    syncByTransferId,
    cellStyle,
  } from './TransferOrder.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import TransferOrderInfo from './TransferOrderInfo.vue'
  import { VxeTable, VxeTableInstance, VxeToolbar, VxeToolbarInstance } from 'vxe-table'
  import BQuery from '@/components/Bootx/Query/BQuery.vue'
  import { useMessage } from '@/hooks/web/useMessage'
  import { LIST, QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { useDict } from '@/hooks/bootx/useDict'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import ALink from '/@/components/Link/Link.vue'
  import { TransferStatusEnum } from '@/enums/daxpay/tradeStatusEnum'
  import { Icon } from '@/components/Icon'
  import { dropdown as merchantDropdown } from '@/views/daxpay/common/assist/basic/MerchantQuery.api'
  import { dropdownByMchNo as mchAppDropdown } from '@/views/daxpay/common/assist/basic/MchAppQuery.api'

  // 使用hooks
  const {
    handleTableChange,
    pageQueryResHandel,
    resetQueryParams,
    sortChange,
    sortParam,
    pagination,
    pages,
    model,
    loading,
  } = useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()
  const { dictConvert, dictDropDown } = useDict()

  const mchNoOptions = ref<LabeledValue[]>([])
  const mchAppOptions = ref<LabeledValue[]>([])
  let channelList = ref<LabeledValue[]>([])
  let transferStatusList = ref<LabeledValue[]>([])
  let totalAmount = ref<number>(0)

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'bizTransferNo', type: STRING, name: '商户转账号', placeholder: '请输入商户转账号' },
      { field: 'transferNo', type: STRING, name: '转账号', placeholder: '请输入转账号' },
      { field: 'outTransferNo', type: STRING, name: '通道转账号', placeholder: '请输入通道转账号' },
      { field: 'title', type: STRING, name: '原支付标题', placeholder: '请输入转账标题' },
      { field: 'payeeName', type: STRING, name: '收款人姓名', placeholder: '请输入收款人姓名' },
      {
        field: 'status',
        type: LIST,
        name: '转账状态',
        placeholder: '请选择转账状态',
        selectList: transferStatusList.value,
      },
      { field: 'channel', name: '转账通道', type: LIST, selectList: channelList.value },
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
   * 初始化数据
   */
  async function initData() {
    merchantDropdown().then(({ data }) => {
      mchNoOptions.value = data
    })
    transferStatusList.value = await dictDropDown('transfer_status')
    channelList.value = await dictDropDown('channel')
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
      ...sortParam,
      ...pages,
    }).then(({ data }) => {
      pageQueryResHandel(data)
    })
    /**
     * 汇总数据
     */
    getTotalAmount({
      ...model.queryParam,
    }).then(({ data }) => {
      totalAmount.value = data
    })
    return Promise.resolve()
  }

  /**
   * 信息同步
   */
  function sync(record) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否同步转账信息',
      onOk: () => {
        loading.value = true
        syncByTransferId(record.id).then(() => {
          createMessage.success('同步成功')
          queryPage()
        })
      },
    })
  }

  /**
   * 转账重试
   */
  function reset(record) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否重新发起转账请求信息',
      onOk: () => {
        loading.value = true
        retryTransfer(record.id).then(() => {
          createMessage.success('提交成功')
          queryPage()
        })
      },
    })
  }

  /**
   * 关闭转账订单
   */
  function closeOrder(record) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '请确定该转账订单处理失败并处理完成！',
      onOk: () => {
        loading.value = true
        closeTransfer(record.id).then(() => {
          createMessage.success('关闭成功')
          queryPage()
        })
      },
    })
  }

  /**
   * 查看
   */
  function show(record) {
    transferOrderInfo.value.init(record.transferNo)
  }
</script>

<style lang="less" scoped></style>
