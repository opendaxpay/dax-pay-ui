<script lang="ts" setup>
  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  /**
   * 应用级配置页顶部：应用选择器条
   */
  defineProps<{
    /** 下拉选项 */
    options: { label: string; value: string }[];
    /** 当前 appId */
    value: string;
    /** 加载中 */
    loading?: boolean;
    /** 禁用 */
    disabled?: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:value', val: string): void;
    (e: 'change', val: string): void;
  }>();

  function onChange(val: string) {
    emit('update:value', val);
    emit('change', val);
  }
</script>

<template>
  <div class="mb-4 flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <IconifyIcon icon="ant-design:appstore-outlined" class="text-base" />
      <!-- 国际化：当前应用 -->
      <span>{{ $t('payment.merchant.app.app.currentApp') }}</span>
    </div>
    <a-select
      :value="value"
      :options="options"
      :loading="loading"
      :disabled="disabled || !options.length"
      :placeholder="$t('payment.merchant.app.app.selectApp')"
      class="min-w-[220px]"
      show-search
      option-filter-prop="label"
      @change="onChange"
    />
  </div>
</template>
