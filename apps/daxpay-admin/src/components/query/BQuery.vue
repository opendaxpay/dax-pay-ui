<script lang="ts" setup>
  import type { QueryField } from './query';

  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import QueryItem from './QueryItem.vue';

  withDefaults(
    defineProps<{
      defaultItemCount?: number;
      defaultItemMd?: number;
      disabledQuery?: boolean;
      fields: QueryField[];
      gutter?: number;
      queryParams: Record<string, any>;
    }>(),
    {
      defaultItemCount: 2,
      defaultItemMd: 6,
      disabledQuery: false,
      gutter: 10,
    },
  );

  const emits = defineEmits<{
    query: [];
    reset: [];
  }>();

  const toggleSearchStatus = ref(false);

  function query() {
    emits('query');
  }

  function reset() {
    emits('reset');
  }

  function handleToggleSearch() {
    toggleSearchStatus.value = !toggleSearchStatus.value;
  }
</script>

<template>
  <a-form class="page-query">
    <a-row :gutter="[gutter, 8]">
      <QueryItem
        v-for="(field, i) in fields"
        :key="i"
        v-show="i < defaultItemCount! || toggleSearchStatus"
        :field="field"
        :md="defaultItemMd"
        :query-params="queryParams"
        @enter-query="query"
      />
      <a-col :md="defaultItemMd" :sm="24">
        <a-space>
          <!-- 国际化：查询按钮 -->
          <a-button type="primary" :disabled="disabledQuery" @click="query">
            {{ $t('components.query.query') }}
          </a-button>
          <!-- 国际化：重置按钮 -->
          <a-button @click="reset">
            {{ $t('components.query.reset') }}
          </a-button>
        </a-space>
        <!-- 国际化：展开/收起 -->
        <a v-show="fields.length > defaultItemCount!" style="margin-left: 8px" @click="handleToggleSearch">
          {{ toggleSearchStatus ? $t('components.query.collapse') : $t('components.query.expand') }}
          <IconifyIcon v-if="toggleSearchStatus" icon="ant-design:up-outlined" class="inline" />
          <IconifyIcon v-else icon="ant-design:down-outlined" class="inline" />
        </a>
      </a-col>
    </a-row>
  </a-form>
</template>

<style lang="less" scoped></style>
