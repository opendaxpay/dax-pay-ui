<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import type { Menu } from '#/api/iam/perm/menu.api';

  import { computed, nextTick, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { PermCodes } from '#/constants/perm-codes';
  import { menuTypeColorMap, MenuTypeEnum, menuTypeI18nMap } from '#/enums/menuType';
  import { usePermission } from '#/hooks/usePermission';

  import {
    getDirectMenuChildren,
    getDirectMenusUnderCatalog,
    getDirectSubpages,
    matchesMenuKeyword,
  } from './menu-tree.util';

  const props = defineProps<{
    clientCode: string;
    // 主搜索联动传入的关键字
    externalKeyword?: string;
    // 主搜索命中子页面时高亮对应行
    highlightRowId?: string;
    menuMap: Map<string, Menu>;
    selectedNode?: Menu | null;
  }>();

  const emits = defineEmits<{
    addGroup: [parent: Menu];
    addSubpage: [parent: Menu];
    delete: [row: Menu];
    edit: [row: Menu];
    managePermCode: [row: Menu];
    view: [row: Menu];
  }>();

  const { hasPermission } = usePermission();

  const keyword = ref('');
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 面板模式：catalog 下直属菜单 / menu 下分组+子页面 / 分组下子页面
  const panelMode = computed<'catalogMenus' | 'groupSubpages' | 'menuChildren' | 'none'>(() => {
    if (!props.selectedNode?.menuType) {
      return 'none';
    }
    if (props.selectedNode.menuType === MenuTypeEnum.MENU) {
      return 'menuChildren';
    }
    if (props.selectedNode.menuType === MenuTypeEnum.SUBPAGE_GROUP) {
      return 'groupSubpages';
    }
    if (props.selectedNode.menuType === MenuTypeEnum.CATALOG) {
      return 'catalogMenus';
    }
    return 'none';
  });

  const panelTitle = computed(() => {
    if (!props.selectedNode) {
      return '';
    }
    const name = getDisplayTitle(props.selectedNode);
    if (panelMode.value === 'menuChildren') {
      return `${$t('iam.menu.subpageManage')} - ${name}`;
    }
    if (panelMode.value === 'groupSubpages') {
      return `${$t('iam.menu.subpageList')} - ${name}`;
    }
    if (panelMode.value === 'catalogMenus') {
      return `${$t('iam.menu.childMenuList')} - ${name}`;
    }
    return name;
  });

  const rawRows = computed(() => {
    if (!props.selectedNode || panelMode.value === 'none') {
      return [] as Menu[];
    }
    if (panelMode.value === 'menuChildren') {
      return getDirectMenuChildren(props.selectedNode, props.menuMap);
    }
    if (panelMode.value === 'groupSubpages') {
      return getDirectSubpages(props.selectedNode, props.menuMap);
    }
    return getDirectMenusUnderCatalog(props.selectedNode, props.menuMap);
  });

  const filteredRows = computed(() => {
    const kw = keyword.value.trim();
    if (!kw) {
      return rawRows.value;
    }
    return rawRows.value.filter((row) => matchesMenuKeyword(row, kw));
  });

  const tableData = computed(() => {
    const start = (pageConfig.value.currentPage - 1) * pageConfig.value.pageSize;
    return filteredRows.value.slice(start, start + pageConfig.value.pageSize);
  });

  watch(
    () => [props.selectedNode?.id, props.clientCode, panelMode.value, keyword.value],
    () => {
      pageConfig.value.currentPage = 1;
      pageConfig.value.total = filteredRows.value.length;
    },
    { immediate: true },
  );

  watch(filteredRows, (rows) => {
    pageConfig.value.total = rows.length;
  });

  watch(
    () => props.externalKeyword,
    (val) => {
      keyword.value = val ?? '';
    },
    { immediate: true },
  );

  watch(
    () => props.selectedNode?.id,
    (id) => {
      if (!id) {
        pageConfig.value.currentPage = 1;
        pageConfig.value.total = 0;
      }
    },
  );

  /**
   * 主搜索命中子页面时，高亮并滚动到对应行
   */
  function highlightRow() {
    const rowId = props.highlightRowId;
    if (!rowId) {
      return;
    }
    const row = tableData.value.find((item) => item.id === rowId);
    if (!row) {
      return;
    }
    xTable.value?.setCurrentRow(row);
    xTable.value?.scrollToRow(row);
  }

  /**
   * 定位到高亮行所在分页后再高亮
   */
  function navigateToHighlightRow() {
    const rowId = props.highlightRowId;
    if (!rowId) {
      return;
    }
    const idx = filteredRows.value.findIndex((item) => item.id === rowId);
    if (idx === -1) {
      return;
    }
    const targetPage = Math.floor(idx / pageConfig.value.pageSize) + 1;
    if (pageConfig.value.currentPage !== targetPage) {
      pageConfig.value.currentPage = targetPage;
      nextTick(() => {
        highlightRow();
      });
      return;
    }
    highlightRow();
  }

  watch(
    () => [props.highlightRowId, tableData.value] as const,
    () => {
      nextTick(() => {
        navigateToHighlightRow();
      });
    },
    { flush: 'post' },
  );

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
  });

  /**
   * 获取显示标题
   */
  function getDisplayTitle(row: Menu): string {
    return row.i18nKey ? $t(row.i18nKey) : '';
  }

  /**
   * 分页变化
   */
  function handlePageChange({ currentPage, pageSize }: { currentPage: number; pageSize: number }) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
  }

  /**
   * 判断是否可以管理权限码
   */
  function canManagePermCode(row: Menu) {
    return ([MenuTypeEnum.MENU, MenuTypeEnum.SUBPAGE] as string[]).includes(row.menuType || '') && !!row.menuCode;
  }
