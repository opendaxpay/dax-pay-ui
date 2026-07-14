<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { Menu, MenuPermCodeItem } from '#/api/iam/perm/menu.api';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { PermCodeApi } from '#/api/iam/perm/menu.api';

  // 抽屉显示状态
  const visible = ref(false);
  // 加载状态
  const loading = ref(false);
  // 当前菜单上下文
  const menuContext = ref<Menu>({});
  // 表格数据
  const tableData = ref<MenuPermCodeItem[]>([]);

  // 表格引用
  const xTable = ref<VxeTableInstance>();
  // 工具栏引用
  const xToolbar = ref<VxeToolbarInstance>();

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
  });

  /**
   * 初始化
   */
  function init(menu: Menu) {
    menuContext.value = { ...menu };
    tableData.value = [];
    visible.value = true;
    queryPermCodes();
  }

  /**
   * 查询权限码列表
   */
  function queryPermCodes() {
    if (!menuContext.value.id) {
      tableData.value = [];
      return;
    }
    loading.value = true;
    PermCodeApi.findByMenu(menuContext.value.id)
      .then((res: any) => {
        tableData.value = res.data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 关闭抽屉
   */
  function handleClose() {
    visible.value = false;
    menuContext.value = {};
    tableData.value = [];
  }

  defineExpose({ init });
</script>

<template>
  <!-- 国际化：权限码 -->
  <a-drawer
    :open="visible"
    :title="`${$t('iam.menu.managePermCode')} - ${menuContext.i18nKey ? $t(menuContext.i18nKey) : ''}`"
    :size="900"
    @close="handleClose"
  >
    <vxe-toolbar ref="xToolbar" refresh :refresh-options="{ queryMethod: queryPermCodes }" />

    <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
      <!-- 序号 -->
      <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
      <!-- 权限码 -->
      <vxe-column field="code" :title="$t('iam.menu.permCode')" :min-width="200" />
      <!-- 名称 -->
      <vxe-column field="i18nKey" :title="$t('system.dict.item.name')" :min-width="120">
        <template #default="{ row }">
          {{ row.i18nKey ? $t(row.i18nKey) : '' }}
        </template>
      </vxe-column>
      <!-- 内置 -->
      <vxe-column field="internal" :title="$t('system.dict.internal')" :min-width="80" align="center">
        <template #default="{ row }">
          <a-tag :color="row.internal ? 'blue' : 'default'">{{
            row.internal ? $t('common.yes') : $t('common.no')
          }}</a-tag>
        </template>
      </vxe-column>
      <!-- 备注 -->
      <vxe-column field="remark" :title="$t('system.dict.remark')" :min-width="150" />
    </vxe-table>
  </a-drawer>
</template>
