<script lang="ts" setup>
  import type { LookupTableResult, RuleNodeResult } from '#/api/risk/model.api';

  import { ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { LookupTableApi } from '#/api/risk/model.api';

  const props = defineProps<{
    ruleNode: RuleNodeResult | null;
  }>();

  const loading = ref(false);
  const lookupTable = ref<LookupTableResult | null>(null);

  watch(
    () => props.ruleNode?.lookupTableId,
    (lookupTableId) => {
      if (lookupTableId) {
        loadLookupTable(lookupTableId);
      } else {
        lookupTable.value = null;
      }
    },
    { immediate: true },
  );

  /** 加载查表定义 */
  function loadLookupTable(id: string) {
    loading.value = true;
    LookupTableApi.findById(id)
      .then(({ data }) => {
        lookupTable.value = data || null;
      })
      .finally(() => {
        loading.value = false;
      });
  }
</script>

<template>
  <div>
    <div class="mb-4">
      <span class="font-bold">{{ $t('risk.lookup.base.field.name') }}</span>
      <span v-if="ruleNode?.nodeName" class="ml-2 text-sm text-muted-foreground">- {{ ruleNode.nodeName }}</span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">{{ $t('risk.strategyNode.studio.lookupReadonlyHint') }}</p>

    <a-spin :spinning="loading">
      <a-descriptions v-if="lookupTable" bordered :column="1" size="small">
        <a-descriptions-item :label="$t('risk.lookup.base.field.tableCode')">{{
          lookupTable.code
        }}</a-descriptions-item>
        <a-descriptions-item :label="$t('risk.lookup.base.field.name')">{{ lookupTable.name }}</a-descriptions-item>
        <a-descriptions-item :label="$t('risk.lookup.base.field.description')">{{
          lookupTable.description || '-'
        }}</a-descriptions-item>
      </a-descriptions>
      <a-empty v-else :description="$t('risk.ruleEntry.base.empty')" />
    </a-spin>
  </div>
</template>
