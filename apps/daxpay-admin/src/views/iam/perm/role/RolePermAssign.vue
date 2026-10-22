<script lang="ts" setup>
  import type { RolePermAssignContext } from '#/api/iam/perm/role-perm.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { RolePermApi } from '#/api/iam/perm/role-perm.api';
  import { RoleApi } from '#/api/iam/perm/role.api';
  import { clientCodeColorMap, clientCodeI18nMap } from '#/enums/clientCode';
  import { useMessage } from '#/hooks/useMessage';

  import PermTreeNodeTitle from './components/PermTreeNodeTitle.vue';
  import PermTreeToolbar from './components/PermTreeToolbar.vue';
  import { type TreeNode, usePermTreeAssign } from './composables/usePermTreeAssign';

  const emits = defineEmits(['ok']);

  const { confirm, message } = useMessage();

  // 抽屉显示状态
  const visible = ref(false);
  // 确认按钮加载状态
  const confirmLoading = ref(false);
  // 当前角色信息
  const role = ref<RolePermAssignContext>({});

  // 权限树勾选引擎(索引/级联状态机/过滤/脏检查/提交口径)
  const {
    menuLoading,
    searchKeyword,
    onlySelected,
    onlyMenus,
    cascadeCodes,
    expandedKeys,
    hasTreeData,
    displayTreeData,
    treeCheckedKeys,
    selectedMenuCount,
    selectedCodeCount,
    menuTotalCount,
    codeTotalCount,
    isDirty,
    handleCheck,
    handleExpand,
    handleCheckAll,
    handleUncheckAll,
    handleExpandAll,
    handleCollapseAll,
    isCodeMultiMounted,
    loadData,
    reset,
    resetFilters,
    getSubmitPayload,
  } = usePermTreeAssign();

  // 角色显示名
  const roleDisplayName = computed(() => {
    const r = role.value;
    if (!r.i18nKey) {
      return r.code || '';
    }
    const text = $t(r.i18nKey);
    if (!text || text === r.i18nKey) {
      return r.code || r.i18nKey;
    }
    return text;
  });

  /** 初始化权限分配弹窗 */
  async function init(roleId: number) {
    visible.value = true;
    resetFilters();
    const res = await RoleApi.findById(String(roleId));
    role.value = { ...res.data };
    reset();
    await loadData(role.value.id!, role.value.clientCode!);
  }

  /** 取消按钮点击事件 */
  function handleCancel() {
    visible.value = false;
    confirmLoading.value = false;
  }

  /** 确认按钮点击事件，弹出确认对话框 */
  async function handleOk() {
    if (!isDirty.value) {
      message.info($t('iam.role.noChange'));
      return;
    }
    confirm({
      // 分配权限
      title: $t('iam.role.assignPermission'),
      // 确认要保存权限分配吗？（含统计）
      content: $t('iam.role.assignPermissionConfirmStats', {
        menu: selectedMenuCount.value,
        code: selectedCodeCount.value,
      }),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        await doSave();
      },
    });
  }

  /** 执行保存操作 */
  async function doSave() {
    const roleId = role.value.id;
    const clientCode = role.value.clientCode;
    if (!roleId || !clientCode) {
      return;
    }
    confirmLoading.value = true;
    const { menuIds, codeIds } = getSubmitPayload();
    await RolePermApi.save({
      roleId,
      clientCode,
      menuIds,
      codeIds,
      updateChildren: false,
    }).finally(() => {
      confirmLoading.value = false;
    });
    // 分配权限成功
    message.success($t('iam.role.assignPermissionSuccess'));
    handleCancel();
    emits('ok');
  }

  defineExpose({ init });
</script>

<template>
  <!-- 国际化：分配权限 -->
  <a-drawer :open="visible" :default-size="820" :mask-closable="false" @close="handleCancel">
    <template #title>
      <div class="flex min-w-0 items-center gap-2">
        <span class="shrink-0">{{ $t('iam.role.assignPermission') }}</span>
        <span v-if="roleDisplayName" class="truncate text-sm font-normal text-muted-foreground">
          · {{ roleDisplayName }}
        </span>
        <span v-if="role.code" class="shrink-0 text-sm font-normal text-muted-foreground/80"> ({{ role.code }}) </span>
        <a-tag v-if="role.clientCode" :color="clientCodeColorMap[role.clientCode] || 'default'" class="!m-0 shrink-0">
          {{ $t(clientCodeI18nMap[role.clientCode] || role.clientCode) }}
        </a-tag>
      </div>
    </template>

    <template #extra>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="confirmLoading" :disabled="!isDirty && !menuLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>

    <a-spin :spinning="menuLoading">
      <div v-if="!menuLoading && hasTreeData" class="flex flex-col gap-3">
        <!-- 工具条：搜索 + 批量操作 + 过滤 + 统计 -->
        <PermTreeToolbar
          v-model:search-keyword="searchKeyword"
          v-model:only-menus="onlyMenus"
          v-model:only-selected="onlySelected"
          v-model:cascade-codes="cascadeCodes"
          :selected-menu-count="selectedMenuCount"
          :menu-total-count="menuTotalCount"
          :selected-code-count="selectedCodeCount"
          :code-total-count="codeTotalCount"
          @check-all="handleCheckAll"
          @uncheck-all="handleUncheckAll"
          @expand-all="handleExpandAll"
          @collapse-all="handleCollapseAll"
        />

        <a-tree
          v-if="displayTreeData.length > 0"
          checkable
          check-strictly
          :tree-data="displayTreeData"
          :checked-keys="treeCheckedKeys"
          :expanded-keys="expandedKeys"
          :field-names="{ children: 'children', key: 'key', title: 'displayTitle' }"
          @check="handleCheck"
          @expand="handleExpand"
        >
          <!-- antdv-next Tree 自定义标题：类型小圆点区分；权限码多挂时才提示同步 -->
          <template #titleRender="node">
            <PermTreeNodeTitle
              :node="node as TreeNode"
              :keyword="searchKeyword"
              :multi-mounted="isCodeMultiMounted(node.codeId)"
            />
          </template>
        </a-tree>
        <a-empty v-else :description="$t('iam.role.assignPermissionEmpty')" />
      </div>
      <!-- 加载完成后树为空 -->
      <a-empty v-else-if="!menuLoading" :description="$t('iam.role.assignPermissionEmpty')" />
    </a-spin>
  </a-drawer>
</template>
