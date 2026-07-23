<script lang="ts" setup>
  import type { SupportedLanguagesType } from '@vben/locales';

  import { computed, ref, unref, watch } from 'vue';

  import { createIconifyIcon } from '@vben/icons';
  import { $t, i18n } from '@vben/locales';
  import { useTimezoneStore } from '@vben/stores';

  import { buildTimezoneOptions, type TimezoneOptionItem } from '#/utils/timezone';

  // 世界时钟图标
  const TimezoneIcon = createIconifyIcon('fluent-mdl2:world-clock');

  const timezoneStore = useTimezoneStore();

  // 弹窗开关
  const open = ref(false);
  // 弹窗内临时选中值, 确认前与 store 隔离, 避免误选立即生效
  const tempValue = ref<string | undefined>();

  // 打开弹窗时初始化临时值为当前时区
  watch(open, (val) => {
    if (val) {
      tempValue.value = unref(timezoneStore.timezone);
    }
  });

  // 确认: 写入 store 并关闭 (确认生效, 与原 RadioGroup 交互一致)
  function handleOk() {
    const val = unref(tempValue);
    if (val) {
      timezoneStore.setTimezone(val);
    }
    open.value = false;
  }

  // 当前语言, 切换语言时选项的长时区名与区域标题自动重算
  const currentLocale = computed(() => i18n.global.locale.value as SupportedLanguagesType);

  // 分组选项: 按区域聚合, 区域标题走 i18n
  // 每个 option 携带 city/longName/offset 额外字段, 供自定义搜索使用
  const groupedOptions = computed(() => {
    return buildTimezoneOptions(currentLocale.value).map((group) => ({
      label: $t(`timezone.region.${group.region}`),
      options: group.options,
    }));
  });

  // 自定义搜索: 同时匹配城市 / 本地化长名 / 偏移 / IANA 标识
  function filterOption(input: string, option: Record<string, any>) {
    const keyword = input.trim().toLowerCase();
    if (!keyword) {
      return true;
    }
    const item = option as TimezoneOptionItem;
    return (
      item.city?.toLowerCase().includes(keyword) ||
      item.longName?.toLowerCase().includes(keyword) ||
      item.offset?.toLowerCase().includes(keyword) ||
      item.value?.toLowerCase().includes(keyword) ||
      item.label?.toLowerCase().includes(keyword)
    );
  }
</script>

<template>
  <a-tooltip :title="$t('timezone.current')">
    <a-button type="text" shape="circle" size="small" @click="open = true">
      <TimezoneIcon class="size-4 text-foreground" />
    </a-button>
  </a-tooltip>
  <a-modal
    v-model:open="open"
    :title="$t('timezone.current')"
    :width="380"
    :ok-text="$t('common.ok')"
    :cancel-text="$t('common.cancel')"
    @ok="handleOk"
  >
    <a-select
      v-model:value="tempValue"
      show-search
      :options="groupedOptions"
      :filter-option="filterOption"
      :placeholder="$t('timezone.searchPlaceholder')"
      style="width: 100%"
    />
  </a-modal>
</template>
