<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { nextTick, onMounted, ref } from 'vue';

  import { $t, i18n } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { type Menu, MenuApi, PermCodeApi } from '#/api/iam/perm/menu.api';
  import { SplitPane } from '#/components/split-pane';
  import { clientCodeOptions } from '#/enums/clientCode';
  import { FormEditType } from '#/enums/formEditType';
  import { menuTypeColorMap, MenuTypeEnum, menuTypeI18nMap } from '#/enums/menuType';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import MenuChildrenPanel from './MenuChildrenPanel.vue';
  import MenuEdit from './MenuEdit.vue';
  import { buildSkeletonTree, filterSkeletonTreeWithSubpages, flattenMenuMap } from './menu-tree.util';
  import PermCodeManager from './PermCodeManager.vue';

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const scanLoading = ref(false);
  const skeletonTable = ref<VxeTableInstance>();
  const skeletonToolbar = ref<VxeToolbarInstance>();
  const menuEdit = ref();
  const permCodeManager = ref();

  // 终端列表
  const clients = clientCodeOptions.map((item) => ({
    code: item.value,
    name: $t(item.label),
  }));

  // 当前选中的终端
  const clientCode = ref('admin');
  // 搜索关键字
  const searchName = ref('');
  // 传给右侧面板的搜索关键字（主搜索命中子页面时联动）
  const panelSearchKeyword = ref('');
  // 右侧面板需高亮的子页面 id
  const highlightSubpageId = ref<string | undefined>();
  // 树形展开状态
  const treeExpand = ref(false);
  // 原始表格数据
  const remoteTableData = ref<Menu[]>([]);
  // 菜单 id 映射
  const menuMap = ref(new Map<string, Menu>());
  // 骨架树数据
  const skeletonData = ref<ReturnType<typeof buildSkeletonTree>>([]);
  // 当前选中节点
  const selectedNode = ref<Menu | null>(null);

  /**
   * 清空左侧选中状态，同步清空右侧列表
   */
  function clearLeftSelection() {
    if (!selectedNode.value && !panelSearchKeyword.value && !highlightSubpageId.value) {
      skeletonTable.value?.clearCurrentRow();
      return;
    }
    selectedNode.value = null;
    panelSearchKeyword.value = '';
    highlightSubpageId.value = undefined;
    skeletonTable.value?.clearCurrentRow();
  }

  /**
   * 获取操作菜单配置
   */
  function getActionMenu(row: Menu) {
    const items = [];
    if (row.menuType && ([MenuTypeEnum.CATALOG, MenuTypeEnum.MENU] as string[]).includes(row.menuType)) {
      items.push({ key: 'addChild', label: $t('iam.menu.addChild') });
    }
    if (canManagePermCode(row)) {
      items.push({ key: 'managePermCode', label: $t('iam.menu.managePermCode') });
    }
    items.push({ key: 'delete', label: $t('common.delete'), danger: true });

    return {
      items,
      onClick: ({ key }: { key: string }) => {
        switch (key) {
          case 'addChild': {
            handleAddChild(row);
            break;
          }
          case 'delete': {
            handleDeleteConfirm(row);
            break;
          }
          case 'managePermCode': {
            handleManagePermCode(row);
            break;
          }
        }
      },
    };
  }

  onMounted(() => {
    skeletonTable.value?.connectToolbar(skeletonToolbar.value as VxeToolbarInstance);
    queryPage();
  });

  /**
   * 查询菜单树
   */
  function queryPage() {
    loading.value = true;
    MenuApi.tree(clientCode.value)
      .then((res: any) => {
        remoteTableData.value = res.data || [];
        menuMap.value = flattenMenuMap(remoteTableData.value);
        applyFilters();
        if (selectedNode.value?.id) {
          const refreshed = menuMap.value.get(selectedNode.value.id);
          selectedNode.value = refreshed || null;
        }
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /**
   * 应用筛选并刷新骨架树
   */
  function applyFilters() {
    const keyword = searchName.value?.trim();
    const fullSkeleton = buildSkeletonTree(remoteTableData.value);

    if (keyword) {
      const result = filterSkeletonTreeWithSubpages(fullSkeleton, remoteTableData.value, keyword);
      skeletonData.value = result.tree;
      treeExpand.value = true;

      if (result.subpageMatches.length > 0) {
        const first = result.subpageMatches[0]!;
        const parentMenu = first.parentMenu.id
          ? menuMap.value.get(first.parentMenu.id) || first.parentMenu
          : first.parentMenu;
        selectedNode.value = parentMenu;
        panelSearchKeyword.value = keyword;
        highlightSubpageId.value = first.subpage.id!;
        nextTick(() => {
          skeletonTable.value?.setAllTreeExpand(true);
          skeletonTable.value?.setCurrentRow(parentMenu);
        });
      } else {
        clearLeftSelection();
        nextTick(() => {
          skeletonTable.value?.setAllTreeExpand(true);
        });
      }
    } else {
      skeletonData.value = fullSkeleton;
      nextTick(() => {
        skeletonTable.value?.setAllTreeExpand(treeExpand.value);
      });
    }
  }

  /**
   * 搜索
   */
  function search() {
    applyFilters();
    if (!searchName.value?.trim()) {
      clearLeftSelection();
    }
  }

  /**
   * 获取显示标题
   */
  function getDisplayTitle(row: Menu): string {
    if (row.i18nKey) {
      // 国际化：根据国际化 key 获取显示标题
      return $t(row.i18nKey);
    }
    const locale = i18n.global.locale.value;
    if (locale === 'en-US') {
      return row.titleEn || '';
    }
    return row.titleCn || '';
  }

  /**
   * 选中骨架树节点
   */
  function handleSelectNode({ row }: { row: Menu }) {
    if (!row?.menuType) {
      return;
    }
    if (row.menuType === MenuTypeEnum.CATALOG || row.menuType === MenuTypeEnum.MENU) {
      selectedNode.value = row;
      panelSearchKeyword.value = '';
      highlightSubpageId.value = undefined;
      skeletonTable.value?.setCurrentRow(row);
    }
  }

  /**
   * 添加菜单
   */
  function handleAdd() {
    menuEdit.value.init(undefined, FormEditType.Add, { clientCode: clientCode.value });
  }

  /**
   * 编辑菜单
   */
  function handleEdit(row: Menu) {
    menuEdit.value.init(row.id!, FormEditType.Edit, { clientCode: clientCode.value });
  }

  /**
   * 查看菜单
   */
  function handleView(row: Menu) {
    menuEdit.value.init(row.id!, FormEditType.Show, { clientCode: clientCode.value });
  }

  /**
   * 添加子菜单
   */
  function handleAddChild(row: Menu) {
    menuEdit.value.init(undefined, FormEditType.Add, {
      clientCode: clientCode.value,
      parentRow: row,
      parentMenuType: row.menuType,
    });
  }

  /**
   * 从右侧面板添加子页面
   */
  function handleAddSubpage(parentMenu: Menu) {
    menuEdit.value.init(undefined, FormEditType.Add, {
      clientCode: clientCode.value,
      parentRow: parentMenu,
      parentMenuType: MenuTypeEnum.MENU,
    });
  }

  /**
   * 判断是否可以管理权限码
   */
  function canManagePermCode(row: Menu) {
    return ([MenuTypeEnum.MENU, MenuTypeEnum.SUBPAGE] as string[]).includes(row.menuType || '') && !!row.menuCode;
  }

  /**
   * 管理权限码
   */
  function handleManagePermCode(row: Menu) {
    if (!canManagePermCode(row)) {
      return;
    }
    permCodeManager.value.init(row);
  }

  /**
   * 删除确认
   */
  function handleDeleteConfirm(row: Menu) {
    confirm({
      // 国际化：是否删除该条数据
      title: $t('iam.menu.confirmDelete'),
      content: `${$t('iam.menu.titleCn')}: ${row.titleCn}`,
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: () => {
        MenuApi.delete(row.id!).then(() => {
          message.success($t('common.deleteSuccess'));
          if (selectedNode.value?.id === row.id) {
            clearLeftSelection();
          }
          queryPage();
        });
      },
    });
  }

  /**
   * 扫描权限码
   */
  function handleScanPermCode() {
    confirm({
      title: $t('iam.role.permCodeScan'),
      content: $t('iam.role.permCodeScanConfirm'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        scanLoading.value = true;
        const res = await PermCodeApi.scan().finally(() => {
          scanLoading.value = false;
        });
        const data = res.data || {};
        message.success(
          `${$t('iam.role.permCodeScanSuccess')}: +${data.addedCount || 0} / ~${data.updatedCount || 0} / -${data.deletedCount || 0}`,
        );
      },
    });
  }

  /**
   * 全部展开/折叠骨架树
   */
  function allTreeExpand(expand: boolean) {
    treeExpand.value = expand;
    nextTick(() => {
      skeletonTable.value?.setAllTreeExpand(expand);
    });
  }
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <a-form layout="inline">
        <a-form-item :label="$t('iam.menu.client')">
          <a-select
            v-model:value="clientCode"
            :options="clients"
            :field-names="{ label: 'name', value: 'code' }"
            style="width: 200px"
            @change="queryPage"
          />
        </a-form-item>
        <a-form-item>
          <a-input-search
            v-model:value="searchName"
            :placeholder="$t('iam.menu.searchWithMenuCode')"
            allow-clear
            style="width: 360px"
            @search="search"
            @clear="search"
            @keyup.enter="search"
          />
        </a-form-item>
      </a-form>
    </a-card>

    <div class="mt-4">
      <a-card>
        <div class="menu-toolbar-wrap" @click.self="clearLeftSelection">
          <vxe-toolbar ref="skeletonToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
            <template #buttons>
              <a-space>
                <a-button v-if="hasPermission(PermCodes.Iam.PermMenu.MANAGE)" type="primary" @click="handleAdd">
                  {{ $t('common.add') }}
                </a-button>
                <a-button
                  v-if="hasPermission(PermCodes.Iam.PermMenu.MANAGE)"
                  :loading="scanLoading"
                  @click="handleScanPermCode"
                >
                  {{ $t('iam.role.permCodeScan') }}
                </a-button>
                <a-button @click="allTreeExpand(true)">{{ $t('iam.menu.expandAll') }}</a-button>
                <a-button @click="allTreeExpand(false)">{{ $t('iam.menu.collapseAll') }}</a-button>
              </a-space>
            </template>
          </vxe-toolbar>
        </div>

        <div class="menu-split-wrapper mt-2">
          <SplitPane class="menu-split-group" :default-left-percent="65" :min-left-percent="40" :max-left-percent="78">
            <template #left>
              <div class="menu-panel-body menu-panel-body--left" @mousedown.self="clearLeftSelection">
                <vxe-table
                  ref="skeletonTable"
                  :border="false"
                  :stripe="false"
                  :row-config="{ keyField: 'id', isCurrent: true }"
                  :data="skeletonData"
                  :loading="loading"
                  :tree-config="{ childrenField: 'children' }"
                  @cell-click="handleSelectNode"
                >
                  <vxe-column field="titleCn" :title="$t('iam.menu.titleCn')" :min-width="160" tree-node>
                    <template #default="{ row }">
                      <IconifyIcon v-if="row.icon" :icon="row.icon" class="text-lg inline-block align-middle mr-2" />
                      <span>{{ getDisplayTitle(row) }}</span>
                      <a-tag
                        v-if="row.menuType === MenuTypeEnum.MENU && row.subpageCount"
                        class="ml-2"
                        color="blue"
                      >
                        {{ $t('iam.menu.subpageCount', { count: row.subpageCount }) }}
                      </a-tag>
                    </template>
                  </vxe-column>
                  <vxe-column field="menuType" :title="$t('iam.menu.menuType')" :width="90" align="center">
                    <template #default="{ row }">
                      <a-tag
                        v-if="row.menuType && menuTypeI18nMap[row.menuType]"
                        :color="menuTypeColorMap[row.menuType]"
                      >
                        {{ $t(menuTypeI18nMap[row.menuType]!) }}
                      </a-tag>
                    </template>
                  </vxe-column>
                  <vxe-column fixed="right" :width="200" :show-overflow="false" :title="$t('common.operation')">
                    <template #default="{ row }">
                      <a-space :size="2">
                        <template #separator>
                          <a-divider type="vertical" />
                        </template>
                        <a-button
                          v-if="hasPermission(PermCodes.Iam.PermMenu.VIEW)"
                          type="link"
                          size="small"
                          @click.stop="handleView(row)"
                        >
                          {{ $t('common.view') }}
                        </a-button>
                        <a-button
                          v-if="hasPermission(PermCodes.Iam.PermMenu.MANAGE)"
                          type="link"
                          size="small"
                          @click.stop="handleEdit(row)"
                        >
                          {{ $t('common.edit') }}
                        </a-button>
                        <a-dropdown
                          v-if="hasPermission(PermCodes.Iam.PermMenu.MANAGE)"
                          :menu="getActionMenu(row)"
                          @click.stop
                        >
                          <a-button type="link" size="small" @click.stop>
                            {{ $t('iam.menu.more') }}
                            <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                          </a-button>
                        </a-dropdown>
                      </a-space>
                    </template>
                  </vxe-column>
                </vxe-table>
              </div>
            </template>
            <template #right>
              <div class="menu-panel-body menu-panel-body--right">
                <MenuChildrenPanel
                  :client-code="clientCode"
                  :external-keyword="panelSearchKeyword"
                  :highlight-row-id="highlightSubpageId"
                  :menu-map="menuMap"
                  :selected-node="selectedNode"
                  @add-subpage="handleAddSubpage"
                  @delete="handleDeleteConfirm"
                  @edit="handleEdit"
                  @manage-perm-code="handleManagePermCode"
                  @view="handleView"
                />
              </div>
            </template>
          </SplitPane>
        </div>
      </a-card>
    </div>

    <MenuEdit ref="menuEdit" @ok="queryPage" />
    <PermCodeManager ref="permCodeManager" />
  </div>
</template>

<style scoped>
  .menu-split-wrapper {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 280px);
    min-height: 400px;
  }

  .menu-split-group {
    flex: 1;
    min-height: 0;
  }

  .menu-panel-body {
    height: 100%;
    min-height: 0;
  }

  .menu-panel-body--left {
    padding-right: 8px;
  }

  .menu-panel-body--right {
    padding-left: 8px;
  }

  .menu-toolbar-wrap {
    width: 100%;
  }
</style>
