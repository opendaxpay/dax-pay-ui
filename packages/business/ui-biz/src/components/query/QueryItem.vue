<script lang="ts" setup>
  import type { RangePickerProps } from 'antdv-next';

  import type { QueryField } from './query';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import dayjs from 'dayjs';

  import { BOOLEAN, DATE, DATE_RANGE, DATE_TIME, DATE_TIME_RANGE, LIST, NUMBER, NUMBER_RANGE, STRING, TIME } from './query';

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
    return [$t('components.query.startTime'), $t('components.query.endTime')];
  }

  function handleRangeChange(val: any) {
    rangeValue.value = val;
  }

  // 数字范围占位符(按下标取最小/最大)
  function getNumberRangePlaceholder(index: number): string {
    const placeholder = props.field.placeholder;
    if (Array.isArray(placeholder)) {
      return placeholder[index] ?? '';
    }
    if (typeof placeholder === 'string') {
      return placeholder;
    }
    return $t('components.query.inputQueryValue');
  }

  // 范围选择器的预设快捷范围(默认开启, 字段配置 shortcuts 传 false 可单独关闭)
  // value 用函数返回 dayjs, 每次点击实时计算; 结束边统一取当天 23:59:59,
  // 避免带时分秒的 date_time_range 类型点预设后漏掉结束当天的数据
  const dateRangePresets: RangePickerProps['presets'] = [
    // 今天
    {
      label: $t('components.query.today'),
      value: () => [dayjs().startOf('day'), dayjs().endOf('day')],
    },
    // 昨天
    {
      label: $t('components.query.yesterday'),
      value: () => [
        dayjs().subtract(1, 'day').startOf('day'),
        dayjs().subtract(1, 'day').endOf('day'),
      ],
    },
    // 近 7 天(含今天)
    {
      label: $t('components.query.last7Days'),
      value: () => [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')],
    },
    // 近 30 天(含今天)
    {
      label: $t('components.query.last30Days'),
      value: () => [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')],
    },
    // 本月
    {
      label: $t('components.query.thisMonth'),
      value: () => [dayjs().startOf('month'), dayjs().endOf('month')],
    },
    // 上月
    {
      label: $t('components.query.lastMonth'),
      value: () => [
        dayjs().subtract(1, 'month').startOf('month'),
        dayjs().subtract(1, 'month').endOf('month'),
      ],
    },
  ];

  // 预设快捷范围默认开启, 字段配置显式传 false 时才关闭
  function getRangePresets() {
    return props.field.shortcuts === false ? undefined : dateRangePresets;
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
      <!-- 数字范围(最小~最大), 双值同步到 startField/endField, 支持单边填写 -->
      <div v-else-if="field.type === NUMBER_RANGE" class="number-range">
        <a-input-number
          v-model:value="queryParams[field.startField!]!"
          allow-clear
          class="number-range-item"
          :precision="field.precision ?? 0"
          :placeholder="getNumberRangePlaceholder(0)"
          @keyup.enter="query"
        />
        <span class="number-range-sep">~</span>
        <a-input-number
          v-model:value="queryParams[field.endField!]!"
          allow-clear
          class="number-range-item"
          :precision="field.precision ?? 0"
          :placeholder="getNumberRangePlaceholder(1)"
          @keyup.enter="query"
        />
      </div>
      <a-radio-group v-else-if="field.type === BOOLEAN" v-model:value="queryParams[field.field!]!" button-style="solid">
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
        :presets="getRangePresets()"
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
        :presets="getRangePresets()"
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

<style scoped>
  .number-range {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 4px;
  }

  .number-range-item {
    flex: 1;
    min-width: 0;
  }

  .number-range-sep {
    flex: none;
    color: rgb(0 0 0 / 45%);
  }
</style>
