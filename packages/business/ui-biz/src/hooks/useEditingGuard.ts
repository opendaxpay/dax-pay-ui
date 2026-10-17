import type { Ref } from 'vue';

import { computed, ref } from 'vue';

import { $t } from '@vben/locales';

import { useMessage } from './useMessage';

/**
 * 配置页分组级编辑态与切换守卫(行为对齐分组级编辑隔离范式, 与 useQueryTab 配套使用)
 *
 * 统一收敛两类旧形态: 页面级编辑布尔(全 tab 共享, 任一分组进入编辑后所有分组都是
 * 编辑态)与子组件各自编辑态但切分组静默丢弃(无确认)。本 hook 保证同一时刻仅一个
 * 分组处于编辑态, 编辑中切换分组先弹「放弃未保存的修改」确认, 确认后丢弃修改、
 * 回填已保存配置再切换。
 *
 * 两种接入形态:
 * - 分组级(状态提升在父容器): 不传 isEditing, 编辑态由 hook 内 editingKey 管理,
 *   适用于多分组编辑同一份共享配置的形态
 * - 子组件级(编辑态在各子组件内经 defineExpose 透出): 传 isEditing 取值函数,
 *   适用于内容区 v-if 切换的形态(PlatformConfig 族), 切分组即销毁子组件,
 *   丢弃无需回填, onDiscard 可省略
 */
export function useEditingGuard<T extends string = string>(
  activeKey: Ref<T>,
  options?: {
    isEditing?: () => boolean;
    onDiscard?: () => Promise<void> | void;
  },
) {
  const { confirm } = useMessage();

  // 编辑状态(分组级: 编辑态绑定进入编辑时的分组 key, 子组件型不使用)
  const editingKey = ref<null | string>(null);

  // 当前分组是否处于编辑态(分组级要求 editingKey 与激活分组一致, 切走即退出编辑态)
  const isEditing = computed(() => {
    if (options?.isEditing) {
      return options.isEditing();
    }
    return editingKey.value !== null && editingKey.value === activeKey.value;
  });

  /**
   * 进入编辑模式(编辑态绑定在当前分组)
   */
  function startEdit() {
    editingKey.value = activeKey.value;
  }

  /**
   * 退出编辑模式(不清数据, 取消/保存场景的回填由调用方自行处理)
   */
  function stopEdit() {
    editingKey.value = null;
  }

  /**
   * 带守卫的分组切换: 点击当前分组直接放行; 有分组处于编辑态时先确认放弃,
   * 确认后丢弃修改、回填再切换, 取消则留在当前分组继续编辑
   *
   * @param key 目标分组 key
   * @param change 实际切换动作(useQueryTab 的 handleTabChange 或页面内赋值)
   */
  function guardTabChange(key: T, change: (key: T) => void) {
    if (key === activeKey.value || !isEditing.value) {
      change(key);
      return;
    }
    confirm({
      title: $t('common.editGuardTitle'),
      content: $t('common.editGuardContent'),
      okText: $t('common.editGuardOkText'),
      cancelText: $t('common.editGuardCancelText'),
      onOk: async () => {
        editingKey.value = null;
        await options?.onDiscard?.();
        change(key);
      },
    });
  }

  return { editingKey, isEditing, startEdit, stopEdit, guardTabChange };
}
