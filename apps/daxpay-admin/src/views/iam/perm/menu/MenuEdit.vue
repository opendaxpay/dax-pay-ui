<script lang="ts" setup>
  import { computed, nextTick, ref, watch } from 'vue';

  import { $t, i18n } from '@vben/locales';

  import { type Menu, MenuApi } from '#/api/iam/perm/menu.api';
  import { IconPicker } from '#/components/icon-picker';
  import { FormEditType } from '#/enums/formEditType';
  import { MenuTypeEnum, menuTypeOptions } from '#/enums/menuType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { useValidate } from '#/hooks/useValidate';

  /**
   * 组件向父层抛出的事件
   */
  const emits = defineEmits(['ok']);

  const { message } = useMessage();
  const { useDebounceValidator } = useValidate();

  interface ExtraParams {
    clientCode?: string;
    parentRow?: Menu;
    parentMenuType?: string;
  }

  const { initFormEditType, handleCancel, visible, title, confirmLoading, showable, formEditType } = useFormEdit();

  // 表单引用
  const formRef = ref();
  // 菜单表单数据
  const form = ref<Menu>({
    menuType: MenuTypeEnum.CATALOG,
    hidden: false,
    keepAlive: true,
    sortNo: 0,
  });
  // 原始菜单编码，用于判断是否变更
  const originalMenuCode = ref('');

  // 父级菜单树数据
  const treeData = ref<any[]>([]);

  // 可用的菜单类型选项（根据父菜单类型动态计算）
  const availableMenuTypeOptions = computed(() => {
    if (formEditType.value === FormEditType.Edit && form.value.menuType === MenuTypeEnum.SUBPAGE) {
      return menuTypeOptions.map((o) => ({ label: $t(o.label), value: o.value }));
    }
    if (extraParams.value?.parentMenuType) {
      switch (extraParams.value.parentMenuType) {
        case MenuTypeEnum.CATALOG: {
          return (
            menuTypeOptions
              .filter((o) =>
                (
                  [MenuTypeEnum.CATALOG, MenuTypeEnum.EMBEDDED, MenuTypeEnum.LINK, MenuTypeEnum.MENU] as string[]
                ).includes(o.value),
              )
              // 国际化：获取菜单类型选项的显示标签
              .map((o) => ({ label: $t(o.label), value: o.value }))
          );
        }
        case MenuTypeEnum.MENU: {
          return (
            menuTypeOptions
              .filter((o) => o.value === MenuTypeEnum.SUBPAGE)
              // 国际化：获取菜单类型选项的显示标签
              .map((o) => ({ label: $t(o.label), value: o.value }))
          );
        }
        default: {
          return [];
        }
      }
    }
    return (
      menuTypeOptions
        .filter((o) => o.value !== MenuTypeEnum.SUBPAGE)
        // 国际化：获取菜单类型选项的显示标签
        .map((o) => ({ label: $t(o.label), value: o.value }))
    );
  });

  // 徽章类型选项
  const badgeTypeOptions = [
    // 圆点徽章
    { label: $t('iam.menu.badgeTypeDot'), value: 'dot' },
    // 文本徽章
    { label: $t('iam.menu.badgeTypeNormal'), value: 'normal' },
  ];

  // 徽章样式选项
  const badgeVariantsOptions = [
    // 默认
    { label: $t('iam.menu.badgeVariantDefault'), value: 'default' },
    // 危险
    { label: $t('iam.menu.badgeVariantDestructive'), value: 'destructive' },
    // 主要
    { label: $t('iam.menu.badgeVariantPrimary'), value: 'primary' },
    // 成功
    { label: $t('iam.menu.badgeVariantSuccess'), value: 'success' },
    // 警告
    { label: $t('iam.menu.badgeVariantWarning'), value: 'warning' },
  ];

  // 是否显示路径
  const showPath = computed(() =>
    ([MenuTypeEnum.CATALOG, MenuTypeEnum.EMBEDDED, MenuTypeEnum.MENU, MenuTypeEnum.SUBPAGE] as string[]).includes(
      form.value.menuType || '',
    ),
  );
  const showComponent = computed(() =>
    ([MenuTypeEnum.MENU, MenuTypeEnum.SUBPAGE] as string[]).includes(form.value.menuType || ''),
  );
  const showIframeSrc = computed(() => form.value.menuType === MenuTypeEnum.EMBEDDED);
  const showLink = computed(() => form.value.menuType === MenuTypeEnum.LINK);
  const showPageConfig = computed(() =>
    ([MenuTypeEnum.MENU, MenuTypeEnum.SUBPAGE] as string[]).includes(form.value.menuType || ''),
  );
  const showParentMenu = computed(() => true);
  const parentRequired = computed(() => form.value.menuType !== MenuTypeEnum.CATALOG);
  const showHideChildrenMenu = computed(() =>
    ([MenuTypeEnum.CATALOG, MenuTypeEnum.MENU] as string[]).includes(form.value.menuType || ''),
  );
  const showMenuCode = computed(() =>
    ([MenuTypeEnum.MENU, MenuTypeEnum.SUBPAGE] as string[]).includes(form.value.menuType || ''),
  );
  const menuCodeRequired = computed(() => form.value.menuType === MenuTypeEnum.MENU);
  const showSortNo = computed(() => form.value.menuType !== MenuTypeEnum.SUBPAGE);
  const showHidden = computed(() => form.value.menuType !== MenuTypeEnum.SUBPAGE);
  const showAffixTab = computed(() => form.value.menuType === MenuTypeEnum.MENU);
  const showBadge = computed(() => form.value.menuType !== MenuTypeEnum.SUBPAGE);
  // 有可选类型时展示菜单类型区（含子页面仅一项场景）
  const showMenuType = computed(() => availableMenuTypeOptions.value.length > 0);
  // 子页面场景锁定类型不可切换
  const menuTypeLocked = computed(
    () =>
      showable.value ||
      form.value.menuType === MenuTypeEnum.SUBPAGE ||
      extraParams.value?.parentMenuType === MenuTypeEnum.MENU,
  );
  const isSubpage = computed(() => form.value.menuType === MenuTypeEnum.SUBPAGE);
  // 过滤后的上级菜单树数据 - 使用 disabled 标记方式显示完整树
  const parentTreeData = computed(() => {
    return markDisabledNodes(treeData.value);
  });

  // 存储额外参数（用于新增下级时传递父菜单类型）
  const extraParams = ref<ExtraParams>({});

  /**
   * 校验菜单编码是否已存在
   */
  async function validateMenuCodeExists(_rule: any, value: string) {
    if (!value || !form.value.clientCode || !showMenuCode.value) return;
    const { data: exists } = await MenuApi.checkMenuCodeExists(value, form.value.clientCode, form.value.id!);
    if (exists) {
      // 国际化：菜单编码已存在
      throw $t('iam.menu.menuCodeExists');
    }
  }

  /**
   * 校验路由路径格式
   */
  function validatePathFormat(_rule: any, value: string) {
    if (!value || !showPath.value) return Promise.resolve();
    if (!value.startsWith('/')) {
      // 国际化：路径必须以 / 开头
      return Promise.reject($t('iam.menu.pathStartWith'));
    }
    return Promise.resolve();
  }

  // 表单校验规则
  const rules = computed(() => ({
    // 菜单类型校验
    menuType: [{ required: true, message: $t('iam.menu.selectMenuType') }],
    // 菜单编码校验（含防抖判重）- 仅菜单类型必填，子页面可选
    menuCode: [
      { required: menuCodeRequired.value, message: $t('iam.menu.inputMenuCode') },
      { validator: useDebounceValidator(formRef, 'menuCode', validateMenuCodeExists, 500) },
    ],
    // 上级菜单校验
    pid: [{ required: parentRequired.value, message: $t('iam.menu.selectParent') }],
    // 中文标题校验
    titleCn: [{ required: true, message: $t('iam.menu.inputTitleCn') }],
    // 英文标题校验
    titleEn: [{ required: true, message: $t('iam.menu.inputTitleEn') }],
    // 国际化Key校验
    i18nKey: [{ required: true, message: $t('iam.menu.inputI18nKey') }],
    // 路由路径校验
    path: [{ required: showPath.value, message: $t('iam.menu.inputPath') }, { validator: validatePathFormat }],
    // 组件路径校验
    component: [{ required: showComponent.value, message: $t('iam.menu.inputComponent') }],
    // 内嵌URL校验
    iframeSrc: [
      { required: showIframeSrc.value, message: $t('iam.menu.inputIframeSrc') },
      { type: 'url', message: $t('iam.menu.invalidUrl') },
    ],
    // 外链地址校验
    link: [
      { required: showLink.value, message: $t('iam.menu.inputLink') },
      { type: 'url', message: $t('iam.menu.invalidUrl') },
    ],
  }));

  /**
   * 监听菜单类型变化，清空不相关字段
   */
  watch(
    () => form.value.menuType,
    (newType) => {
      switch (newType) {
        case MenuTypeEnum.CATALOG: {
          form.value.component = '';
          form.value.iframeSrc = '';
          form.value.link = '';
          break;
        }
        case MenuTypeEnum.EMBEDDED: {
          form.value.component = '';
          form.value.link = '';
          break;
        }
        case MenuTypeEnum.LINK: {
          form.value.component = '';
          form.value.iframeSrc = '';
          form.value.path = '';
          break;
        }
        case MenuTypeEnum.MENU: {
          form.value.iframeSrc = '';
          form.value.link = '';
          break;
        }
        case MenuTypeEnum.SUBPAGE: {
          form.value.iframeSrc = '';
          form.value.link = '';
          form.value.hidden = true;
          break;
        }
      }
    },
  );

  /**
   * 初始化
   */
  function init(id: string | undefined, editType: FormEditType, params?: ExtraParams) {
    // 存储额外参数
    extraParams.value = params || {};
    initFormEditType(editType);
    originalMenuCode.value = '';
    // 先 resetFields 再 getInfo，避免 menuType 表单项挂载后被重置为 catalog
    nextTick(() => {
      formRef.value?.resetFields();
      getInfo(id, editType, params);
    });
  }

  /**
   * 获取信息
   */
  function getInfo(id: string | undefined, editType: FormEditType, params?: ExtraParams) {
    // 编辑、查看模式都需要加载数据
    if ([FormEditType.Edit, FormEditType.Show].includes(editType)) {
      confirmLoading.value = true;
      MenuApi.findById(id!).then(({ data }) => {
        form.value = data;
        originalMenuCode.value = data.menuCode || '';
        if (data.clientCode) {
          loadMenuTree(data.clientCode);
        }
        applySubpageDrawerTitle(data.menuType);
        confirmLoading.value = false;
      });
    } else {
      originalMenuCode.value = '';
      if (params?.clientCode) {
        form.value.clientCode = params.clientCode;
        loadMenuTree(params.clientCode);
      }
      if (params?.parentRow) {
        // 根据父菜单类型设置默认的子菜单类型
        let defaultMenuType: string = MenuTypeEnum.MENU;
        if (params.parentMenuType === MenuTypeEnum.MENU) {
          defaultMenuType = MenuTypeEnum.SUBPAGE;
        }
        form.value = {
          ...form.value,
          clientCode: params.clientCode,
          pid: params.parentRow.id!,
          menuType: defaultMenuType,
          path: params.parentRow.path,
        };
        applySubpageDrawerTitle(defaultMenuType);
      }
      confirmLoading.value = false;
    }
  }

  /**
   * 子页面抽屉标题
   */
  function applySubpageDrawerTitle(menuType?: string) {
    const type = menuType ?? form.value.menuType;
    if (type !== MenuTypeEnum.SUBPAGE) {
      return;
    }
    if (formEditType.value === FormEditType.Add) {
      title.value = $t('iam.menu.addSubpage');
    } else if (formEditType.value === FormEditType.Edit) {
      title.value = $t('iam.menu.editSubpage');
    } else if (formEditType.value === FormEditType.Show) {
      title.value = $t('iam.menu.viewSubpage');
    }
  }

  /**
   * 加载菜单树
   */
  function loadMenuTree(clientCode: string) {
    MenuApi.tree(clientCode).then((res: any) => {
      treeData.value = convertToTreeSelect(res.data || []);
    });
  }

  /**
   * 获取显示标题（国际化处理）
   */
  function getDisplayTitle(row: Menu): string {
    if (row.i18nKey) {
      // 国际化：根据国际化key获取显示标题
      return $t(row.i18nKey);
    }
    const locale = i18n.global.locale.value;
    if (locale === 'en-US') {
      return row.titleEn || '';
    }
    return row.titleCn || '';
  }

  /**
   * 转换为树形选择器数据
   */
  function convertToTreeSelect(data: Menu[]): any[] {
    return data.map((item) => ({
      value: item.id,
      title: getDisplayTitle(item),
      menuType: item.menuType,
      children: item.children ? convertToTreeSelect(item.children) : undefined,
    }));
  }

  /**
   * 上级菜单树搜索过滤
   */
  function filterParentTreeNode(input: string, treeNode: any) {
    const title = String(treeNode.title || '').toLowerCase();
    return title.includes(input.toLowerCase());
  }

  /**
   * 标记不可选的节点（显示完整树，但禁用不符合条件的节点）
   */
  function markDisabledNodes(nodes: any[]): any[] {
    return nodes.map((node) => ({
      ...node,
      // 子页面只能选择菜单类型，其他类型只能选择目录类型
      disabled:
        form.value.menuType === MenuTypeEnum.SUBPAGE
          ? node.menuType !== MenuTypeEnum.MENU
          : node.menuType !== MenuTypeEnum.CATALOG,
      children: node.children ? markDisabledNodes(node.children) : undefined,
    }));
  }

  /**
   * 提交
   */
  function handleOk() {
    formRef.value?.validate().then(async () => {
      confirmLoading.value = true;
      const menuCodeChanged =
        formEditType.value === FormEditType.Edit && originalMenuCode.value !== (form.value.menuCode || '');
      if (formEditType.value === FormEditType.Add) {
        await MenuApi.add(form.value).finally(() => (confirmLoading.value = false));
        message.success($t('common.saveSuccess'));
      } else if (formEditType.value === FormEditType.Edit) {
        await MenuApi.update(form.value).finally(() => (confirmLoading.value = false));
        message.success($t('common.saveSuccess'));
      }
      if (menuCodeChanged) {
        // 菜单编码已变更，权限码挂载关系将在下次同步后按新菜单编码生效
        message.warning($t('iam.menu.menuCodeChanged'));
      }
      closeDrawer();
      emits('ok');
    }).catch(() => {});
  }

  /**
   * 关闭抽屉并清空状态
   */
  function closeDrawer() {
    extraParams.value = {};
    handleCancel();
  }

  defineExpose({ init });
