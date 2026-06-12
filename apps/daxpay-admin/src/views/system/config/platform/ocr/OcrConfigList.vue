<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type OcrConfig, OcrConfigApi } from '#/api/system/ocr-config.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useMessage } from '#/hooks/useMessage';

  import OcrConfigEdit from './OcrConfigEdit.vue';

  const { confirm, message } = useMessage();

  // 表格引用
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const editRef = ref();

  // 加载状态
  const loading = ref(false);

  // 表格数据
  const tableData = ref<OcrConfig[]>([]);

  // 供应商选项
  const providerOptions = [
    { label: $t('system.platform.ocr.providerOptions.aliyun'), value: 'ALIYUN' },
    { label: $t('system.platform.ocr.providerOptions.tencent'), value: 'TENCENT' },
  ];

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    loadList();
  });

  /**
   * 加载列表
   */
  async function loadList() {
    loading.value = true;
    try {
      const { data } = await OcrConfigApi.list();
      tableData.value = data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 新增
   */
  function handleAdd() {
    editRef.value?.init(undefined, FormEditType.Add);
  }

  /**
   * 编辑
   */
  function handleEdit(row: OcrConfig) {
    editRef.value?.init(row.id!, FormEditType.Edit);
  }

  /**
   * 删除
   */
  function handleDelete(row: OcrConfig) {
    confirm({
      // 确认删除
      title: $t('common.confirm'),
      // 删除确认内容
      content: $t('system.platform.ocr.confirmDelete', { name: row.configName }),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        await OcrConfigApi.delete(row.id!);
        // 删除成功
        message.success($t('common.deleteSuccess'));
        await loadList();
      },
    });
  }

  /**
   * 启用
   */
  async function handleEnable(row: OcrConfig) {
    await OcrConfigApi.enable(row.id!);
    // 国际化：启用成功
    message.success($t('system.platform.ocr.enableSuccess'));
    await loadList();
  }

  /**
   * 禁用
   */
  async function handleDisable(row: OcrConfig) {
    await OcrConfigApi.disable(row.id!);
    // 国际化：禁用成功
    message.success($t('system.platform.ocr.disableSuccess'));
    await loadList();
  }

  /**
   * 获取供应商标签
   */
  function getProviderLabel(provider: string) {
    return providerOptions.find((p) => p.value === provider)?.label || provider;
  }
</script>

<template>
  <div class="config-list-page">
    <div class="module-overview">
      <!-- OCR配置标题 -->
      <div class="module-overview__title">{{ $t('system.platform.ocr.title') }}</div>
      <!-- OCR配置描述 -->
      <div class="module-overview__desc">{{ $t('system.platform.ocr.description') }}</div>
    </div>
    <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: loadList }">
      <template #buttons>
        <a-button type="primary" @click="handleAdd">{{ $t('common.add') }}</a-button>
      </template>
    </vxe-toolbar>
    <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
      <!-- 配置名称 -->
      <vxe-column field="configName" :title="$t('system.platform.ocr.configName')" min-width="150" />
      <!-- 供应商 -->
      <vxe-column field="provider" :title="$t('system.platform.ocr.provider')" min-width="120" align="center">
        <template #default="{ row }">
          <a-tag>{{ getProviderLabel(row.provider) }}</a-tag>
        </template>
      </vxe-column>
      <!-- 访问端点 -->
      <vxe-column field="endpoint" :title="$t('system.platform.ocr.endpoint')" min-width="200" />
      <!-- 状态 -->
      <vxe-column field="enable" :title="$t('system.platform.ocr.status')" min-width="100" align="center">
        <template #default="{ row }">
          <a-tag v-if="row.enable" color="success">{{ $t('common.enabled') }}</a-tag>
          <a-tag v-else>{{ $t('common.disabled') }}</a-tag>
        </template>
      </vxe-column>
      <!-- 操作 -->
      <vxe-column fixed="right" width="180" :show-overflow="false" :title="$t('common.action')">
        <template #default="{ row }">
          <a-space :size="2">
            <template #separator>
              <a-divider type="vertical" />
            </template>
            <a-button v-if="!row.enable" type="link" size="small" @click="handleEnable(row)">{{
              $t('common.enable')
            }}</a-button>
            <a-button v-else type="link" size="small" @click="handleDisable(row)">{{ $t('common.disable') }}</a-button>
            <a-button type="link" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</a-button>
            <a-button type="link" size="small" danger @click="handleDelete(row)">{{ $t('common.delete') }}</a-button>
          </a-space>
        </template>
      </vxe-column>
    </vxe-table>

    <OcrConfigEdit ref="editRef" @ok="loadList" />
  </div>
</template>

<style scoped>
  .config-list-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 4px;
  }

  .module-overview {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .module-overview__title {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .module-overview__desc {
    font-size: 13px;
    line-height: 1.7;
    color: hsl(var(--muted-foreground));
  }
</style>
