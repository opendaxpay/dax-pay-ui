<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { UserProtocolVersionApi } from '#/api/system/protocol/user-protocol-version.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useMessage } from '#/hooks/useMessage';

  import UserProtocolVersionEdit from './UserProtocolVersionEdit.vue';

  const { confirm, message } = useMessage();

  const visible = ref(false);
  const protocolId = ref<string>('');
  const protocolName = ref<string>('');
  const loading = ref(false);

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const versionEdit = ref();

  // 查询条件
  const queryForm = ref<Record<string, any>>({});
  // 分页
  const pageConfig = ref({ currentPage: 1, pageSize: 10, total: 0 });
  const tableData = ref<any[]>([]);

  // 语言选项（与 SUPPORT_LANGUAGES 对齐）
  const languageOptions = [
    { label: $t('system.protocol.languageZh'), value: 'zh-CN' },
    { label: $t('system.protocol.languageEn'), value: 'en-US' },
    { label: $t('system.protocol.languageTw'), value: 'zh-TW' },
    { label: $t('system.protocol.languageHk'), value: 'zh-HK' },
    { label: $t('system.protocol.languageJa'), value: 'ja-JP' },
    { label: $t('system.protocol.languageKo'), value: 'ko-KR' },
  ];

  /** 打开版本管理 */
  function open(id: string, name: string) {
    protocolId.value = id;
    protocolName.value = name;
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    visible.value = true;
    queryPage();
    // 等待弹窗渲染完成后连接工具栏
    setTimeout(() => {
      xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    }, 120);
  }

  /** 查询分页 */
  function queryPage() {
    loading.value = true;
    UserProtocolVersionApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      protocolId: protocolId.value,
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
  }

  /** 重置查询 */
  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  /** 新建草稿 */
  function handleAdd() {
    versionEdit.value.init(protocolId.value, undefined, FormEditType.Add);
  }

  /** 编辑草稿 */
  function handleEdit(row: any) {
    versionEdit.value.init(protocolId.value, row.id, FormEditType.Edit);
  }

  /** 查看版本 */
  function handleView(row: any) {
    versionEdit.value.init(protocolId.value, row.id, FormEditType.Show);
  }

  /** 发布版本 */
  function handlePublish(row: any) {
    confirm({
      title: $t('system.protocol.version.publish'),
      content: $t('system.protocol.version.confirmPublish'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: () => {
        UserProtocolVersionApi.publish(row.id).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /** 归档版本 */
  function handleArchive(row: any) {
    confirm({
      title: $t('system.protocol.version.archive'),
      content: $t('system.protocol.version.confirmArchive'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: () => {
        UserProtocolVersionApi.archive(row.id).then(() => {
          message.success($t('common.operationSuccess'));
          queryPage();
        });
      },
    });
  }

  /** 删除草稿 */
  function handleDelete(row: any) {
    confirm({
      title: $t('common.delete'),
      content: $t('system.protocol.version.confirmDelete'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: () => {
        UserProtocolVersionApi.delete(row.id).then(() => {
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

  /** 状态标签颜色 */
  function statusColor(status?: string) {
    if (status === 'PUBLISHED') return 'green';
    if (status === 'DRAFT') return 'orange';
    return 'default';
  }

  /** 状态名称 */
  function statusName(status?: string) {
    if (status === 'PUBLISHED') return $t('system.protocol.version.statusPublished');
    if (status === 'DRAFT') return $t('system.protocol.version.statusDraft');
    return $t('system.protocol.version.statusArchived');
  }

  defineExpose({ open });

  /** 关闭抽屉 */
  function handleClose() {
    visible.value = false;
  }
</script>

<template>
  <!-- 协议版本管理大抽屉 -->
  <a-drawer
    :open="visible"
    :title="$t('system.protocol.version.title') + (protocolName ? ` - ${protocolName}` : '')"
    :size="1200"
    @close="handleClose"
  >
    <a-form layout="inline" class="!mb-4">
      <a-form-item :label="$t('system.protocol.version.language')">
        <a-select
          v-model:value="queryForm.language"
          allow-clear
          style="width: 140px"
          :options="languageOptions"
          :placeholder="$t('common.pleaseSelect')"
        />
      </a-form-item>
      <a-form-item :label="$t('system.protocol.version.status')">
        <a-select
          v-model:value="queryForm.status"
          allow-clear
          style="width: 140px"
          :placeholder="$t('common.pleaseSelect')"
          :options="[
            { label: $t('system.protocol.version.statusDraft'), value: 'DRAFT' },
            { label: $t('system.protocol.version.statusPublished'), value: 'PUBLISHED' },
            { label: $t('system.protocol.version.statusArchived'), value: 'ARCHIVED' },
          ]"
        />
      </a-form-item>
      <a-form-item>
        <a-space>
          <a-button type="primary" @click="queryPage">{{ $t('common.query') }}</a-button>
          <a-button @click="resetQuery">{{ $t('common.reset') }}</a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
      <template #buttons>
        <!-- 新建草稿 -->
        <a-button type="primary" @click="handleAdd">{{ $t('system.protocol.version.addDraft') }}</a-button>
      </template>
    </vxe-toolbar>
    <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
      <!-- 序号 -->
      <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
      <!-- 版本号 -->
      <vxe-column field="versionNo" :title="$t('system.protocol.version.versionNo')" :min-width="90" align="center" />
      <!-- 版本标签 -->
      <vxe-column field="versionLabel" :title="$t('system.protocol.version.versionLabel')" :min-width="110" />
      <!-- 标题 -->
      <vxe-column field="title" :title="$t('system.protocol.version.titleField')" :min-width="160" />
      <!-- 语言 -->
      <vxe-column field="language" :title="$t('system.protocol.version.language')" :min-width="100" />
      <!-- 状态 -->
      <vxe-column field="status" :title="$t('system.protocol.version.status')" :min-width="100" align="center">
        <template #default="{ row }">
          <a-tag :color="statusColor(row.status)">{{ statusName(row.status) }}</a-tag>
        </template>
      </vxe-column>
      <!-- 生效时间 -->
      <vxe-column
        field="effectiveTime"
        :title="$t('system.protocol.version.effectiveTime')"
        :min-width="160"
        formatter="formatDateTime"
      />
      <!-- 变更说明 -->
      <vxe-column field="summary" :title="$t('system.protocol.version.summary')" :min-width="160" />
      <!-- 操作 -->
      <vxe-column fixed="right" width="240" :show-overflow="false" :title="$t('common.operation')">
        <template #default="{ row }">
          <a-space :size="2">
            <template #separator>
              <a-divider type="vertical" />
            </template>
            <!-- 编辑(仅草稿) -->
            <a-button v-if="row.status === 'DRAFT'" type="link" size="small" @click="handleEdit(row)">{{
              $t('common.edit')
            }}</a-button>
            <!-- 查看(非草稿) -->
            <a-button v-if="row.status !== 'DRAFT'" type="link" size="small" @click="handleView(row)">{{
              $t('common.view')
            }}</a-button>
            <!-- 发布(仅草稿) -->
            <a-button v-if="row.status === 'DRAFT'" type="link" size="small" @click="handlePublish(row)">{{
              $t('system.protocol.version.publish')
            }}</a-button>
            <!-- 归档(仅已发布) -->
            <a-button v-if="row.status === 'PUBLISHED'" type="link" size="small" @click="handleArchive(row)">{{
              $t('system.protocol.version.archive')
            }}</a-button>
            <!-- 删除(仅草稿) -->
            <a-button v-if="row.status === 'DRAFT'" type="link" size="small" danger @click="handleDelete(row)">{{
              $t('common.delete')
            }}</a-button>
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

    <UserProtocolVersionEdit ref="versionEdit" @ok="queryPage" />
  </a-drawer>
</template>
