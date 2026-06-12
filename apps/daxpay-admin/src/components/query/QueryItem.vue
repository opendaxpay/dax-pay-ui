<script lang="ts" setup>
  import type { QueryField } from './query';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { BOOLEAN, DATE, DATE_RANGE, DATE_TIME, DATE_TIME_RANGE, LIST, NUMBER, STRING, TIME } from './query';

  const props = withDefaults(
    defineProps<{
      field: QueryField;
      md?: number;
      queryParams: Record<string, any>;
    }>(),
    {
      md: 6,
    },
  );

  const emits = defineEmits<{
    enterQuery: [];
  }>();

  const isRangeType = computed(() => {
    return props.field.type === DATE_RANGE || props.field.type === DATE_TIME_RANGE;
  });

  const rangeValue = computed({
    get: () => {
      if (!isRangeType.value || !props.field.startField || !props.field.endField) {
        return undefined;
      }
      const start = props.queryParams[props.field.startField];
      const end = props.queryParams[props.field.endField];
      if (start && end) {
        return [start, end];
      }
      return undefined;
    },
    set: (val) => {
      if (!isRangeType.value || !props.field.startField || !props.field.endField) {
        return;
      }
      if (val && Array.isArray(val) && val.length === 2) {
        props.queryParams[props.field.startField]! = val[0];
        props.queryParams[props.field.endField]! = val[1];
      } else {
        props.queryParams[props.field.startField]! = undefined;
        props.queryParams[props.field.endField]! = undefined;
      }
    },
  });

  function getRangePlaceholder(): [string, string] {
    const placeholder = props.field.placeholder;
    if (Array.isArray(placeholder)) {
      return placeholder;
    }
    if (typeof placeholder === 'string') {
      return [placeholder, placeholder];
    }
    // 国际化：时间范围占位符
    return [$t('components.query.startTime'), $t('components.query.endTime')];
  }

  function handleRangeChange(val: any) {
    rangeValue.value = val;
  }

  // 国际化：日期范围快捷选项
  const dateRangeShortcuts = [
    {
      label: $t('components.query.today'),
      value: () => {
        const today = new Date();
        const todayStr = formatDate(today);
        return [todayStr, todayStr];
      },
    },
    {
      // 国际化：昨天
      label: $t('components.query.yesterday'),
      value: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDate(yesterday);
        return [yesterdayStr, yesterdayStr];
      },
    },
    {
      // 国际化：近7天
      label: $t('components.query.last7Days'),
      value: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return [formatDate(start), formatDate(end)];
      },
    },
    {
      // 国际化：近30天
      label: $t('components.query.last30Days'),
      value: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return [formatDate(start), formatDate(end)];
      },
    },
    {
      // 国际化：本月
      label: $t('components.query.thisMonth'),
      value: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return [formatDate(start), formatDate(end)];
      },
    },
    {
      // 国际化：上月
      label: $t('components.query.lastMonth'),
      value: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return [formatDate(start), formatDate(end)];
      },
    },
  ];

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function query() {
    emits('enterQuery');
  }
</script>

<template>
  <a-col :md="field.md || md" :sm="24">
    <!-- 国际化：请输入查询值 -->
    <!-- 国际化：请输入查询值 -->
    <a-form-item :label="field.name">
      <!-- 国际化：输入框占位符 -->
      <a-input
        v-if="field.type === STRING"
        v-model:value="queryParams[field.field!]!"
        allow-clear
        :placeholder="field.placeholder || $t('components.query.inputQueryValue')"
        @keyup.enter="query"
      />
      <!-- 国际化：数字输入框占位符 -->
      <!-- 国际化：请输入查询值 -->
      <a-input-number
        v-else-if="field.type === NUMBER"
        v-model:value="queryParams[field.field!]!"
        allow-clear
        style="width: 100%"
        :precision="field.precision ?? 0"
        :placeholder="field.placeholder || $t('components.query.inputQueryValue')"
      />
      <a-radio-group v-else-if="field.type === BOOLEAN" v-model:value="queryParams[field.field!]!">
        <a-radio :value="true">{{ $t('common.yes') }}</a-radio>
        <a-radio :value="false">{{ $t('common.no') }}</a-radio>
      </a-radio-group>
      <!-- 国际化：下拉选择框占位符 -->
      <a-select
        v-else-if="field.type === LIST"
        v-model:value="queryParams[field.field!]!"
        allow-clear
        :placeholder="field.placeholder || $t('components.query.selectQueryValue')"
        :options="field.selectList || []"
      />
      <!-- 国际化：日期选择器占位符 -->
      <!-- 国际化：请选择日期 -->
      <a-date-picker
        v-else-if="field.type === DATE"
        v-model:value="queryParams[field.field!]!"
        allow-clear
        style="width: 100%"
        :placeholder="field.placeholder || $t('components.query.selectDate')"
        :value-format="field.format || 'YYYY-MM-DD'"
      />
      <!-- 国际化：时间选择器占位符 -->
      <!-- 国际化：请选择时间 -->
      <a-time-picker
        v-else-if="field.type === TIME"
        v-model:value="queryParams[field.field!]!"
        allow-clear
        style="width: 100%"
        :placeholder="field.placeholder || $t('components.query.selectTime')"
        :value-format="field.format || 'HH:mm:ss'"
      />
      <!-- 国际化：日期时间选择器占位符 -->
      <!-- 国际化：请选择日期时间 -->
      <a-date-picker
        v-else-if="field.type === DATE_TIME"
        v-model:value="queryParams[field.field!]!"
        allow-clear
        show-time
        style="width: 100%"
        :placeholder="field.placeholder || $t('components.query.selectDateTime')"
        :value-format="field.format || 'YYYY-MM-DD HH:mm:ss'"
      />
      <a-range-picker
        v-else-if="field.type === DATE_RANGE"
        v-model:value="rangeValue"
        allow-clear
        style="width: 100%"
        :value-format="field.format || 'YYYY-MM-DD'"
        :placeholder="getRangePlaceholder()"
        :shortcuts="field.shortcuts ? dateRangeShortcuts : undefined"
        @change="handleRangeChange"
      />
      <a-range-picker
        v-else-if="field.type === DATE_TIME_RANGE"
        v-model:value="rangeValue"
        allow-clear
        show-time
        style="width: 100%"
        :value-format="field.format || 'YYYY-MM-DD HH:mm:ss'"
        :placeholder="getRangePlaceholder()"
        @change="handleRangeChange"
      />
      <!-- 国际化：默认输入框占位符 -->
      <a-input
        v-else
        v-model:value="queryParams[field.field!]!"
        allow-clear
        :placeholder="field.placeholder || $t('components.query.inputQueryValue')"
        @keyup.enter="query"
      />
    </a-form-item>
  </a-col>
</template>

<style scoped></style>
