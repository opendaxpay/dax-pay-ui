<script lang="ts" setup>
  import type { QuickEntryMeta } from './catalog';

  import { computed, ref, watch } from 'vue';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  import draggable from 'vuedraggable';

  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useQuickEntryStore } from '#/store/quick-entry';

  import { DEFAULT_ENTRIES, getAvailableEntries, resolveEntries } from './catalog';

  defineOptions({ name: 'QuickEntryEditDrawer' });

  const props = defineProps<{ open: boolean }>();
  const emit = defineEmits<{
    saved: [];
    'update:open': [value: boolean];
  }>();

  const quickEntryStore = useQuickEntryStore();
  const { hasPermission } = usePermission();
  const { confirm, message } = useMessage();

  // 本地编辑副本：已选入口(对象数组，供拖拽排序)
  const selectedItems = ref<QuickEntryMeta[]>([]);

  // 抽屉打开时从 store 同步本地副本
  watch(
    () => props.open,
    (open) => {
      if (open) {
        selectedItems.value = resolveEntries(quickEntryStore.entries ?? DEFAULT_ENTRIES);
      }
    },
    { immediate: true },
  );

  // 可选池：有权限且尚未选中的入口
  const availableEntries = computed(() => {
    const all = getAvailableEntries(hasPermission);
    return all.filter((e) => !selectedItems.value.some((s) => s.key === e.key));
  });

  /** 追加入口到已选末尾 */
  function addEntry(entry: QuickEntryMeta) {
    if (!selectedItems.value.some((s) => s.key === entry.key)) {
      selectedItems.value.push(entry);
    }
  }

  /** 从已选移除 */
  function removeEntry(key: string) {
    selectedItems.value = selectedItems.value.filter((s) => s.key !== key);
  }

  /** 上移 */
  function moveUp(index: number) {
    if (index <= 0) {
      return;
    }
    const arr = [...selectedItems.value];
    [arr[index - 1]!, arr[index]!] = [arr[index]!, arr[index - 1]!];
    selectedItems.value = arr;
  }

  /** 下移 */
  function moveDown(index: number) {
    if (index >= selectedItems.value.length - 1) {
      return;
    }
    const arr = [...selectedItems.value];
    [arr[index + 1]!, arr[index]!] = [arr[index]!, arr[index + 1]!];
    selectedItems.value = arr;
  }

  /** 保存(整体覆盖) */
  async function handleSave() {
    await quickEntryStore.save(selectedItems.value.map((e) => e.key));
    message.success($t('common.saveSuccess'));
    emit('saved');
    emit('update:open', false);
  }

  /** 撤销本次编辑，从后端重新加载恢复到已保存状态 */
  async function handleUndo() {
    const confirmed = await confirm({
      title: $t('common.confirmUndo'),
      content: $t('common.confirmUndoContent'),
    });
    if (!confirmed) return;
    // 强制从后端重新加载，回到上次保存的状态
    await quickEntryStore.load(true);
    selectedItems.value = resolveEntries(quickEntryStore.entries ?? DEFAULT_ENTRIES);
  }

  /** 关闭抽屉 */
  function handleClose() {
    emit('update:open', false);
  }
</script>

<template>
  <a-drawer
    :open="open"
    :title="$t('dashboard.workspace.quickEntry.editTitle')"
    size="420"
    :destroy-on-hidden="true"
    @close="handleClose"
  >
    <div class="flex flex-col gap-6">
      <!-- 已选区：拖拽排序 -->
      <div>
        <div class="text-foreground mb-2 text-sm font-medium">
          {{ $t('dashboard.workspace.quickEntry.selected') }}
        </div>
        <draggable
          v-model="selectedItems"
          item-key="key"
          handle=".drag-handle"
          :animation="200"
          ghost-class="opacity-50"
        >
          <template #item="{ element, index }">
            <div class="hover:bg-accent mb-2 flex items-center gap-2 rounded-md border p-2">
              <div class="text-muted-foreground drag-handle cursor-move px-1">
                <IconifyIcon icon="lucide:grip-vertical" class="size-4" />
              </div>
              <div :class="element.color" class="text-background flex size-7 items-center justify-center rounded">
                <IconifyIcon :icon="element.icon" class="size-4" />
              </div>
              <span class="flex-1 text-sm">{{ $t(element.titleKey) }}</span>
              <a-button type="text" size="small" :disabled="index === 0" @click="moveUp(index)">
                <IconifyIcon icon="lucide:arrow-up" class="size-4" />
              </a-button>
              <a-button
                type="text"
                size="small"
                :disabled="index === selectedItems.length - 1"
                @click="moveDown(index)"
              >
                <IconifyIcon icon="lucide:arrow-down" class="size-4" />
              </a-button>
              <a-button type="link" size="small" danger @click="removeEntry(element.key)">
                <IconifyIcon icon="lucide:x" class="size-4" />
              </a-button>
            </div>
          </template>
        </draggable>
        <a-empty v-if="selectedItems.length === 0" :description="$t('dashboard.workspace.quickEntry.empty')" />
      </div>

      <!-- 可选池：点击追加 -->
      <div>
        <div class="text-foreground mb-2 text-sm font-medium">
          {{ $t('dashboard.workspace.quickEntry.available') }}
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="entry in availableEntries"
            :key="entry.key"
            class="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border p-2"
            @click="addEntry(entry)"
          >
            <div :class="entry.color" class="text-background flex size-7 items-center justify-center rounded">
              <IconifyIcon :icon="entry.icon" class="size-4" />
            </div>
            <span class="flex-1 text-sm">{{ $t(entry.titleKey) }}</span>
            <IconifyIcon icon="lucide:plus" class="text-muted-foreground size-4" />
          </div>
        </div>
        <a-empty v-if="availableEntries.length === 0" :description="$t('dashboard.workspace.quickEntry.allAdded')" />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <a-button @click="handleUndo">
          {{ $t('common.undoEdit') }}
        </a-button>
        <div class="flex gap-2">
          <a-button @click="handleClose">{{ $t('common.cancel') }}</a-button>
          <a-button type="primary" @click="handleSave">
            {{ $t('common.save') }}
          </a-button>
        </div>
      </div>
    </template>
  </a-drawer>
</template>
