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
              >新建</a-button
            >
          </a-space>
        </template>
      </vxe-toolbar>
      <div class="h-65vh">
        <vxe-table
          height="auto"
          ref="xTable"
          key-field="id"
          :data="pagination.records"
          :loading="loading"
        >
          <vxe-column type="seq" :width="60" />
          <vxe-column field="mchName" title="商户" :min-width="150">
            <template #default="{ row }">
              <a-link @click="show(row)">{{ row.mchName }}</a-link>
            </template>
          </vxe-column>
          <vxe-column field="mchNo" title="商户号" :min-width="170" />
          <vxe-column field="status" title="状态" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.status === MerchantStatusEnum.ENABLED" color="green">启用</a-tag>
              <a-tag v-else color="red">禁用</a-tag>
            </template>
          </vxe-column>
          <vxe-column field="administrator" title="关联管理员" :min-width="120" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.administrator" @click="showAdmin(row)" color="green"
                ><a-link>查看信息</a-link></a-tag
              >
            </template>
          </vxe-column>
          <vxe-column field="createTime" title="创建时间" :min-width="140" />
          <vxe-column fixed="right" :width="180" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <a-link @click="edit(row)">编辑</a-link>
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
      <MerchantEdit ref="merchantEdit" @ok="queryPage" />
      <MerchantCreate ref="merchantCreate" @ok="queryPage" />
      <UserShow ref="userShow" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import { del, page } from './Merchant.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import MerchantEdit from './MerchantEdit.vue'
  import BQuery from '@/components/Bootx/Query/BQuery.vue'
  import { LIST, QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { FormEditType } from '@/enums/formTypeEnum'
  import { useMessage } from '@/hooks/web/useMessage'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import ALink from '@/components/Link/Link.vue'
  import MerchantCreate from './MerchantCreate.vue'
  import UserShow from '../user/UserShow.vue'
  import { MerchantStatusEnum } from '@/enums/daxpay/daxpayEnum'
  import { useDict } from '@/hooks/bootx/useDict'
  import { LabeledValue } from 'ant-design-vue/lib/select'

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
  const { createMessage, createConfirm } = useMessage()
  const { dictDropDown } = useDict()
  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'mchName', type: STRING, name: '商户名称', placeholder: '请输入商户名称' },
      {
        field: 'merchantType',
        type: LIST,
        selectList: merchantTypeList.value,
        name: '商户类型',
        placeholder: '请选择商户类型',
      },
      {
        field: 'status',
        type: LIST,
        selectList: merchantStatusList.value,
        name: '商户状态',
        placeholder: '请选择商户状态',
      },
      {
        field: 'administrator',
        type: LIST,
        name: '关联管理员',
        placeholder: '请选择是否关联',
        selectList: [
          { label: '已关联', value: 'true' },
          { label: '未关联', value: 'false' },
        ],
      },
    ] as QueryField[]
  })
  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  const merchantEdit = ref<any>()
  const merchantTypeList = ref<LabeledValue[]>()
  const merchantStatusList = ref<LabeledValue[]>()
  const userShow = ref<any>()
  const merchantCreate = ref<any>()

  onMounted(() => {
    vxeBind()
    initData()
    queryPage()
  })

  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  /**
   * 初始化数据
   */
  async function initData() {
    merchantTypeList.value = await dictDropDown('merchant_type')
    merchantStatusList.value = await dictDropDown('merchant_status')
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
   * 创建商户
   */
  function add() {
    merchantCreate.value.init()
  }

  /**
   * 编辑
   */
  function edit(record) {
    merchantEdit.value.init(record.id, FormEditType.Edit)
  }

  /**
   * 查看
   */
  function show(record) {
    merchantEdit.value.init(record.id, FormEditType.Show)
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

  /**
   * 查看管理员信息
   */
  function showAdmin(record) {
    userShow.value.init(record.adminUserId)
  }
</script>

<style lang="less" scoped></style>
