<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { DictItem } from '#/api/system/dict/dict-item.api';
  import type { Dict } from '#/api/system/dict/dict.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DictItemApi } from '#/api/system/dict/dict-item.api';
  import { DictApi } from '#/api/system/dict/dict.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { FormEditType } from '#/enums/formEditType';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import useTablePage from '#/hooks/useTablePage';

  import DictItemEdit from './DictItemEdit.vue';

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const visible = ref(false);
  const currentDict = ref<Dict | null>(null);

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const dictItemEdit = ref();

  // 显示字典名称（优先 i18nKey 翻译，fallback name）
  const displayDictName = computed(() => {
    if (currentDict.value?.i18nKey) {
      return $t(currentDict.value.i18nKey);
    }
    return currentDict.value?.name || '';
  });

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
  });

  /**
   * 打开抽屉
   */
  async function open(dictId: number) {
    visible.value = true;
    const res = await DictApi.findById(String(dictId));
    currentDict.value = res.data;
    queryPage();
  }

  /**
   * 查询分页数据
   */
  async function queryPage() {
    if (!currentDict.value?.id) return;
    const { data } = await DictItemApi.pageByDictionaryId(currentDict.value.id, {
      current: pages.current,
      size: pages.size,
    });
    pageQueryResHandle(data);
  }

  const { loading, pages, pagination, pageQueryResHandle, handleTableChange } = useTablePage<DictItem>(queryPage);
  // 保持原有每页 10 条
  pages.size = 10;

  /**
   * 新增
   */
  function handleAdd() {
    dictItemEdit.value.init(undefined, FormEditType.Add, currentDict.value!);
  }

  /**
   * 编辑
   */
  function handleEdit(row: any) {
    dictItemEdit.value.init(row.id, FormEditType.Edit, currentDict.value!);
  }

  /**
   * 删除
   */
  function handleDelete(row: any) {
    confirm({
      // 删除确认
      title: $t('system.dict.item.delete'),
      // 确认删除内容
      content: $t('system.dict.confirmDelete'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: () => {
        DictItemApi.delete(row.id).then(() => {
          // 删除成功
          message.success($t('common.deleteSuccess'));
          queryPage();
        });
      },
    });
  }

  function handleClose() {
    visible.value = false;
  }

  defineExpose({ open });
</script>

<template>
  <!-- 字典项抽屉 -->
  <a-drawer
    :open="visible"
    :title="`${$t('system.dict.item.title')} - ${displayDictName}`"
    :default-size="1200"
    @close="handleClose"
  >
    <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
      <template #buttons>
        <a-space>
          <!-- 新增 -->
          <a-button v-if="hasPermission(PermCodes.System.Dict.MANAGE)" type="primary" @click="handleAdd">{{
            $t('common.add')
          }}</a-button>
        </a-space>
      </template>
    </vxe-toolbar>

    <!-- 数据表格 -->
    <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="pagination.records" :loading="loading">
      <!-- 序号 -->
      <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
      <!-- 字典项编码 -->
      <vxe-column field="code" :title="$t('system.dict.item.code')" :min-width="150" />
      <!-- 名称 -->
      <vxe-column field="i18nKey" :title="$t('system.dict.item.name')" :min-width="150">
        <template #default="{ row }">
          {{ row.i18nKey ? $t(row.i18nKey) : '' }}
        </template>
      </vxe-column>
      <!-- 启用状态 -->
      <vxe-column field="enable" :title="$t('system.dict.enable')" :min-width="100" align="center">
        <template #default="{ row }">
          <!-- 启用 -->
          <a-tag v-if="row.enable" color="green">{{ $t('system.dict.enabled') }}</a-tag>
          <!-- 停用 -->
          <a-tag v-else color="red">{{ $t('system.dict.disabled') }}</a-tag>
        </template>
      </vxe-column>
      <!-- 排序 -->
      <vxe-column field="sortNo" :title="$t('system.dict.item.sortNo')" :min-width="80" />
      <!-- 备注 -->
      <vxe-column field="remark" :title="$t('system.dict.remark')" :min-width="150" />
      <!-- 创建时间 -->
      <vxe-column
        field="createTime"
        :title="$t('system.dict.createTime')"
        :min-width="160"
        formatter="formatDateTime"
      />
      <!-- 操作 -->
      <vxe-column fixed="right" width="150" :show-overflow="false" :title="$t('common.operation')">
        <template #default="{ row }">
          <a-space :size="2">
            <template #separator>
              <a-divider type="vertical" />
            </template>
            <!-- 编辑 -->
            <a-button
              v-if="hasPermission(PermCodes.System.Dict.MANAGE)"
              type="link"
              size="small"
              @click="handleEdit(row)"
              >{{ $t('common.edit') }}</a-button
            >
            <!-- 删除 -->
            <a-button
              v-if="hasPermission(PermCodes.System.Dict.MANAGE)"
              type="link"
              size="small"
              danger
              @click="handleDelete(row)"
              >{{ $t('common.delete') }}</a-button
            >
          </a-space>
        </template>
      </vxe-column>
    </vxe-table>

    <vxe-pager
      size="medium"
      :loading="loading"
      :current-page="pages.current"
      :page-size="pages.size"
      :total="pagination.total"
      @page-change="handleTableChange"
    />

    <DictItemEdit ref="dictItemEdit" @ok="queryPage" />
  </a-drawer>
</template>