</script>

<template>
  <a-drawer
    :open="visible"
    :title="title"
    :size="1000"
    :styles="{ footer: { textAlign: 'right' } }"
    @close="closeDrawer"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        layout="horizontal"
        :label-col="{ style: { width: '100px' } }"
        class="grid grid-cols-2 gap-x-4 form-compact"
      >
        <!-- 第一区：基础信息 -->
        <a-form-item v-if="showMenuType" :label="$t('iam.menu.menuType')" name="menuType" class="col-span-2">
          <!-- 菜单类型 -->
          <a-radio-group v-model:value="form.menuType" button-style="solid" :disabled="menuTypeLocked">
            <a-radio-button v-for="item in availableMenuTypeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-radio-button>
          </a-radio-group>
        </a-form-item>

        <!-- 国际化：菜单编码 -->
        <a-form-item
          v-if="showMenuCode"
          :label="$t('iam.menu.menuCode')"
          name="menuCode"
          class="col-span-2 md:col-span-1"
          validate-first
        >
          <!-- 菜单编码 -->
          <a-input v-model:value="form.menuCode" :placeholder="$t('iam.menu.inputMenuCode')" :disabled="showable" />
        </a-form-item>

        <!-- 国际化：上级菜单 -->
        <a-form-item
          v-if="showParentMenu"
          :label="$t('iam.menu.parentMenu')"
          name="pid"
          class="col-span-2 md:col-span-1"
        >
          <!-- 上级菜单 -->
          <a-tree-select
            v-model:value="form.pid"
            :tree-data="parentTreeData"
            :placeholder="$t('iam.menu.selectParent')"
            :disabled="showable"
            :tree-default-expand-all="false"
            show-search
            :filter-tree-node="filterParentTreeNode"
            allow-clear
            style="width: 100%"
          />
        </a-form-item>

        <!-- 第二区：显示信息 -->
        <a-form-item :label="$t('iam.menu.titleCn')" name="titleCn" class="col-span-2 md:col-span-1">
          <!-- 标题 -->
          <a-input v-model:value="form.titleCn" :placeholder="$t('iam.menu.inputTitleCn')" :disabled="showable" />
        </a-form-item>

        <a-form-item :label="$t('iam.menu.titleEn')" name="titleEn" class="col-span-2 md:col-span-1">
          <!-- 英文标题 -->
          <a-input v-model:value="form.titleEn" :placeholder="$t('iam.menu.inputTitleEn')" :disabled="showable" />
        </a-form-item>

        <a-form-item :label="$t('iam.menu.i18nKey')" name="i18nKey" class="col-span-2 md:col-span-1">
          <!-- 国际化Key -->
          <a-input v-model:value="form.i18nKey" :placeholder="$t('iam.menu.inputI18nKey')" :disabled="showable" />
        </a-form-item>

        <a-form-item :label="$t('iam.menu.icon')" name="icon" class="col-span-2 md:col-span-1">
          <!-- 图标 -->
          <IconPicker v-model="form.icon" :disabled="showable" type="input" prefix="lucide" />
        </a-form-item>

        <!-- 第三区：路由配置 -->
        <a-form-item v-if="showPath" :label="$t('iam.menu.path')" name="path" class="col-span-2 md:col-span-1">
          <!-- 路由路径 -->
          <a-input v-model:value="form.path" :placeholder="$t('iam.menu.inputPath')" :disabled="showable" />
          <template v-if="isSubpage" #extra>{{ $t('iam.menu.subpagePathExtra') }}</template>
        </a-form-item>

        <!-- 国际化：组件 -->
        <a-form-item
          v-if="showComponent"
          :label="$t('iam.menu.component')"
          name="component"
          class="col-span-2 md:col-span-1"
        >
          <!-- 组件路径 -->
          <a-input v-model:value="form.component" :placeholder="$t('iam.menu.inputComponent')" :disabled="showable" />
          <template v-if="isSubpage" #extra>{{ $t('iam.menu.subpageComponentExtra') }}</template>
        </a-form-item>

        <!-- 国际化：内嵌页面地址 -->
        <a-form-item
          v-if="showIframeSrc"
          :label="$t('iam.menu.iframeSrc')"
          name="iframeSrc"
          class="col-span-2 md:col-span-1"
        >
          <!-- 内嵌URL -->
          <a-input v-model:value="form.iframeSrc" :placeholder="$t('iam.menu.inputIframeSrc')" :disabled="showable" />
        </a-form-item>

        <a-form-item v-if="showLink" :label="$t('iam.menu.link')" name="link" class="col-span-2 md:col-span-1">
          <!-- 外链地址 -->
          <a-input v-model:value="form.link" :placeholder="$t('iam.menu.inputLink')" :disabled="showable" />
        </a-form-item>

        <!-- 第四区：高级设置 -->
        <div class="col-span-2">
          <a-divider orientation="left" class="!my-4">{{ $t('iam.menu.advancedSettings') }}</a-divider>
          <!-- 高级设置 -->
        </div>

        <a-form-item v-if="showSortNo" :label="$t('iam.menu.sortNo')" name="sortNo" class="col-span-2 md:col-span-1">
          <!-- 排序号 -->
          <a-input-number
            v-model:value="form.sortNo"
            :precision="2"
            :placeholder="$t('iam.menu.inputSortNo')"
            :disabled="showable"
            style="width: 100%"
          />
        </a-form-item>

        <!-- 国际化：隐藏菜单 -->
        <a-form-item v-if="showHidden" :label="$t('iam.menu.hidden')" class="col-span-2 md:col-span-1">
          <!-- 是否隐藏 -->
          <a-checkbox v-model:checked="form.hidden" :disabled="showable" />
        </a-form-item>

        <!-- 国际化：隐藏子菜单 -->
        <a-form-item
          v-if="showHideChildrenMenu"
          :label="$t('iam.menu.hideChildrenMenu')"
          class="col-span-2 md:col-span-1"
        >
          <!-- 隐藏子菜单 -->
          <a-checkbox v-model:checked="form.hideChildrenMenu" :disabled="showable" />
        </a-form-item>

        <a-form-item v-if="showPageConfig" :label="$t('iam.menu.keepAlive')" class="col-span-2 md:col-span-1">
          <!-- KeepAlive缓存 -->
          <a-checkbox v-model:checked="form.keepAlive" :disabled="showable" />
        </a-form-item>

        <a-form-item v-if="showAffixTab" :label="$t('iam.menu.affixTab')" class="col-span-2 md:col-span-1">
          <!-- 固定标签页 -->
          <a-checkbox v-model:checked="form.affixTab" :disabled="showable" />
        </a-form-item>

        <!-- 国际化：请选择徽章类型 -->
        <a-form-item v-if="showBadge" :label="$t('iam.menu.badgeType')" class="col-span-2 md:col-span-1">
          <!-- 徽章类型 -->
          <a-select
            v-model:value="form.badgeType"
            :options="badgeTypeOptions"
            :disabled="showable"
            allow-clear
            style="width: 100%"
            :placeholder="$t('iam.menu.selectBadgeType')"
          />
        </a-form-item>

        <!-- 国际化：徽章样式 -->
        <!-- 国际化：请选择徽章样式 -->
        <a-form-item v-if="showBadge" :label="$t('iam.menu.badgeVariants')" class="col-span-2 md:col-span-1">
          <!-- 徽章样式 -->
          <!-- 国际化：请选择徽章样式 -->
          <a-select
            v-model:value="form.badgeVariants"
            :options="badgeVariantsOptions"
            :disabled="showable"
            allow-clear
            style="width: 100%"
            :placeholder="$t('iam.menu.selectBadgeVariants')"
          />
        </a-form-item>

        <!-- 国际化：徽章文本 -->
        <a-form-item
          v-if="showBadge && form.badgeType === 'normal'"
          :label="$t('iam.menu.badge')"
          class="col-span-2 md:col-span-1"
        >
          <!-- 徽章内容 -->
          <a-input v-model:value="form.badge" :placeholder="$t('iam.menu.inputBadge')" :disabled="showable" />
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button @click="closeDrawer">{{ $t('common.cancelText') }}</a-button>
        <a-button v-if="!showable" type="primary" :loading="confirmLoading" @click="handleOk">{{
          $t('common.okText')
        }}</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
