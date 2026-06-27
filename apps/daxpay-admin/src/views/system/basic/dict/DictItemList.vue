<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { Dict } from '#/api/system/dict/dict.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t, i18n } from '@vben/locales';

  import { DictApi } from '#/api/system/dict/dict.api';
  import { DictItemApi } from '#/api/system/dict/dict-item.api';
  import { FormEditType } from '#/enums/formEditType';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import DictItemEdit from './DictItemEdit.vue';

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const visible = ref(false);
  const loading = ref(false);
  const currentDict = ref<Dict | null>(null);

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const dictItemEdit = ref();

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 表格数据
  const tableData = ref<any[]>([]);

  // 根据当前语言显示字典名称
  const displayDictName = computed(() => {
    const locale = i18n.global.locale.value;
    if (locale === 'en-US') {
      return currentDict.value?.nameEn || currentDict.value?.name;
    }
    return currentDict.value?.nameCn || currentDict.value?.name;
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
  function queryPage() {
    if (!currentDict.value?.id) return Promise.resolve();
    loading.value = true;
    DictItemApi.pageByDictionaryId(currentDict.value.id, {
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
    })
      .then((res: any) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = res.data.total || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
    return Promise.resolve();
  }

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

  /**
   * 分页变化
   */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
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
    :size="1200"
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
    <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
      <!-- 序号 -->
      <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
      <!-- 字典项编码 -->
      <vxe-column field="code" :title="$t('system.dict.item.code')" :min-width="150" />
      <!-- 中文名称 -->
      <vxe-column field="nameCn" :title="$t('common.chineseName')" :min-width="150" />
      <!-- 英文名称 -->
      <vxe-column field="nameEn" :title="$t('common.englishName')" :min-width="150" />
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
      <vxe-column field="createTime" :title="$t('system.dict.createTime')" :min-width="160" formatter="formatDateTime" />
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
      :current-page="pageConfig.currentPage"
      :page-size="pageConfig.pageSize"
      :total="Number(pageConfig.total)"
      @page-change="handlePageChange"
    />

    <DictItemEdit ref="dictItemEdit" @ok="queryPage" />
  </a-drawer>
</template>
