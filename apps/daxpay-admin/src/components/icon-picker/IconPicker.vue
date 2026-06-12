<script setup lang="ts">
  import { computed, ref, watch, watchEffect } from 'vue';

  import { EmptyIcon, listIcons } from '@vben/icons';
  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { refDebounced, watchDebounced } from '@vueuse/core';

  import { fetchIconsData } from './icons';

  interface Props {
    pageSize?: number;
    pageSizeOptions?: number[];
    prefix?: string;
    autoFetchApi?: boolean;
    icons?: string[];
    type?: 'icon' | 'input';
    disabled?: boolean;
  }

  defineOptions({
    inheritAttrs: false,
  });

  const props = withDefaults(defineProps<Props>(), {
    prefix: 'ant-design',
    pageSize: 70,
    pageSizeOptions: () => [70, 130, 200, 300],
    icons: () => [],
    autoFetchApi: true,
    type: 'input',
    disabled: false,
  });

  const emit = defineEmits<{
    change: [string];
  }>();

  const modelValue = defineModel<string>({ default: '' });

  const defaultPreviewIcon = 'ant-design:appstore-outlined';

  const open = ref(false);
  const loading = ref(false);
  const currentSelect = ref('');
  const keyword = ref('');
  const keywordDebounced = refDebounced(keyword, 300);
  const innerIcons = ref<string[]>([]);
  const currentPage = ref(1);
  const currentPageSize = ref(props.pageSize);

  const mergedIcons = computed(() => {
    if (!props.prefix) {
      return props.icons;
    }
    if (props.prefix !== 'svg' && props.autoFetchApi && props.icons.length === 0) {
      return innerIcons.value;
    }
    return listIcons('', props.prefix);
  });

  const filteredIcons = computed(() => {
    const searchText = keywordDebounced.value.trim();
    if (!searchText) {
      return mergedIcons.value;
    }
    return mergedIcons.value.filter((item) => item.includes(searchText));
  });

  const total = computed(() => filteredIcons.value.length);
  const normalizedPageSizeOptions = computed(() => {
    const options = new Set([...props.pageSizeOptions, props.pageSize]);
    return [...options].filter((item) => item > 0).toSorted((a, b) => a - b);
  });
  const startIndex = computed(() => (currentPage.value - 1) * currentPageSize.value);
  const pagedIcons = computed(() => {
    return filteredIcons.value.slice(startIndex.value, startIndex.value + currentPageSize.value);
  });

  watch(
    () => props.pageSize,
    (value) => {
      currentPageSize.value = value;
    },
    { immediate: true },
  );

  watchDebounced(
    () => props.prefix,
    async (prefix) => {
      if (prefix && prefix !== 'svg' && props.autoFetchApi && props.icons.length === 0) {
        loading.value = true;
        innerIcons.value = await fetchIconsData(prefix);
        loading.value = false;
        return;
      }
      innerIcons.value = [];
      loading.value = false;
    },
    { immediate: true, debounce: 500, maxWait: 1000 },
  );

  watch(
    () => props.icons,
    () => {
      currentPage.value = 1;
    },
  );

  watch(
    () => filteredIcons.value.length,
    () => {
      currentPage.value = 1;
    },
  );

  watchEffect(() => {
    currentSelect.value = modelValue.value || '';
  });

  watch(
    () => currentSelect.value,
    (value) => {
      emit('change', value);
    },
  );

  function handleSelect(icon: string) {
    currentSelect.value = icon;
    modelValue.value = icon;
    open.value = false;
  }

  function handleInputChange(value: string) {
    currentSelect.value = value;
    modelValue.value = value;
  }

  function handlePageChange(page: number, pageSize?: number) {
    currentPage.value = page;
    if (pageSize) {
      currentPageSize.value = pageSize;
    }
  }

  function handlePageSizeChange(_current: number, size: number) {
    currentPage.value = 1;
    currentPageSize.value = size;
  }

  function handleOpenChange(value: boolean) {
    if (props.disabled) {
      return;
    }
    open.value = value;
    if (!value) {
      keyword.value = '';
    }
  }

  function getPopupContainer(node: HTMLElement): HTMLElement {
    return node.parentElement || node;
  }

  function toggleOpenState() {
    open.value = !open.value;
  }

  function showPopover() {
    open.value = true;
  }

  function hidePopover() {
  open.value = false;
  keyword.value = '';
}

  defineExpose({
    close: hidePopover,
    open: showPopover,
    toggleOpenState,
  });
