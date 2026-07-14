<script lang="ts" setup>
  import type { RolePermAssignContext, RolePermAssignResult, RolePermTreeNode } from '#/api/iam/perm/role-perm.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { RoleApi } from '#/api/iam/perm/role.api';
  import { RolePermApi } from '#/api/iam/perm/role-perm.api';
  import { useMessage } from '#/hooks/useMessage';
  import { formatPermCodeTitle } from '#/utils/perm-i18n';

  /** ID值类型 */
  type IdValue = number | string;
  /** 键值类型 */
  type KeyValue = string;
  /** 菜单勾选状态：full-完全选中，half-半选状态 */
  type MenuCheckState = {
    full: boolean;
    half: boolean;
  };
  /** 树节点类型 */
  type TreeNode = RolePermTreeNode & {
    children?: TreeNode[];
    displayTitle?: string;
  };

  const emits = defineEmits(['ok']);

  const { confirm, message } = useMessage();

  // 抽屉显示状态
  const visible = ref(false);
  // 确认按钮加载状态
  const confirmLoading = ref(false);
  // 菜单树加载状态
  const menuLoading = ref(false);
  // 当前角色信息
  const role = ref<RolePermAssignContext>({});
  // 树形数据
  const treeData = ref<TreeNode[]>([]);
  // 手动勾选的菜单ID列表
  const manualCheckedMenuIds = ref<KeyValue[]>([]);
  // 自动勾选的菜单ID列表（因权限码勾选而联动勾选）
  const autoCheckedMenuIds = ref<KeyValue[]>([]);
  // 勾选的权限码ID列表
  const checkedCodeIds = ref<KeyValue[]>([]);
  // 勾选的节点key列表
  const checkedKeys = ref<KeyValue[]>([]);
  // 半选状态的菜单key列表
  const halfCheckedMenuKeys = ref<KeyValue[]>([]);
  // 节点映射表
  const nodeMap = ref(new Map<KeyValue, TreeNode>());
  // 菜单父级映射表
  const menuParentMap = ref(new Map<KeyValue, KeyValue | undefined>());
  // 菜单子级映射表
  const menuChildrenMap = ref(new Map<KeyValue, KeyValue[]>());
  // 菜单对应的权限码映射表
  const menuCodeMap = ref(new Map<KeyValue, KeyValue[]>());
  // 权限码对应的菜单映射表（一码可挂多个同 menuCode 菜单，值为父菜单 id 列表）
  const codeMenuMap = ref(new Map<KeyValue, KeyValue[]>());
  // 菜单ID值映射表
  const menuIdValueMap = ref(new Map<KeyValue, IdValue>());
  // 权限码ID值映射表
  const codeIdValueMap = ref(new Map<KeyValue, IdValue>());

  // 本地化后的树形数据
  const localizedTreeData = computed(() => mapTree(treeData.value));
  // 树形组件勾选状态
  const treeCheckedKeys = computed(() => ({
    checked: checkedKeys.value,
    halfChecked: halfCheckedMenuKeys.value,
  }));

  /** 规范化ID值，转换为字符串键值 */
  function normalizeId(value?: IdValue | null): KeyValue {
    return value === undefined || value === null ? '' : String(value);
  }

  /** 将菜单ID转换为菜单key */
  function toMenuKey(menuId?: IdValue | null): KeyValue {
    const id = normalizeId(menuId);
    return id ? `menu-${id}` : '';
  }

  /** 将权限码ID + 所属菜单ID转换为树节点 key（一码多挂时保证全局唯一） */
  function toCodeKey(codeId?: IdValue | null, menuId?: IdValue | null): KeyValue {
    const c = normalizeId(codeId);
    const m = normalizeId(menuId);
    return c && m ? `code-${c}-menu-${m}` : '';
  }

  /**
   * 翻译菜单 i18nKey，缺失词条时回退 fallback（避免显示裸 key 或空白）
   */
  function translateOrFallback(i18nKey?: string, fallback = ''): string {
    if (!i18nKey) {
      return fallback;
    }
    const text = $t(i18nKey);
    // vue-i18n 缺词条时通常返回 key 本身
    if (!text || text === i18nKey) {
      return fallback || i18nKey;
    }
    return text;
  }

  /** 获取节点显示标题：菜单用 menu.* 词条，权限码用 perm 语言包 + 真实 code */
  function getDisplayTitle(node: TreeNode): string {
    if (node.type === 'code') {
      return formatPermCodeTitle(node.i18nKey, node.code);
    }
    return translateOrFallback(node.i18nKey, '');
  }

  /** 递归映射树节点，添加本地化显示标题 */
  function mapTree(data: TreeNode[]): TreeNode[] {
    return data.map((item) => ({
      ...item,
      displayTitle: getDisplayTitle(item),
      children: item.children?.length ? mapTree(item.children) : item.children,
    }));
  }

  /** 初始化权限分配弹窗 */
  async function init(roleId: number) {
    visible.value = true;
    const res = await RoleApi.findById(String(roleId));
    role.value = { ...res.data };
    resetAssignState();
    await loadAssignData();
  }

  /** 重置权限分配状态 */
  function resetAssignState() {
    treeData.value = [];
    manualCheckedMenuIds.value = [];
    autoCheckedMenuIds.value = [];
    checkedCodeIds.value = [];
    checkedKeys.value = [];
    halfCheckedMenuKeys.value = [];
    nodeMap.value = new Map();
    menuParentMap.value = new Map();
    menuChildrenMap.value = new Map();
    menuCodeMap.value = new Map();
    codeMenuMap.value = new Map();
    menuIdValueMap.value = new Map();
    codeIdValueMap.value = new Map();
  }

  /** 加载权限分配数据 */
  async function loadAssignData() {
    const roleId = role.value.id;
    const clientCode = role.value.clientCode;
    if (!roleId || !clientCode) {
      return;
    }
    menuLoading.value = true;
    const res = await RolePermApi.getByRole(String(roleId), clientCode).finally(() => {
      menuLoading.value = false;
    });
    fillAssignData(res.data || {});
  }

  /** 填充权限分配数据 */
  function fillAssignData(data: RolePermAssignResult) {
    treeData.value = (data.tree || []) as TreeNode[];
    buildIndexes(treeData.value);
    manualCheckedMenuIds.value = uniqueKeys((data.checkedMenuIds || []).map((item) => normalizeId(item)));
    checkedCodeIds.value = uniqueKeys((data.checkedCodeIds || []).map((item) => normalizeId(item)));
    recomputeState();
  }

  /** 构建索引映射表 */
  function buildIndexes(nodes: TreeNode[]) {
    const nextNodeMap = new Map<KeyValue, TreeNode>();
    const nextMenuParentMap = new Map<KeyValue, KeyValue | undefined>();
    const nextMenuChildrenMap = new Map<KeyValue, KeyValue[]>();
    const nextMenuCodeMap = new Map<KeyValue, KeyValue[]>();
    const nextCodeMenuMap = new Map<KeyValue, KeyValue[]>();
    const nextMenuIdValueMap = new Map<KeyValue, IdValue>();
    const nextCodeIdValueMap = new Map<KeyValue, IdValue>();

    /** 确保菜单子级和权限码列表已初始化 */
    function ensureMenuChildren(menuId: KeyValue) {
      if (!nextMenuChildrenMap.has(menuId)) {
        nextMenuChildrenMap.set(menuId, []);
      }
      if (!nextMenuCodeMap.has(menuId)) {
        nextMenuCodeMap.set(menuId, []);
      }
    }

    /** 确保权限码的父菜单列表已初始化 */
    function ensureCodeMenus(codeId: KeyValue) {
      if (!nextCodeMenuMap.has(codeId)) {
        nextCodeMenuMap.set(codeId, []);
      }
    }

    /** 递归遍历节点构建索引 */
    function walk(currentNodes: TreeNode[], parentMenuId?: KeyValue) {
      currentNodes.forEach((node) => {
        const nodeKey = String(
          node.key || (node.type === 'code' ? toCodeKey(node.codeId, parentMenuId) : toMenuKey(node.id)),
        );
        nextNodeMap.set(nodeKey, node);

        if (node.type === 'code') {
          const codeId = normalizeId(node.codeId);
          if (!codeId || !parentMenuId) {
            return;
          }
          ensureCodeMenus(codeId);
          const parentMenus = nextCodeMenuMap.get(codeId)!;
          if (!parentMenus.includes(parentMenuId)) {
            parentMenus.push(parentMenuId);
          }
          nextCodeIdValueMap.set(codeId, node.codeId as IdValue);
          ensureMenuChildren(parentMenuId);
          nextMenuCodeMap.get(parentMenuId)?.push(codeId);
          return;
        }

        const menuId = normalizeId(node.id);
        if (!menuId) {
          return;
        }
        nextMenuIdValueMap.set(menuId, node.id as IdValue);
        nextMenuParentMap.set(menuId, parentMenuId);
        ensureMenuChildren(menuId);
        if (parentMenuId) {
          ensureMenuChildren(parentMenuId);
          nextMenuChildrenMap.get(parentMenuId)?.push(menuId);
        }
        if (node.children?.length) {
          walk(node.children, menuId);
        }
      });
    }

    walk(nodes);

    nodeMap.value = nextNodeMap;
    menuParentMap.value = nextMenuParentMap;
    menuChildrenMap.value = nextMenuChildrenMap;
    menuCodeMap.value = nextMenuCodeMap;
    codeMenuMap.value = nextCodeMenuMap;
    menuIdValueMap.value = nextMenuIdValueMap;
    codeIdValueMap.value = nextCodeIdValueMap;
  }

  /** 去重并过滤空值 */
  function uniqueKeys(keys: KeyValue[]) {
    return [...new Set(keys.filter(Boolean))];
  }

  /** 收集菜单的所有子孙菜单ID */
  function collectDescendantMenuIds(menuId: KeyValue): KeyValue[] {
    const result: KeyValue[] = [];
    const visited = new Set<KeyValue>();

    function walk(currentMenuId: KeyValue) {
      if (!currentMenuId || visited.has(currentMenuId)) {
        return;
      }
      visited.add(currentMenuId);
      result.push(currentMenuId);
      const childMenuIds = menuChildrenMap.value.get(currentMenuId) || [];
      childMenuIds.forEach((childMenuId) => walk(childMenuId));
    }

    walk(menuId);
    return result;
  }

  /** 重新计算勾选状态 */
  function recomputeState() {
    const manualMenuSet = new Set(uniqueKeys(manualCheckedMenuIds.value));
    const checkedCodeSet = new Set(uniqueKeys(checkedCodeIds.value));
    const autoMenuSet = new Set<KeyValue>();

    // 根据勾选的权限码，自动勾选其全部挂载父菜单
    checkedCodeSet.forEach((codeId) => {
      const menuIds = codeMenuMap.value.get(codeId) || [];
      menuIds.forEach((menuId) => autoMenuSet.add(menuId));
    });

    autoCheckedMenuIds.value = [...autoMenuSet];

    const sourceSelectedMenuSet = new Set<KeyValue>([...manualMenuSet, ...autoMenuSet]);
    const nextCheckedMenuKeys: KeyValue[] = [];
    const nextHalfCheckedMenuKeys: KeyValue[] = [];

    /** 递归访问菜单，计算勾选状态 */
    function visitMenu(menuId: KeyValue): MenuCheckState {
      const childMenuIds = menuChildrenMap.value.get(menuId) || [];
      const selfSelected = sourceSelectedMenuSet.has(menuId);
      const childStates: MenuCheckState[] = childMenuIds.map((childMenuId) => visitMenu(childMenuId));
      const allChildrenFull = childStates.length > 0 && childStates.every((item: MenuCheckState) => item.full);
      const hasSelectedChild = childStates.some((item: MenuCheckState) => item.full || item.half);
      const full = selfSelected || allChildrenFull;
      const half = !full && hasSelectedChild;

      if (full) {
        nextCheckedMenuKeys.push(toMenuKey(menuId));
      }
      if (half) {
        nextHalfCheckedMenuKeys.push(toMenuKey(menuId));
      }
      return { full, half };
    }

    treeData.value
      .filter((item) => item.type === 'menu')
      .forEach((item) => {
        const menuId = normalizeId(item.id);
        if (menuId) {
          visitMenu(menuId);
        }
      });

    // 每个 codeId 展开为所有挂载实例的树 key，保证勾选态与多实例节点同步
    const nextCheckedCodeKeys = [...checkedCodeSet].flatMap((codeId) =>
      (codeMenuMap.value.get(codeId) || []).map((menuId) => toCodeKey(codeId, menuId)),
    );
    checkedKeys.value = uniqueKeys([...nextCheckedMenuKeys, ...nextCheckedCodeKeys]);
    halfCheckedMenuKeys.value = uniqueKeys(nextHalfCheckedMenuKeys);
    manualCheckedMenuIds.value = [...manualMenuSet];
    checkedCodeIds.value = [...checkedCodeSet];
  }

  /** 从勾选信息中提取节点数据 */
  function extractNode(info: any): TreeNode | undefined {
    return info?.node?.dataRef || info?.node;
  }

  /** 处理菜单勾选事件，联动勾选所有子孙菜单 */
  function handleMenuCheck(menuId: KeyValue, checked: boolean) {
    const manualMenuSet = new Set(uniqueKeys(manualCheckedMenuIds.value));
    const descendantMenuIds = collectDescendantMenuIds(menuId);
    if (checked) {
      descendantMenuIds.forEach((id) => manualMenuSet.add(id));
    } else {
      descendantMenuIds.forEach((id) => manualMenuSet.delete(id));
    }
    manualCheckedMenuIds.value = [...manualMenuSet];
    recomputeState();
  }

  /** 处理权限码勾选事件 */
  function handleCodeCheck(codeId: KeyValue, checked: boolean) {
    const checkedCodeSet = new Set(uniqueKeys(checkedCodeIds.value));
    if (checked) {
      checkedCodeSet.add(codeId);
    } else {
      checkedCodeSet.delete(codeId);
    }
    checkedCodeIds.value = [...checkedCodeSet];
    recomputeState();
  }

  /** 树节点勾选事件处理入口 */
  function handleCheck(_: any, info: any) {
    const node = extractNode(info);
    if (!node) {
      return;
    }
    const checked = Boolean(info?.checked);
    if (node.type === 'code') {
      const codeId = normalizeId(node.codeId);
      if (codeId) {
        handleCodeCheck(codeId, checked);
      }
      return;
    }
    const menuId = normalizeId(node.id);
    if (menuId) {
      handleMenuCheck(menuId, checked);
    }
  }

  /** 取消按钮点击事件 */
  function handleCancel() {
    visible.value = false;
    confirmLoading.value = false;
  }

  /** 获取提交的菜单ID列表 */
  function getSubmitMenuIds() {
    const menuIds = uniqueKeys([...manualCheckedMenuIds.value, ...autoCheckedMenuIds.value]);
    return menuIds
      .map((menuId) => menuIdValueMap.value.get(menuId))
      .filter((item): item is IdValue => item !== undefined && item !== null);
  }

  /** 获取提交的权限码ID列表 */
  function getSubmitCodeIds() {
    return uniqueKeys(checkedCodeIds.value)
      .map((codeId) => codeIdValueMap.value.get(codeId))
      .filter((item): item is IdValue => item !== undefined && item !== null);
  }

  /** 确认按钮点击事件，弹出确认对话框 */
  async function handleOk() {
    confirm({
      // 分配权限
      title: $t('iam.role.assignPermission'),
      // 确认要分配权限吗？
      content: $t('iam.role.assignPermissionConfirm'),
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
    await RolePermApi.save({
      roleId,
      clientCode,
      menuIds: getSubmitMenuIds(),
      codeIds: getSubmitCodeIds(),
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
  <a-drawer
    :open="visible"
    :title="$t('iam.role.assignPermission')"
    :size="820"
    :mask-closable="false"
    @close="handleCancel"
  >
    <template #extra>
      <a-space>
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>

    <a-spin :spinning="menuLoading">
      <a-tree
        v-if="localizedTreeData.length > 0"
        checkable
        check-strictly
        default-expand-all
        :tree-data="localizedTreeData"
        :checked-keys="treeCheckedKeys"
        :field-names="{ children: 'children', key: 'key', title: 'displayTitle' }"
        @check="handleCheck"
      />
      <!-- 国际化：当前终端下暂无可分配权限 -->
      <a-empty v-else :description="$t('iam.role.assignPermissionEmpty')" />
    </a-spin>
  </a-drawer>
</template>
