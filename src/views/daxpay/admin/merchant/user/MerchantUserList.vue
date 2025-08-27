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
            <a-dropdown v-if="batchOperateFlag">
              <a-button post-icon="ant-design:down-outlined"> 批量操作 </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item>
                    <a @click="lockUserConfirmBatch(true)">封禁账号</a>
                  </a-menu-item>
                  <a-menu-item>
                    <a @click="lockUserConfirmBatch(false)">解锁账号</a>
                  </a-menu-item>
                  <a-menu-item>
                    <a @click="resetPwdBatch()">重置密码</a>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </template>
      </vxe-toolbar>
      <div class="h-65vh">
        <vxe-table
          ref="xTable"
          height="auto"
          size="medium"
          @checkbox-all="selectAllEvent"
          @checkbox-change="selectChangeEvent"
          :loading="loading"
          :data="pagination.records"
        >
          <vxe-column type="checkbox" width="50" />
          <vxe-column field="account" title="登录账号" :min-width="170" />
          <vxe-column field="name" title="用户名称" :min-width="150" />
          <vxe-column field="status" title="用户状态" align="center" :min-width="100">
            <template #default="{ row }">
              {{ dictConvert('user_status', row.status) || '无' }}
            </template>
          </vxe-column>
          <vxe-column field="mchName" title="商户" :min-width="150" />
          <vxe-column field="phone" title="手机号" :min-width="150" />
          <vxe-column field="email" title="邮箱" :min-width="150" />
          <vxe-column fixed="right" width="170" :showOverflow="false" title="操作">
            <template #default="{ row }">
              <a href="javascript:" @click="show(row)">查看</a>
              <a-divider type="vertical" />
              <a href="javascript:" @click="edit(row)">编辑</a>
              <a-divider type="vertical" />
              <a-dropdown>
                <a> 更多 <icon icon="ant-design:down-outlined" :size="12" /> </a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item>
                      <a-link @click="resetPwd(row)">重置密码</a-link>
                    </a-menu-item>
                    <a-menu-item v-if="[UserStatusEnum.NORMAL].includes(row.status)">
                      <a-link danger @click="lockUserConfirm(row.id, true)">封禁账号</a-link>
                    </a-menu-item>
                    <a-menu-item
                      v-if="[UserStatusEnum.LOCK, UserStatusEnum.BAN].includes(row.status)"
                    >
                      <a-link @click="lockUserConfirm(row.id, false)">解锁账号</a-link>
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
      <UserEdit ref="userEdit" @ok="queryPage" />
      <UserShow ref="userShow" />
      <UserResetPwd ref="userResetPwd" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { useMessage } from '@/hooks/web/useMessage'
  import { onMounted, ref } from 'vue'
  import { QueryField, STRING } from '@/components/Bootx/Query/Query'
  import { VxeTableInstance, VxeToolbarInstance } from 'vxe-table'
  import { useDict } from '@/hooks/bootx/useDict'
  import { Icon } from '@/components/Icon'
  import UserShow from './UserShow.vue'
  import UserEdit from './UserEdit.vue'
  import UserResetPwd from './UserResetPwd.vue'
  import ALink from '@/components/Link/Link.vue'
  import { page, banUser, banUserBatch, unlockUser, unlockUserBatch } from './MerchantUser.api'
  import { UserStatusEnum } from '@/enums/bootx/bootxEnum'

  const { createConfirm } = useMessage()
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
  const { dictConvert } = useDict()

  // 查询条件
  const fields = [
    { field: 'account', type: STRING, name: '登录账号', placeholder: '请输入要查询的登录账号' },
    { field: 'name', type: STRING, name: '用户名称', placeholder: '请输入要查询的用户名称' },
  ] as QueryField[]
  const xTable = ref<VxeTableInstance>()
  const xToolbar = ref<VxeToolbarInstance>()
  let userEdit = ref<any>()
  let userShow = ref<any>()
  let userResetPwd = ref<any>()

  onMounted(() => {
    vxeBind()
    queryPage()
  })
  function vxeBind() {
    xTable.value?.connect(xToolbar.value as VxeToolbarInstance)
  }

  // 分页查询
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
   * 封禁/解锁用户
   * @param userId 用户id
   * @param type true 封禁, false 解锁
   */
  function lockUserConfirm(userId, type: boolean) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: type ? '是否封禁选中的用户' : '是否解锁选中的用户',
      onOk: async () => {
        if (type) {
          await banUser(userId)
        } else {
          await unlockUser(userId)
        }
        queryPage()
      },
    })
  }
  /**
   * 批量封禁/解锁用户
   * @param type true 封禁, false 解锁
   */
  function lockUserConfirmBatch(type) {
    const userIds = xTable.value?.getCheckboxRecords().map((o) => o.id)
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: type ? '是否封禁选中的用户' : '是否解锁选中的用户',
      onOk: async () => {
        if (type) {
          await banUserBatch(userIds)
        } else {
          await unlockUserBatch(userIds)
        }
        queryPage().then()
      },
    })
  }
  /**
   * 查看信息
   */
  function show(record) {
    userShow.value.init(record.id)
  }
  /**
   * 信息编辑
   */
  function edit(record) {
    userEdit.value.init(record.id)
  }
  /**
   * 重置密码
   */
  function resetPwd(record) {
    userResetPwd.value.init(false, record.id)
  }
  /**
   * 重置密码
   */
  function resetPwdBatch() {
    const userIds = xTable.value?.getCheckboxRecords().map((o) => o.id)
    userResetPwd.value.init(true, userIds)
  }
</script>

<style scoped></style>
