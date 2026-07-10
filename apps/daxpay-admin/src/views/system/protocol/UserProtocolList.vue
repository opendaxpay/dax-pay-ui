<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { UserProtocolApi } from '#/api/system/protocol/user-protocol.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { FormEditType } from '#/enums/formEditType';
  import { useMessage } from '#/hooks/useMessage';

  import UserProtocolEdit from './UserProtocolEdit.vue';
  import UserProtocolVersionList from './UserProtocolVersionList.vue';

  const { confirm, message } = useMessage();

  const loading = ref(false);

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const protocolEdit = ref();
  const versionList = ref();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});

  // 协议类型/端类型选项
  const typeOptions = ref<any[]>([]);
  const clientTypeOptions = ref<any[]>([]);

  // 类型编码到名称的映射
  const typeMap = computed<Record<string, string>>(() =>
    Object.fromEntries(typeOptions.value.map((i) => [i.value, i.label])),
  );
  const clientTypeMap = computed<Record<string, string>>(() =>
    Object.fromEntries(clientTypeOptions.value.map((i) => [i.value, i.label])),
  );

  // 查询字段配置
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'name',
      name: $t('system.protocol.name'),
      placeholder: $t('system.protocol.inputName'),
    },
    {
      type: 'string',
      field: 'type',
      name: $t('system.protocol.type'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'clientType',
      name: $t('system.protocol.clientType'),
      placeholder: $t('common.pleaseInput'),
    },
  ]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 表格数据
  const tableData = ref<any[]>([]);

  // 复制到其他端弹窗
  const copyVisible = ref(false);
  const copyFormRef = ref();
  const copySourceId = ref<string>('');
  const copySourceClientType = ref<string>('');
  const copyForm = ref<{ clientType?: string }>({ clientType: undefined });
  const copyRules = {
    clientType: [{ required: true, message: $t('system.protocol.selectClientType') }],
  };

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    loadOptions();
    queryPage();
  });

  /** 加载枚举选项 */
  function loadOptions() {
    UserProtocolApi.typeOptions().then((res: any) => {
      typeOptions.value = res.data || [];
    });
    UserProtocolApi.clientTypeOptions().then((res: any) => {
      clientTypeOptions.value = res.data || [];
    });
  }

  /** 查询分页数据 */
  function queryPage() {
    loading.value = true;
    UserProtocolApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res: any) => {
        tableData.value = res.data?.records || [];
        pageConfig.value.total = Number(res.data?.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
    return Promise.resolve();
  }

  /** 重置查询 */
  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /** 新增 */
  function handleAdd() {
    protocolEdit.value.init(undefined, FormEditType.Add);
  }

  /** 编辑 */
  function handleEdit(row: any) {
    protocolEdit.value.init(row.id, FormEditType.Edit);
  }

  /** 版本管理 */
  function handleVersion(row: any) {
    versionList.value.open(row.id, row.name);
  }

  /**
   * 更多操作菜单(设为/取消默认、复制到其他端、删除)
   */
  function getActionMenu(row: any): MenuProps {
    const items: { danger?: boolean; key: string; label: any }[] = [
      // 设为/取消默认(互斥)
      row.defaultProtocol
        ? { key: 'cancelDefault', label: $t('system.protocol.cancelDefault') }
        : { key: 'setDefault', label: $t('system.protocol.setDefault') },
      // 复制到其他端
      { key: 'copy', label: $t('system.protocol.copyToClient') },
      // 删除
      { key: 'delete', label: $t('common.delete'), danger: true },
    ];
    return {
      items,
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'cancelDefault': {
            handleCancelDefault(row);
            break;
          }
          case 'copy': {
            handleCopy(row);
            break;
          }
          case 'delete': {
            {
              handleDelete(row);
              // No default
            }
            break;
          }
          case 'setDefault': {
            handleSetDefault(row);
            break;
          }
        }
      },
    };
  }

  /** 设为默认 */
  function handleSetDefault(row: any) {
    confirm({
      title: $t('system.protocol.setDefault'),
      content: $t('system.protocol.setDefault') + '?',
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: () => {
        UserProtocolApi.setDefault(row.id).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /** 取消默认 */
  function handleCancelDefault(row: any) {
    confirm({
      title: $t('system.protocol.cancelDefault'),
      content: $t('system.protocol.confirmCancelDefault'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: () => {
        UserProtocolApi.cancelDefault(row.id).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /** 打开复制弹窗 */
  function handleCopy(row: any) {
    copySourceId.value = row.id;
    copySourceClientType.value = row.clientType;
    copyForm.value = { clientType: undefined };
    copyVisible.value = true;
  }

  /** 确认复制 */
  async function confirmCopy() {
    try {
      await copyFormRef.value?.validate();
    } catch {
      // 校验失败: 表单已显示错误提示; 拒绝以阻止 modal 关闭
      return Promise.reject();
    }
    return UserProtocolApi.copyToClient(copySourceId.value, copyForm.value.clientType!).then(() => {
      message.success($t('common.operationSuccess'));
      copyVisible.value = false;
      queryPage();
    });
  }

  /** 删除 */
  function handleDelete(row: any) {
    confirm({
      title: $t('system.protocol.delete'),
      content: $t('system.protocol.confirmDelete'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: () => {
        UserProtocolApi.delete(row.id).then(() => {
          message.success($t('common.deleteSuccess'));
          queryPage();
        });
      },
    });
  }

  /** 分页变化 */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }
</script>

<template>
  <div class="bg-background m-3 list-page-compact rounded-lg p-3">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-space>
              <!-- 新增 -->
              <a-button type="primary" @click="handleAdd">{{ $t('common.add') }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <!-- 数据表格 -->
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 序号 -->
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 名称 -->
          <vxe-column field="name" :title="$t('system.protocol.name')" :min-width="150" />
          <!-- 显示名称 -->
          <vxe-column field="showName" :title="$t('system.protocol.showName')" :min-width="150" />
          <!-- 协议类型 -->
          <vxe-column field="type" :title="$t('system.protocol.type')" :min-width="120">
            <template #default="{ row }">
              <span>{{ typeMap[row.type] || row.type }}</span>
            </template>
          </vxe-column>
          <!-- 端类型 -->
          <vxe-column field="clientType" :title="$t('system.protocol.clientType')" :min-width="100">
            <template #default="{ row }">
              <span>{{ clientTypeMap[row.clientType] || row.clientType }}</span>
            </template>
          </vxe-column>
          <!-- 默认语言 -->
          <vxe-column field="defaultLanguage" :title="$t('system.protocol.defaultLanguage')" :min-width="100" />
          <!-- 默认协议 -->
          <vxe-column
            field="defaultProtocol"
            :title="$t('system.protocol.defaultProtocol')"
            :min-width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.defaultProtocol" color="green">{{ $t('common.yes') }}</a-tag>
              <a-tag v-else>{{ $t('common.no') }}</a-tag>
            </template>
          </vxe-column>
          <!-- 创建时间 -->
          <vxe-column field="createTime" :title="$t('common.createTime')" :min-width="160" formatter="formatDateTime" />
          <!-- 操作 -->
          <vxe-column fixed="right" width="200" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <!-- 编辑 -->
                <a-button type="link" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</a-button>
                <!-- 版本管理 -->
                <a-button type="link" size="small" @click="handleVersion(row)">{{
                  $t('system.protocol.versionManage')
                }}</a-button>
                <!-- 更多(设为/取消默认、复制到其他端、删除) -->
                <a-dropdown :menu="getActionMenu(row)">
                  <a href="javascript:">
                    {{ $t('common.more') }}
                    <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                  </a>
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
          :total="Number(pageConfig.total)"
          @page-change="handlePageChange"
        />
      </a-card>
    </div>

    <UserProtocolEdit ref="protocolEdit" @ok="queryPage" />
    <UserProtocolVersionList ref="versionList" />

    <!-- 复制到其他端弹窗 -->
    <a-modal
      v-model:open="copyVisible"
      :title="$t('system.protocol.copyToClientTitle')"
      :ok-text="$t('common.okText')"
      :cancel-text="$t('common.cancelText')"
      @ok="confirmCopy"
    >
      <a-form
        ref="copyFormRef"
        :model="copyForm"
        :rules="copyRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item :label="$t('system.protocol.clientType')" name="clientType">
          <a-select
            v-model:value="copyForm.clientType"
            :options="clientTypeOptions.filter((i) => i.value !== copySourceClientType)"
            :placeholder="$t('system.protocol.selectClientType')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
