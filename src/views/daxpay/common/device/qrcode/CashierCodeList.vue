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
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <a-space>
            <a-button type="primary" pre-icon="ant-design:plus-outlined" @click="add"
              >生成码牌</a-button
            >
            <a-dropdown v-if="batchOperateFlag">
              <a-button post-icon="ant-design:down-outlined"> 批量操作 </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item v-if="isAgent() || isAdmin()">
                    <a-link @click="bindMchApp()">商户应用绑定</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="isAgent() || isAdmin()">
                    <a-link @click="unbindMchApp()">商户应用解绑</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="isMerchant()">
                    <a-link @click="bindApp()">应用绑定</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="isMerchant()">
                    <a-link @click="unbindAppInfo()">应用解绑</a-link>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </template>
      </vxe-toolbar>
      <div class="h-65vh">
        <vxe-table
          height="auto"
          ref="xTable"
          key-field="id"
          @checkbox-all="selectAllEvent"
          @checkbox-change="selectChangeEvent"
          :data="pagination.records"
          :loading="loading"
        >
          <vxe-column type="checkbox" :width="50" />
          <vxe-column field="code" title="编号" :min-width="180">
            <template #default="{ row }">
              <a href="javascript:" @click="show(row)">{{ row.code }}</a>
            </template>
          </vxe-column>
          <vxe-column field="name" title="名称" :min-width="150">
            <template #default="{ row }"> {{ row.name || '未命名' }} </template>
          </vxe-column>
          <vxe-column field="amount" title="类型" :min-width="130" align="center">
            <template #default="{ row }">
              <a-tag :color="row.amountType === 'fixed' ? 'green' : 'blue'">
                {{ row.amountType === 'fixed' ? '固定金额' : '任意金额' }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="amount" title="金额(元)" :min-width="150" align="center" />
          <vxe-column field="batchNo" title="批次号" :min-width="150" />
          <vxe-column field="enable" title="状态" align="center" :min-width="100">
            <template #default="{ row }">
              <a-tag :color="row.enable ? 'green' : 'red'">
                {{ row.enable ? '开启' : '关闭' }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="agentName" title="代理商" v-if="isAdmin()" :min-width="150">
            <template #default="{ row }">
              {{ row.agentName }}
            </template>
          </vxe-column>
          <vxe-column field="mchName" title="商户" v-if="isAdmin() || isAgent()" :min-width="150">
            <template #default="{ row }">
              {{ row.mchName || '未绑定' }}
            </template>
          </vxe-column>
          <vxe-column field="appName" title="应用" :min-width="150">
            <template #default="{ row }">
              {{ row.appName || '未绑定' }}
            </template>
          </vxe-column>
          <vxe-column field="createTime" title="创建时间" :min-width="140" />
          <vxe-column fixed="right" :width="180" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <a-link @click="edit(row)">编辑</a-link>
              <a-divider type="vertical" />
              <a-link @click="genCodePreview(row)">预览</a-link>
              <a-divider type="vertical" />
              <a-link danger @click="remove(row)">删除</a-link>
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
    <a-modal
      title="支付码牌"
      width="100%"
      v-model:open="qrCodeShow"
      :footer="false"
      style="width: 340px"
    >
      <qr-code
        style="margin: 20px"
        :options="{ margin: 0 }"
        :width="250"
        :value="qrCodeUrl"
        v-show="true"
      />
    </a-modal>
    <CashierCodeCreate ref="cashierCodeCreate" @ok="queryPage" />
    <CashierCodeEdit ref="cashierCodeEdit" @ok="queryPage" />
    <BindMchAppModel ref="bindMchAppModel" @ok="queryPage" />
    <BindAppModel ref="bindAppModel" @ok="queryPage" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import { del, getCodeLink, page, recoverAgent, unbindApp, unbindMch } from './CashierCode.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import BQuery from '@/components/Bootx/Query/BQuery.vue'
  import { LIST, QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { useMessage } from '@/hooks/web/useMessage'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import { FormEditType } from '@/enums/formTypeEnum'
  import CashierCodeCreate from './CashierCodeCreate.vue'
  import CashierCodeEdit from './CashierCodeEdit.vue'
  import ALink from '@/components/Link/Link.vue'
  import BindMchAppModel from './BindMchAppModel.vue'
  import BindAppModel from './BindAppModel.vue'
  import { isAdmin, isAgent, isMerchant } from '@/utils/env'
  import QrCode from '@/components/Qrcode/src/Qrcode.vue'

  // 使用hooks
  const {
    handleTableChange,
    pageQueryResHandel,
    resetQueryParams,
    pagination,
    pages,
    model,
    loading,
    batchOperateFlag,
  } = useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()
  // 查询条件
  const fields = computed(() => {
    return [
      {
        type: STRING,
        field: 'name',
        name: '名称',
        placeholder: '请输入码牌名称',
      },
      {
        type: STRING,
        field: 'code',
        name: '编号',
        placeholder: '请输入码牌编号',
      },
      {
        type: STRING,
        field: 'batchNo',
        name: '批次号',
        placeholder: '请输入批次号',
      },
    ] as QueryField[]
  })
  const qrCodeShow = ref(false)
  const qrCodeUrl = ref('')
  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const cashierCodeCreate = ref<any>()
  const cashierCodeEdit = ref<any>()
  const bindMchAppModel = ref<any>()
  const bindAppModel = ref<any>()

  onMounted(() => {
    vxeBind()
    queryPage()
  })

  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  /**
   * 选中全部
   */
  function selectAllEvent() {
    const records = xTable.value?.getCheckboxRecords()
    batchOperateFlag.value = !!records?.length
  }
  /**
   * 选中事件
   */
  function selectChangeEvent() {
    const records = xTable.value?.getCheckboxRecords()
    batchOperateFlag.value = !!records?.length
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
      batchOperateFlag.value = false
      pageQueryResHandel(data)
    })
    return Promise.resolve()
  }
  /**
   * 创建
   */
  function add() {
    cashierCodeCreate.value.init(null, FormEditType.Add)
  }

  /**
   * 编辑
   */
  function edit(record) {
    cashierCodeEdit.value.init(record.id, FormEditType.Edit)
  }

  /**
   * 二维码预览
   */
  function genCodePreview(record) {
    getCodeLink(record.code).then(({ data }) => {
      qrCodeShow.value = true
      qrCodeUrl.value = data
    })
  }

  /**
   * 查看
   */
  function show(record) {
    cashierCodeEdit.value.init(record.id, FormEditType.Show)
  }

  /**
   * 绑定商户和应用
   */
  function bindMchApp() {
    const ids = xTable.value?.getCheckboxRecords().map((o) => o.id)
    bindMchAppModel.value.init(ids)
  }

  /**
   * 解绑商户和应用
   */
  function unbindMchApp() {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否从商户中解绑选中的码牌',
      onOk: () => {
        const ids = xTable.value?.getCheckboxRecords().map((o) => o.id)
        unbindMch({ ids }).then(() => {
          createMessage.success('解绑成功')
          queryPage()
        })
      },
    })
  }

  /**
   * 绑定应用
   */
  function bindApp() {
    const ids = xTable.value?.getCheckboxRecords().map((o) => o.id)
    bindAppModel.value.init(ids)
  }

  /**
   * 解绑商户和应用
   */
  function unbindAppInfo() {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否从应用中解绑选中的码牌',
      onOk: () => {
        const ids = xTable.value?.getCheckboxRecords().map((o) => o.id)
        unbindApp({ ids }).then(() => {
          createMessage.success('解绑成功')
          queryPage()
        })
      },
    })
  }

  // 删除
  function remove(record) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否删除该条数据',
      onOk: () => {
        del(record.id).then(() => {
          createMessage.success('删除成功')
          queryPage()
        })
      },
    })
  }
</script>

<style lang="less" scoped></style>