</script>

<template>
  <div class="h-full min-h-0 flex flex-col">
    <template v-if="panelMode === 'none'">
      <a-empty class="!mt-16" :description="$t('iam.menu.selectNodeHint')" />
    </template>
    <template v-else>
      <div class="mb-3 shrink-0 font-medium">{{ panelTitle }}</div>
      <vxe-toolbar ref="xToolbar" class="shrink-0">
        <template #buttons>
          <a-space>
            <a-input-search
              v-model:value="keyword"
              :placeholder="$t('iam.menu.search')"
              allow-clear
              style="width: 280px"
            />
            <a-button
              v-if="panelMode === 'menuChildren' && hasPermission(PermCodes.Iam.Menu.MANAGE)"
              type="primary"
              @click="emits('addGroup', selectedNode!)"
            >
              {{ $t('iam.menu.addSubpageGroup') }}
            </a-button>
            <a-button
              v-if="
                (panelMode === 'menuChildren' || panelMode === 'groupSubpages') &&
                hasPermission(PermCodes.Iam.Menu.MANAGE)
              "
              type="primary"
              @click="emits('addSubpage', selectedNode!)"
            >
              {{ $t('iam.menu.addSubpage') }}
            </a-button>
          </a-space>
        </template>
      </vxe-toolbar>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <vxe-table
          ref="xTable"
          :row-config="{ keyField: 'id', isCurrent: true }"
          :row-class-name="({ row }) => (row.id === highlightRowId ? 'menu-row--highlight' : '')"
          :data="tableData"
        >
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <vxe-column field="i18nKey" :title="$t('iam.menu.title')" :min-width="140">
            <template #default="{ row }">
              <a
                v-if="hasPermission(PermCodes.Iam.Menu.VIEW)"
                href="javascript:"
                class="vben-link"
                @click="emits('view', row)"
                >{{ getDisplayTitle(row) }}</a
              >
              <span v-else>{{ getDisplayTitle(row) }}</span>
            </template>
          </vxe-column>
          <vxe-column field="menuType" :title="$t('iam.menu.menuType')" :min-width="90" align="center">
            <template #default="{ row }">
              <a-tag v-if="row.menuType && menuTypeI18nMap[row.menuType]" :color="menuTypeColorMap[row.menuType]">
                {{ $t(menuTypeI18nMap[row.menuType]!) }}
              </a-tag>
            </template>
          </vxe-column>
          <vxe-column field="path" :title="$t('iam.menu.path')" :min-width="140" />
          <vxe-column field="component" :title="$t('iam.menu.component')" :min-width="140" />
          <vxe-column fixed="right" width="200" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Iam.Menu.MANAGE)"
                  type="link"
                  size="small"
                  @click="emits('edit', row)"
                >
                  {{ $t('common.edit') }}
                </a-button>
                <a-button
                  v-if="canManagePermCode(row) && hasPermission(PermCodes.Iam.Menu.MANAGE)"
                  type="link"
                  size="small"
                  @click="emits('managePermCode', row)"
                >
                  {{ $t('iam.menu.managePermCode') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Iam.Menu.MANAGE)"
                  type="link"
                  size="small"
                  danger
                  @click="emits('delete', row)"
                >
                  {{ $t('common.delete') }}
                </a-button>
              </a-space>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
      <vxe-pager
        v-model:current-page="pageConfig.currentPage"
        v-model:page-size="pageConfig.pageSize"
        class="shrink-0"
        :total="pageConfig.total"
        :layouts="['PrevPage', 'Number', 'NextPage', 'Sizes', 'Total']"
        @page-change="handlePageChange"
      />
    </template>
  </div>
</template>

<style scoped>
  :deep(.menu-row--highlight) {
    background-color: hsl(var(--primary) / 12%);
  }
</style>
