<script lang="ts" setup>
  import type { ChannelMchOption } from '#/types/web';

  import { computed } from 'vue';

  import { ChannelLogo } from '@daxpay/ui-biz/channel';

  /**
   * 通道商户下拉选择
   *
   * - 选项数据由调用方通过 `options` 传入(类型 [ChannelMchOption], 含 product/channel 字段)
   * - 下拉项与选中态都会渲染支付产品图标(通过 [ChannelLogo] 派生)
   * - 当多个通道商户名重复时, 图标可辅助区分
   */
  const props = withDefaults(
    defineProps<{
      allowClear?: boolean;
      disabled?: boolean;
      /** 通道商户候选, 携带 product/channel 用于显示图标 */
      options?: ChannelMchOption[];
      placeholder?: string;
      /** 自定义下拉尺寸的 class */
      rootClassName?: string;
      /** 是否启用搜索(默认开启) */
      showSearch?: boolean;
      /** 当前选中的通道商户号 */
      value?: string;
    }>(),
    {
      value: '',
      options: () => [],
      placeholder: '',
      disabled: false,
      allowClear: true,
      showSearch: true,
      rootClassName: '',
    },
  );

  const emit = defineEmits<{
    (e: 'update:value', val: string | undefined): void;
    (e: 'change', val: string | undefined, option?: ChannelMchOption): void;
  }>();

  const innerOptions = computed(() => props.options);

  // 选中态根据 value 查回 option 拿 product/channel 渲染图标
  const selectedOption = computed<ChannelMchOption | undefined>(() =>
    innerOptions.value.find((o) => o.value === props.value),
  );

  function onChange(val: string | undefined, option: ChannelMchOption | undefined) {
    emit('update:value', val);
    emit('change', val, option);
  }
</script>

<template>
  <a-select
    :value="value"
    :options="innerOptions"
    :placeholder="placeholder"
    :disabled="disabled"
    :allow-clear="allowClear"
    :show-search="showSearch"
    :class="rootClassName"
    option-filter-prop="label"
    option-label-prop="label"
    @change="onChange"
  >
    <template #optionRender="{ option }">
      <div class="flex items-center gap-2">
        <!-- 支付产品图标(优先产品级, 回退到通道级) -->
        <ChannelLogo
          :product="(option.data as ChannelMchOption).product"
          :channel="(option.data as ChannelMchOption).channel"
          :size="18"
        />
        <span>{{ option.data.label }}</span>
      </div>
    </template>
    <template #labelRender>
      <div class="inline-flex items-center gap-1">
        <ChannelLogo
          v-if="selectedOption"
          :product="selectedOption.product"
          :channel="selectedOption.channel"
          :size="14"
        />
        <span>{{ selectedOption?.label ?? value }}</span>
      </div>
    </template>
  </a-select>
</template>