</script>

<template>
  <a-popover
    :get-popup-container="getPopupContainer"
    :open="open"
    :disabled="disabled"
    overlay-class-name="icon-picker-popover"
    placement="bottomRight"
    trigger="click"
    @update:open="handleOpenChange"
  >
    <template #content>
      <div class="icon-picker-panel">
        <!-- 国际化：图标搜索输入框占位文案 -->
        <a-input
          v-model:value="keyword"
          allow-clear
          class="icon-picker-search"
          :placeholder="$t('components.icon-picker.search')"
        />
        <div v-if="loading" class="icon-picker-loading">
          <a-spin />
        </div>
        <template v-else>
          <div v-if="pagedIcons.length > 0" class="icon-picker-grid">
            <button
              v-for="icon in pagedIcons"
              :key="icon"
              class="icon-picker-item"
              type="button"
              :class="{ 'icon-picker-item-active': currentSelect === icon }"
              :title="icon"
              @click="handleSelect(icon)"
            >
              <IconifyIcon :icon="icon" class="icon-picker-item-icon" />
            </button>
          </div>
          <div v-else class="icon-picker-empty">
            <EmptyIcon class="icon-picker-empty-icon" />
            <!-- 国际化：图标列表空状态 -->
            <div class="icon-picker-empty-text">{{ $t('components.icon-picker.noData') }}</div>
          </div>
          <div v-if="total > currentPageSize" class="icon-picker-pagination">
            <a-pagination
              :current="currentPage"
              :page-size="currentPageSize"
              :page-size-options="normalizedPageSizeOptions.map((item) => String(item))"
              :show-size-changer="true"
              :total="total"
              size="small"
              @change="handlePageChange"
              @show-size-change="handlePageSizeChange"
            />
          </div>
        </template>
      </div>
    </template>

    <template v-if="type === 'input'">
      <!-- 国际化：选择一个图标 -->
      <div class="icon-picker-trigger" :class="{ 'icon-picker-disabled': disabled }">
        <!-- 国际化：选择一个图标 -->
        <a-input
          v-bind="$attrs"
          :value="currentSelect"
          :disabled="disabled"
          class="icon-picker-input"
          :placeholder="$t('components.icon-picker.placeholder')"
          @change="(event: any) => handleInputChange(event.target.value)"
        >
          <template #suffix>
            <IconifyIcon v-if="currentSelect" :icon="currentSelect" class="icon-picker-preview" />
            <IconifyIcon v-else :icon="defaultPreviewIcon" class="icon-picker-preview" />
          </template>
        </a-input>
      </div>
    </template>
    <button v-else class="icon-picker-icon-trigger" type="button" :disabled="disabled" @click.stop="toggleOpenState">
      <IconifyIcon v-if="currentSelect" :icon="currentSelect" class="icon-picker-preview" />
      <IconifyIcon v-else :icon="defaultPreviewIcon" class="icon-picker-preview" />
    </button>
  </a-popover>
</template>

<style lang="less" scoped>
  .icon-picker-panel {
    width: 360px;
  }

  .icon-picker-search {
    margin-bottom: 8px;
  }

  .icon-picker-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 220px;
  }

  .icon-picker-grid {
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: 2px;
    max-height: 280px;
    overflow-y: auto;
  }

  .icon-picker-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .icon-picker-item:hover,
  .icon-picker-item-active {
    color: var(--ant-color-primary);
    background-color: var(--ant-color-primary-bg);
  }

  .icon-picker-item-icon {
    font-size: 20px;
  }

  .icon-picker-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 220px;
    color: rgb(0 0 0 / 45%);
  }

  .icon-picker-empty-icon {
    width: 40px;
    height: 40px;
  }

  .icon-picker-empty-text {
    margin-top: 8px;
    font-size: 14px;
  }

  .icon-picker-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .icon-picker-trigger,
  .icon-picker-input {
    width: 100%;
  }

  .icon-picker-disabled {
    cursor: not-allowed;
  }

  .icon-picker-disabled .icon-picker-input {
    cursor: not-allowed;
  }

  .icon-picker-preview {
    font-size: 18px;
  }

  .icon-picker-icon-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    cursor: pointer;
    background: transparent;
    border: none;
  }

  .icon-picker-icon-trigger:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .dark {
    .icon-picker-empty {
      color: rgb(255 255 255 / 45%);
    }
  }
</style>
