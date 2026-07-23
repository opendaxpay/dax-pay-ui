<script lang="ts" setup>
  import type { Region } from '#/api/core/region.api';

  import { computed, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { ChinaRegionApi } from '#/api/core/region.api';

  const props = withDefaults(
    defineProps<{
      allowClear?: boolean;
      disabled?: boolean;
      level?: 2 | 3 | 4;
      modelValue?: string | string[];
      placeholder?: string;
      showSearch?: boolean;
      valueMode?: 'array' | 'last';
    }>(),
    {
      allowClear: true,
      disabled: false,
      level: 3,
      modelValue: undefined,
      placeholder: undefined,
      showSearch: true,
      valueMode: 'last',
    },
  );

  const emits = defineEmits<{
    'update:modelValue': [value: string | string[] | undefined];
  }>();

  // 国际化占位符
  const computedPlaceholder = computed(() => {
    return props.placeholder || $t('system.region.placeholder');
  });

  /**
   * 根据区划代码获取完整路径数组
   * @param code 区划代码
   * @returns 完整路径数组
   */
  function getRegionPath(code: string): string[] {
    const len = code.length;
    switch (len) {
      case 2: {
        return [code];
      }
      case 4: {
        return [code.slice(0, 2), code];
      }
      case 6: {
        return [code.slice(0, 2), code.slice(0, 4), code];
      }
      case 9: {
        return [code.slice(0, 2), code.slice(0, 4), code.slice(0, 6), code];
      }
      // No default
    }
    return [];
  }

  const fieldNames = {
    label: 'name',
    value: 'code',
    children: 'children',
  };

  const options = ref<Region[]>([]);
  const innerValue = ref<string[]>([]);
  const loading = ref(false);

  const levelConfig = computed(() => {
    const configs = {
      2: { api: ChinaRegionApi.findAllProvinceAndCity, maxLevel: 2 },
      3: { api: ChinaRegionApi.findAllProvinceAndCityAndArea, maxLevel: 3 },
      4: { api: ChinaRegionApi.findAllProvinceAndCityAndArea, maxLevel: 4 },
    } as const;
    return configs[props.level];
  });

  async function loadData() {
    loading.value = true;
    const { data } = await levelConfig.value.api();
    options.value = data;
    loading.value = false;
  }

  function handleChange(value: string[]) {
    if (!value || value.length === 0) {
      emits('update:modelValue', props.valueMode === 'array' ? [] : undefined);
      return;
    }

    if (props.valueMode === 'last') {
      emits('update:modelValue', value[value.length - 1]);
    } else {
      emits('update:modelValue', value);
    }
  }

  function syncInnerValue() {
    if (!props.modelValue) {
      innerValue.value = [];
      return;
    }

    if (props.valueMode === 'last' && typeof props.modelValue === 'string') {
      innerValue.value = getRegionPath(props.modelValue);
    } else if (Array.isArray(props.modelValue)) {
      innerValue.value = props.modelValue;
    } else {
      innerValue.value = [];
    }
  }

  watch(
    () => props.modelValue,
    () => {
      syncInnerValue();
    },
  );

  watch(
    () => props.level,
    () => {
      loadData();
    },
  );

  onMounted(() => {
    loadData();
    syncInnerValue();
  });
</script>

<template>
  <a-cascader
    v-model:value="innerValue"
    :allow-clear="allowClear"
    :disabled="disabled"
    :field-names="fieldNames"
    :loading="loading"
    :options="options"
    :placeholder="computedPlaceholder"
    :show-search="showSearch"
    change-on-select
    @change="handleChange"
  />
</template>
