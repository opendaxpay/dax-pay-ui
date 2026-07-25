<script lang="ts" setup>
  import type { RolePermAssignContext, RolePermAssignResult, RolePermTreeNode } from '#/api/iam/perm/role-perm.api';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { RoleApi } from '#/api/iam/perm/role.api';
  import { RolePermApi } from '#/api/iam/perm/role-perm.api';
  import { clientCodeColorMap, clientCodeI18nMap } from '#/enums/clientCode';
  import { menuTypeDotClassMap, menuTypeI18nMap } from '#/enums/menuType';
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
  // 树形数据（源数据，索引与勾选逻辑基于此）
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
  // 展开的节点key
  const expandedKeys = ref<KeyValue[]>([]);
  // 搜索关键字
  const searchKeyword = ref('');
  // 仅看已选
  const onlySelected = ref(false);
  // 只显示菜单（隐藏权限码节点）
  const onlyMenus = ref(false);
  // 勾选菜单时是否级联下属权限码（默认开启）
  const cascadeCodes = ref(true);
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
  // 初始快照（脏检查）
  const initialSnapshot = ref({ menuIds: [] as KeyValue[], codeIds: [] as KeyValue[] });

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

  // 本地化后的完整树
  const localizedTreeData = computed(() => mapTree(treeData.value));

  // 过滤后用于展示的树（只显示菜单 / 仅看已选 / 搜索）
  const displayTreeData = computed(() => {
    let tree = localizedTreeData.value;
    if (onlyMenus.value) {
      tree = filterTreeMenusOnly(tree);
    }
    if (onlySelected.value) {
      tree = filterTreeBySelected(tree);
    }
    const keyword = searchKeyword.value.trim();
    if (keyword) {
      tree = filterTreeByKeyword(tree, keyword);
    }
    return tree;
  });

  // 树形组件勾选状态
  const treeCheckedKeys = computed(() => ({
    checked: checkedKeys.value,
    halfChecked: halfCheckedMenuKeys.value,
  }));

  // 已选统计：菜单 = manual ∪ auto ∪ 祖先补齐前的真实选择；与提交口径一致取 manual∪auto
  const selectedMenuCount = computed(() => {
    return uniqueKeys([...manualCheckedMenuIds.value, ...autoCheckedMenuIds.value]).length;
  });
  const selectedCodeCount = computed(() => uniqueKeys(checkedCodeIds.value).length);
  // 菜单总数（树中全部菜单节点数）
  const menuTotalCount = computed(() => menuIdValueMap.value.size);
  // 权限码总数（树中全部权限码节点数）
  const codeTotalCount = computed(() => codeIdValueMap.value.size);

  // 是否有未保存变更
  const isDirty = computed(() => {
    const currentMenus = uniqueKeys([...manualCheckedMenuIds.value, ...autoCheckedMenuIds.value]).sort();
    const currentCodes = uniqueKeys(checkedCodeIds.value).sort();
    return (
      JSON.stringify(currentMenus) !== JSON.stringify(initialSnapshot.value.menuIds) ||
      JSON.stringify(currentCodes) !== JSON.stringify(initialSnapshot.value.codeIds)
    );
  });

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

  /** 节点是否处于已选（full）状态 */
  function isNodeSelected(node: TreeNode): boolean {
    const key = String(node.key || '');
    if (!key) {
      return false;
    }
    if (node.type === 'code') {
      return checkedKeys.value.includes(key);
    }
    return checkedKeys.value.includes(key) || halfCheckedMenuKeys.value.includes(key);
  }

  /** 只显示菜单：剔除权限码节点，保留菜单树结构 */
  function filterTreeMenusOnly(nodes: TreeNode[]): TreeNode[] {
    return nodes
      .filter((node) => node.type !== 'code')
      .map((node) => ({
        ...node,
        children: node.children?.length ? filterTreeMenusOnly(node.children) : node.children,
      }));
  }

  /** 仅看已选：保留已选节点及其祖先路径 */
  function filterTreeBySelected(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];
    nodes.forEach((node) => {
      const children = node.children?.length ? filterTreeBySelected(node.children) : [];
      if (isNodeSelected(node) || children.length > 0) {
        result.push({ ...node, children });
      }
    });
    return result;
  }

  /** 关键字是否命中节点（标题 / 权限码 code） */
  function nodeMatchesKeyword(node: TreeNode, keyword: string): boolean {
    const lower = keyword.toLowerCase();
    const title = (node.displayTitle || '').toLowerCase();
    if (title.includes(lower)) {
      return true;
    }
    if (node.type === 'code' && node.code?.toLowerCase().includes(lower)) {
      return true;
    }
    return false;
  }

  /** 按关键字过滤树：命中节点保留，并保留通往命中节点的祖先 */
  function filterTreeByKeyword(nodes: TreeNode[], keyword: string): TreeNode[] {
    const result: TreeNode[] = [];
    nodes.forEach((node) => {
      const children = node.children?.length ? filterTreeByKeyword(node.children, keyword) : [];
      if (nodeMatchesKeyword(node, keyword) || children.length > 0) {
        result.push({ ...node, children });
      }
    });
    return result;
  }

  /** 收集过滤树中所有节点 key（用于搜索后展开） */
  function collectTreeKeys(nodes: TreeNode[]): KeyValue[] {
    const keys: KeyValue[] = [];
    function walk(list: TreeNode[]) {
      list.forEach((node) => {
        if (node.key) {
          keys.push(String(node.key));
        }
        if (node.children?.length) {
          walk(node.children);
        }
      });
    }
    walk(nodes);
    return keys;
  }

  /** 默认展开：根菜单及其第一层子菜单（约 2 级），避免全展开卡顿 */
  function getDefaultExpandedKeys(nodes: TreeNode[]): KeyValue[] {
    const keys: KeyValue[] = [];
    nodes.forEach((root) => {
      if (root.key) {
        keys.push(String(root.key));
      }
      root.children?.forEach((child) => {
        if (child.type === 'menu' && child.key) {
          keys.push(String(child.key));
        }
      });
    });
    return uniqueKeys(keys);
  }

  /** 初始化权限分配弹窗 */
  async function init(roleId: number) {
    visible.value = true;
    searchKeyword.value = '';
    onlySelected.value = false;
    onlyMenus.value = false;
    cascadeCodes.value = true;
    expandedKeys.value = [];
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
    initialSnapshot.value = { menuIds: [], codeIds: [] };
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
    // 打开时默认展开 2 级
    expandedKeys.value = getDefaultExpandedKeys(localizedTreeData.value);
    takeSnapshot();
  }

  /** 记录当前勾选快照，供脏检查 */
  function takeSnapshot() {
    initialSnapshot.value = {
      menuIds: uniqueKeys([...manualCheckedMenuIds.value, ...autoCheckedMenuIds.value]).sort(),
      codeIds: uniqueKeys(checkedCodeIds.value).sort(),
    };
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

  /** 收集菜单的所有子孙菜单ID（含自身） */
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

  /** 收集菜单子树内全部权限码 ID */
  function collectDescendantCodeIds(menuId: KeyValue): KeyValue[] {
    const codes: KeyValue[] = [];
    collectDescendantMenuIds(menuId).forEach((mid) => {
      codes.push(...(menuCodeMap.value.get(mid) || []));
    });
    return uniqueKeys(codes);
  }

  /** 收集菜单的全部祖先 ID（不含自身） */
  function collectAncestorMenuIds(menuId: KeyValue): KeyValue[] {
    const result: KeyValue[] = [];
    let current = menuParentMap.value.get(menuId);
    const visited = new Set<KeyValue>();
    while (current && !visited.has(current)) {
      visited.add(current);
      result.push(current);
      current = menuParentMap.value.get(current);
    }
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
    // 显示与提交对齐：已选菜单的祖先也视为 full（提交时会补齐）
    const displaySelectedMenuSet = new Set<KeyValue>(sourceSelectedMenuSet);
    sourceSelectedMenuSet.forEach((menuId) => {
      collectAncestorMenuIds(menuId).forEach((aid) => displaySelectedMenuSet.add(aid));
    });

    const nextCheckedMenuKeys: KeyValue[] = [];
    const nextHalfCheckedMenuKeys: KeyValue[] = [];

    /** 递归访问菜单，计算勾选状态 */
    function visitMenu(menuId: KeyValue): MenuCheckState {
      const childMenuIds = menuChildrenMap.value.get(menuId) || [];
      const selfSelected = displaySelectedMenuSet.has(menuId);
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

  /**
   * 处理菜单勾选：
   * - 勾选：联动子孙菜单；开启 cascadeCodes 时同时勾选子树内全部权限码
   * - 取消：联动清除子孙菜单，并始终清除子树内权限码（避免 auto 勾回）
   */
  function handleMenuCheck(menuId: KeyValue, checked: boolean) {
    const manualMenuSet = new Set(uniqueKeys(manualCheckedMenuIds.value));
    const checkedCodeSet = new Set(uniqueKeys(checkedCodeIds.value));
    const descendantMenuIds = collectDescendantMenuIds(menuId);
    const descendantCodeIds = collectDescendantCodeIds(menuId);

    if (checked) {
      descendantMenuIds.forEach((id) => manualMenuSet.add(id));
      if (cascadeCodes.value) {
        descendantCodeIds.forEach((codeId) => checkedCodeSet.add(codeId));
      }
    } else {
      descendantMenuIds.forEach((id) => manualMenuSet.delete(id));
      // 取消菜单时始终清码，防止 autoChecked 把菜单勾回
      descendantCodeIds.forEach((codeId) => checkedCodeSet.delete(codeId));
    }
    manualCheckedMenuIds.value = [...manualMenuSet];
    checkedCodeIds.value = [...checkedCodeSet];
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

  /** 展开/折叠回调 */
  function handleExpand(keys: KeyValue[]) {
    expandedKeys.value = keys;
  }

  /** 全选：所有菜单 + 所有权限码 */
  function handleCheckAll() {
    manualCheckedMenuIds.value = [...menuIdValueMap.value.keys()];
    checkedCodeIds.value = [...codeIdValueMap.value.keys()];
    recomputeState();
  }

  /** 清空全部勾选 */
  function handleUncheckAll() {
    manualCheckedMenuIds.value = [];
    checkedCodeIds.value = [];
    recomputeState();
  }

  /** 展开全部 */
  function handleExpandAll() {
    expandedKeys.value = collectTreeKeys(localizedTreeData.value);
  }

  /** 折叠全部 */
  function handleCollapseAll() {
    expandedKeys.value = [];
  }

  /** 搜索时自动展开过滤结果中的节点路径 */
  watch(searchKeyword, (value) => {
    if (!value.trim()) {
      return;
    }
    // 展开当前过滤结果中的全部节点，便于看到命中项
    expandedKeys.value = uniqueKeys([...expandedKeys.value, ...collectTreeKeys(displayTreeData.value)]);
  });

  /** 取消按钮点击事件 */
  function handleCancel() {
    visible.value = false;
    confirmLoading.value = false;
  }

  /**
   * 获取提交的菜单ID列表
   * 在 manual ∪ auto 基础上向上补齐祖先，保证目录路径完整、与树显示 full 一致
   */
  function getSubmitMenuIds() {
    const menuIdSet = new Set(uniqueKeys([...manualCheckedMenuIds.value, ...autoCheckedMenuIds.value]));
    [...menuIdSet].forEach((menuId) => {
      collectAncestorMenuIds(menuId).forEach((aid) => menuIdSet.add(aid));
    });
    return [...menuIdSet]
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
    await RolePermApi.save({
      roleId,
      clientCode,
      menuIds: getSubmitMenuIds().map(String),
      codeIds: getSubmitCodeIds().map(String),
      updateChildren: false,
    }).finally(() => {
      confirmLoading.value = false;
    });
    // 分配权限成功
    message.success($t('iam.role.assignPermissionSuccess'));
    handleCancel();
    emits('ok');
  }

  /** 标题文本：优先 displayTitle，其次 i18n */
  function resolveNodeTitle(node: TreeNode): string {
    return node.displayTitle || getDisplayTitle(node) || '';
  }

  /** 权限码是否挂载到多个菜单（一码多挂） */
  function isCodeMultiMounted(codeId?: IdValue | null): boolean {
    const id = normalizeId(codeId);
    return id ? (codeMenuMap.value.get(id)?.length ?? 0) > 1 : false;
  }

  /** 节点类型小圆点 class：菜单按 menuType，权限码中性色 */
  function getNodeDotClass(node: TreeNode): string {
    if (node.type === 'code') {
      return 'bg-muted-foreground/50';
    }
    if (node.menuType && menuTypeDotClassMap[node.menuType]) {
      return menuTypeDotClassMap[node.menuType]!;
    }
    return 'bg-muted-foreground/40';
  }

  /** 菜单类型悬停文案（有映射才返回） */
  function getMenuTypeTip(menuType?: string): string {
    if (!menuType || !menuTypeI18nMap[menuType]) {
      return '';
    }
    return $t(menuTypeI18nMap[menuType]!);
  }

  /** 拆分搜索高亮片段（供 titleRender 模板使用） */
  function splitHighlight(text: string): { before: string; hit: string; after: string } | null {
    const keyword = searchKeyword.value.trim();
    if (!keyword || !text) {
      return null;
    }
    const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx < 0) {
      return null;
    }
    return {
      before: text.slice(0, idx),
      hit: text.slice(idx, idx + keyword.length),
      after: text.slice(idx + keyword.length),
    };
  }

  defineExpose({ init });
</script>

<template>
  <!-- 国际化：分配权限 -->
  <a-drawer
    :open="visible"
    :size="820"
    :mask-closable="false"
    @close="handleCancel"
  >
    <template #title>
      <div class="flex min-w-0 items-center gap-2">
        <span class="shrink-0">{{ $t('iam.role.assignPermission') }}</span>
        <span v-if="roleDisplayName" class="truncate text-sm font-normal text-muted-foreground">
          · {{ roleDisplayName }}
        </span>
        <span v-if="role.code" class="shrink-0 text-sm font-normal text-muted-foreground/80">
          ({{ role.code }})
        </span>
        <a-tag
          v-if="role.clientCode"
          :color="clientCodeColorMap[role.clientCode] || 'default'"
          class="!m-0 shrink-0"
        >
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
      <div v-if="!menuLoading && localizedTreeData.length > 0" class="flex flex-col gap-3">
        <!-- 工具条：搜索 + 批量操作 + 过滤 -->
        <div class="flex flex-col gap-2">
          <a-input
            v-model:value="searchKeyword"
            allow-clear
            :placeholder="$t('iam.role.searchPerm')"
          />
          <div class="flex flex-wrap items-center gap-2">
            <a-space wrap :size="8">
              <a-button size="small" @click="handleCheckAll">{{ $t('iam.role.checkAll') }}</a-button>
              <a-button size="small" @click="handleUncheckAll">{{ $t('iam.role.uncheckAll') }}</a-button>
              <a-button size="small" @click="handleExpandAll">{{ $t('iam.role.expandAll') }}</a-button>
              <a-button size="small" @click="handleCollapseAll">{{ $t('iam.role.collapseAll') }}</a-button>
            </a-space>
            <a-divider type="vertical" class="!h-6" />
            <a-space wrap :size="12">
              <a-tooltip :title="$t('iam.role.cascadeCodesTip')">
                <a-checkbox v-model:checked="cascadeCodes">
                  {{ $t('iam.role.cascadeCodes') }}
                </a-checkbox>
              </a-tooltip>
              <a-checkbox v-model:checked="onlyMenus">
                {{ $t('iam.role.onlyMenus') }}
              </a-checkbox>
              <a-checkbox v-model:checked="onlySelected">
                {{ $t('iam.role.onlySelected') }}
              </a-checkbox>
            </a-space>
          </div>
          <div class="text-sm text-muted-foreground">
            {{
              $t('iam.role.selectedStats', {
                menu: selectedMenuCount,
                menuTotal: menuTotalCount,
                code: selectedCodeCount,
                codeTotal: codeTotalCount,
              })
            }}
          </div>
        </div>

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
            <span class="inline-flex max-w-full items-center gap-1.5">
              <!-- 菜单：圆点悬停显示类型名 -->
              <a-tooltip v-if="node.type !== 'code' && getMenuTypeTip(node.menuType)" :title="getMenuTypeTip(node.menuType)">
                <span class="inline-block h-1.5 w-1.5 shrink-0 rounded-full" :class="getNodeDotClass(node)" />
              </a-tooltip>
              <span
                v-else
                class="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                :class="getNodeDotClass(node)"
              />
              <!-- 权限码：多挂才包 tip；标题弱化 -->
              <template v-if="node.type === 'code'">
                <a-tooltip v-if="isCodeMultiMounted(node.codeId)" :title="$t('iam.role.codeMultiMountTip')">
                  <span class="text-muted-foreground">
                    <template v-for="hl in [splitHighlight(resolveNodeTitle(node))]" :key="'c'">
                      <template v-if="hl">
                        {{ hl.before }}<span class="text-red-500">{{ hl.hit }}</span>{{ hl.after }}
                      </template>
                      <template v-else>{{ resolveNodeTitle(node) }}</template>
                    </template>
                  </span>
                </a-tooltip>
                <span v-else class="text-muted-foreground">
                  <template v-for="hl in [splitHighlight(resolveNodeTitle(node))]" :key="'c2'">
                    <template v-if="hl">
                      {{ hl.before }}<span class="text-red-500">{{ hl.hit }}</span>{{ hl.after }}
                    </template>
                    <template v-else>{{ resolveNodeTitle(node) }}</template>
                  </template>
                </span>
              </template>
              <template v-else>
                <template v-for="hl in [splitHighlight(resolveNodeTitle(node))]" :key="'m'">
                  <span v-if="hl">
                    {{ hl.before }}<span class="text-red-500">{{ hl.hit }}</span>{{ hl.after }}
                  </span>
                  <span v-else>{{ resolveNodeTitle(node) }}</span>
                </template>
              </template>
            </span>
          </template>
        </a-tree>
        <a-empty v-else :description="$t('iam.role.assignPermissionEmpty')" />
      </div>
      <!-- 加载完成后树为空 -->
      <a-empty
        v-else-if="!menuLoading"
        :description="$t('iam.role.assignPermissionEmpty')"
      />
    </a-spin>
  </a-drawer>
</template>
