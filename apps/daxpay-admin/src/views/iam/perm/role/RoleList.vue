<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type Role, RoleApi } from '#/api/iam/perm/role.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { clientCodeColorMap, clientCodeI18nMap } from '#/enums/clientCode';
  import { FormEditType } from '#/enums/formEditType';
  import { useClientOptions } from '#/hooks/useClientOptions';
  import { useDeleteConfirm } from '#/hooks/useDeleteConfirm';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import RoleEdit from './RoleEdit.vue';
  import RolePermAssign from './RolePermAssign.vue';

  const { message } = useMessage();
  const { openDeleteConfirm } = useDeleteConfirm();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const roleEdit = ref();
  const rolePermAssign = ref();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 终端类型选项(主数据, 排除网关端)
  const { options: clientCodeSelectOptions } = useClientOptions(true);

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'code',
      name: $t('iam.role.code'),
      placeholder: $t('iam.role.inputCode'),
    },
    {
      type: 'list',
      field: 'clientCode',
      name: $t('common.clientType'),
      placeholder: $t('iam.role.selectClientCode'),
      selectList: clientCodeSelectOptions.value,
    },
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 表格数据
  const tableData = ref<Role[]>([]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 查询分页数据
   */
  function queryPage() {
    loading.value = true;
    RoleApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res: any) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = Number(res.data.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
    return Promise.resolve();
  }

  /**
   * 重置查询
   */
  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /**
   * 新增
   */
  function handleAdd() {
    roleEdit.value.init(undefined, FormEditType.Add);
  }

  /**
   * 编辑
   */
  function handleEdit(row: Role) {
    roleEdit.value.init(row.id!, FormEditType.Edit);
  }

  /**
   * 查看
   */
  function handleView(row: Role) {
    roleEdit.value.init(row.id!, FormEditType.Show);
  }

  /**
   * 分配权限
   */
  function handleAssignPermission(row: Role) {
    rolePermAssign.value.init(row.id);
  }

  /**
   * 角色显示名：优先 i18n 词条，缺词条回退 code
   */
  function getRoleDisplayName(row: Role): string {
    if (!row.i18nKey) {
      return row.code || '';
    }
    const text = $t(row.i18nKey);
    if (!text || text === row.i18nKey) {
      return row.code || row.i18nKey;
    }
    return text;
  }

  /**
   * 删除
   */
  function handleDelete(row: Role) {
    openDeleteConfirm({
      name: getRoleDisplayName(row),
      verificationText: `iam/role/${row.code}`,
      title: $t('iam.role.delete'),
      onConfirm: () =>
        RoleApi.delete(row.id!).then(() => {
          message.success($t('common.deleteSuccess'));
          queryPage();
        }),
    });
  }

  /**
   * 是否展示「更多」菜单（需管理权限）
   */
  function hasMoreActions(): boolean {
    return hasPermission(PermCodes.Iam.Role.MANAGE);
  }

  /**
   * 更多操作：编辑、删除（低频/危险收纳，避免多语言下操作列溢出）
   */
  function getActionMenu(row: Role): MenuProps {
    const items: NonNullable<MenuProps['items']> = [
      {
        key: 'edit',
        label: $t('common.edit'),
        disabled: !!row.internal,
      },
    ];
    if (!row.internal) {
      items.push({ type: 'divider' });
      items.push({
        key: 'delete',
        label: $t('common.delete'),
        danger: true,
      });
    }
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        if (key === 'edit' && !row.internal) {
          handleEdit(row);
        }
        if (key === 'delete' && !row.internal) {
          handleDelete(row);
        }
      },
    };
  }

  /**
   * 分页变化
   */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery
        :fields="queryFields"
        :query-params="queryForm"
        :default-item-count="3"
        @query="queryPage"
        @reset="resetQuery"
      />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <!-- 新增 -->
              <a-button v-if="hasPermission(PermCodes.Iam.Role.MANAGE)" type="primary" @click="handleAdd">{{
                $t('common.add')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 角色编码 -->
          <vxe-column field="code" :title="$t('iam.role.code')" :min-width="150" />
          <!-- 角色名称 -->
          <vxe-column field="i18nKey" :title="$t('iam.role.name')" :min-width="150">
            <template #default="{ row }">
              {{ getRoleDisplayName(row) }}
            </template>
          </vxe-column>
          <!-- 终端类型 -->
          <vxe-column field="clientCode" :title="$t('common.clientType')" :min-width="120" align="center">
            <template #default="{ row }">
              <a-tag :color="clientCodeColorMap[row.clientCode] || 'default'">
                {{ $t(clientCodeI18nMap[row.clientCode] || row.clientCode) }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 内置 -->
          <vxe-column field="internal" :title="$t('iam.role.internal')" :min-width="100" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.internal" color="red">{{ $t('common.yes') }}</a-tag>
              <a-tag v-else color="green">{{ $t('common.no') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 备注 -->
          <vxe-column field="remark" :title="$t('iam.role.remark')" :min-width="150" />
          <!-- 创建时间 -->
          <vxe-column field="createTime" :title="$t('common.createTime')" :min-width="160" formatter="formatDateTime" />
          <!-- 操作：主列查看/分配权限 + 更多（编辑/删除），避免多语言文案溢出 -->
          <vxe-column fixed="right" width="220" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <!-- 查看 -->
                <a-button
                  v-if="hasPermission(PermCodes.Iam.Role.VIEW)"
                  type="link"
                  size="small"
                  @click="handleView(row)"
                >
                  {{ $t('common.view') }}
                </a-button>
                <!-- 分配权限（高频操作保留主列） -->
                <a-button
                  v-if="hasPermission(PermCodes.Iam.Role.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleAssignPermission(row)"
                >
                  {{ $t('iam.role.assignPermission') }}
                </a-button>
                <!-- 更多：编辑 / 删除 -->
                <a-dropdown v-if="hasMoreActions()" :menu="getActionMenu(row)">
                  <a-button type="link" size="small">
                    {{ $t('common.more') }}
                    <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                  </a-button>
                </a-dropdown>
              </a-space>
            </template>
          </vxe-column>
        </vxe-table>
        <vxe-pager
          size="medium"
          :loading="loading"
          :current-page="pageConfig.currentPage"
          :page-size="pageConfig.pageSize"
          :total="pageConfig.total"
          @page-change="handlePageChange"
        />
      </a-card>
    </div>

    <RoleEdit ref="roleEdit" @ok="queryPage" />
    <RolePermAssign ref="rolePermAssign" @ok="queryPage" />
  </div>
</template>
