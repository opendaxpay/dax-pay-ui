<script lang="ts" setup>
import type { SetupContext } from 'vue';

import type { Recordable } from '@vben/types';

import type {
  JsonViewerAction,
  JsonViewerProps,
  JsonViewerToggle,
  JsonViewerValue,
} from './types';

import { computed, useAttrs } from 'vue';
// @ts-expect-error - vue-json-viewer does not expose compatible typings for this import path
import VueJsonViewerRaw from 'vue-json-viewer';

import { $t } from '@vben/locales';

import { isBoolean } from '@vben-core/shared/utils';

import JsonBigint from 'json-bigint';

defineOptions({ name: 'JsonViewer' });

const props = withDefaults(defineProps<JsonViewerProps>(), {
  expandDepth: 1,
  copyable: false,
  sort: false,
  boxed: false,
  theme: 'default-json-theme',
  expanded: false,
  previewMode: false,
  showArrayIndex: true,
  showDoubleQuotes: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
  copied: [event: JsonViewerAction];
  keyClick: [key: string];
  toggle: [param: JsonViewerToggle];
  valueClick: [value: JsonViewerValue];
}>();

// vue-json-viewer@3.0.4 是 webpack4 UMD 老包, Vite/esbuild 预构建后 default 导出是
// { default: Component, __esModule: true } 命名空间对象, 真组件挂在 .default 上
// 直接渲染整个命名空间对象会触发 "Component is missing template or render function"
const VueJsonViewer = (VueJsonViewerRaw as any).default || VueJsonViewerRaw;

const attrs: SetupContext['attrs'] = useAttrs();

function handleClick(event: MouseEvent) {
  if (
    event.target instanceof HTMLElement &&
    event.target.classList.contains('jv-item')
  ) {
    const pathNode = event.target.closest('.jv-push');
    if (!pathNode || !pathNode.hasAttribute('path')) {
      return;
    }
    const param: JsonViewerValue = {
      el: event.target,
      path: pathNode.getAttribute('path') || '',
      depth: Number(pathNode.getAttribute('depth')) || 0,
      value: event.target.textContent || undefined,
    };

    param.value = JSON.parse(param.value);
    emit('valueClick', param);
  }
  emit('click', event);
}

/**
 * 递归将对象转换为带 Object.prototype 原型的普通对象 {}
 * 修复: json-bigint 解析返回 Object.create(null) 对象 (无原型链),
 * 与 vue-json-viewer 内部 this.ordered.hasOwnProperty(o) 直接调用冲突,
 * 报 "obj.hasOwnProperty is not a function"
 */
function deepToPlain<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepToPlain(item)) as unknown as T;
  }
  const plain: Record<string, any> = {};
  for (const key of Object.keys(value)) {
    plain[key] = deepToPlain((value as Record<string, any>)[key]);
  }
  return plain as unknown as T;
}

// 支持显示 bigint 数据，如较长的订单号
const jsonData = computed<Record<string, any>>(() => {
  if (typeof props.value !== 'string') {
    return props.value ? deepToPlain(props.value) : {};
  }

  try {
    const parsed = JsonBigint({ storeAsString: true }).parse(props.value);
    return deepToPlain(parsed);
  } catch (error) {
    console.error('JSON parse error:', error);
    return {};
  }
});

const bindProps = computed<Recordable<any>>(() => {
  const copyable = {
    copyText: $t('ui.jsonViewer.copy'),
    copiedText: $t('ui.jsonViewer.copied'),
    timeout: 2000,
    ...(isBoolean(props.copyable) ? {} : props.copyable),
  };

  return {
    ...props,
    ...attrs,
    value: jsonData.value,
    onCopied: (event: JsonViewerAction) => emit('copied', event),
    onKeyclick: (key: string) => emit('keyClick', key),
    onClick: (event: MouseEvent) => handleClick(event),
    copyable: props.copyable ? copyable : false,
  };
});
</script>
<template>
  <VueJsonViewer v-bind="bindProps">
    <template #copy="slotProps">
      <slot name="copy" v-bind="slotProps"></slot>
    </template>
  </VueJsonViewer>
</template>
<style lang="scss">
@use './style.scss';
</style>
