<script lang="ts" setup>
  import type { RuleNodeResult } from '#/api/risk/model.api';

  import { computed, onMounted, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { LookupTableApi, RuleNodeApi } from '#/api/risk/model.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    modelId: string;
    selectedId?: string;
    strategyNodeId: string;
  }>();

  const emit = defineEmits<{
    select: [ruleNode: RuleNodeResult];
    'update:selectedId': [id: string];
  }>();
  const { message, confirm } = useMessage();
  const { hasPermission } = usePermission();

  const {
    confirmLoading: ruleNodeConfirmLoading,
    formEditType: ruleNodeEditType,
    initFormEditType: initRuleNodeEditType,
  } = useFormEdit();

  const loading = ref(false);
  const ruleNodeList = ref<RuleNodeResult[]>([]);
  const lookupTableOptions = ref<{ label: string; value: string }[]>([]);
  const ruleNodeEditVisible = ref(false);
  const ruleNodeFormRef = ref();
  const ruleNodeFormState = ref({
    id: undefined as string | undefined,
    strategyNodeId: '',
    nodeId: '',
    nodeName: '',
    sortNo: 0,
    type: 'DECISION',
    outputVariable: '',
    entryAggregation: '',
    lookupTableId: undefined as string | undefined,
  });

  const ruleTypeOptions = computed(() => [
    { label: $t('risk.ruleNode.base.ruleType.decision'), value: 'DECISION' },
    { label: $t('risk.ruleNode.base.ruleType.number'), value: 'NUMBER' },
    { label: $t('risk.ruleNode.base.ruleType.scorecard'), value: 'SCORECARD' },
    { label: $t('risk.ruleNode.base.ruleType.lookup'), value: 'LOOKUP' },
  ]);

  const aggregationOptions = computed(() => [
    { label: $t('risk.ruleNode.base.aggregation.first'), value: 'FIRST' },
    { label: $t('risk.ruleNode.base.aggregation.sum'), value: 'SUM' },
    { label: $t('risk.ruleNode.base.aggregation.max'), value: 'MAX' },
    { label: $t('risk.ruleNode.base.aggregation.min'), value: 'MIN' },
    { label: $t('risk.ruleNode.base.aggregation.avg'), value: 'AVG' },
  ]);

  const ruleNodeFormRules = computed(() => ({
    nodeName: [{ required: true, message: $t('risk.ruleNode.form.add.nodeNamePlaceholder') }],
    type: [{ required: true, message: $t('risk.ruleNode.form.add.typePlaceholder') }],
    sortNo: [{ required: true, message: $t('risk.ruleNode.form.add.sortNoPlaceholder') }],
  }));

  onMounted(() => {
    queryLookupTables();
  });

  watch(
    () => props.strategyNodeId,
    (val) => {
      if (val) {
        queryRuleNodeList();
      }
    },
    { immediate: true },
  );

  /** 查询查表定义下拉 */
  function queryLookupTables() {
    if (!props.modelId) {
      return;
    }
    LookupTableApi.listByModelId(props.modelId).then((res: any) => {
      const list = res.data || [];
      lookupTableOptions.value = list.map((item: any) => ({
        label: item.name || item.code,
        value: item.id,
      }));
    });
  }

  /** 查询规则节点列表 */
  function queryRuleNodeList() {
    loading.value = true;
    RuleNodeApi.listByStrategyNodeId(props.strategyNodeId)
      .then((res: any) => {
        ruleNodeList.value = res.data || [];
        syncSelection();
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 同步选中�?*/
  function syncSelection() {
    if (ruleNodeList.value.length === 0) {
      emit('update:selectedId', '');
      return;
    }
    const current = ruleNodeList.value.find((item) => item.id === props.selectedId);
    const target = current || ruleNodeList.value[0]!;
    emit('update:selectedId', target.id!);
    emit('select', target);
  }

  /** 选中规则节点 */
  function handleSelect(row: RuleNodeResult) {
    emit('update:selectedId', row.id!);
    emit('select', row);
  }

  /** 新增规则节点 */
  function handleAddRuleNode() {
    initRuleNodeEditType(FormEditType.Add);
    ruleNodeFormState.value = {
      id: undefined,
      strategyNodeId: props.strategyNodeId,
      nodeId: '',
      nodeName: '',
      sortNo: ruleNodeList.value.length,
      type: 'DECISION',
      outputVariable: '',
      entryAggregation: '',
      lookupTableId: undefined,
    };
    ruleNodeEditVisible.value = true;
  }

  /** 编辑规则节点 */
  function handleEditRuleNode(row: RuleNodeResult, event: Event) {
    event.stopPropagation();
    initRuleNodeEditType(FormEditType.Edit);
    ruleNodeFormRef.value?.resetFields();
    ruleNodeFormState.value = {
      id: row.id!,
      strategyNodeId: props.strategyNodeId,
      nodeId: row.nodeId || '',
      nodeName: row.nodeName || '',
      sortNo: row.sortNo ?? 0,
      type: row.type || 'DECISION',
      outputVariable: row.outputVariable || '',
      entryAggregation: row.entryAggregation || '',
      lookupTableId: row.lookupTableId || undefined,
    };
    ruleNodeEditVisible.value = true;
  }

  /** 规则节点提交 */
  async function handleRuleNodeOk() {
    await ruleNodeFormRef.value?.validate();
    ruleNodeConfirmLoading.value = true;
    try {
      const params = { ...ruleNodeFormState.value };
      await (ruleNodeEditType.value === FormEditType.Edit
        ? RuleNodeApi.update(params as any)
        : RuleNodeApi.add(params as any));
      message.success($t('common.success'));
      ruleNodeEditVisible.value = false;
      queryRuleNodeList();
    } finally {
      ruleNodeConfirmLoading.value = false;
    }
  }

  /** 删除规则节点 */
  function handleDeleteRuleNode(row: RuleNodeResult, event: Event) {
    event.stopPropagation();
    confirm({
      content: $t('risk.ruleNode.base.action.confirmDelete'),
      onOk: () => {
        RuleNodeApi.delete(row.id!).then(() => {
          message.success($t('common.success'));
          queryRuleNodeList();
        });
      },
    });
  }

  /** 规则类型标签文案 */
  function getRuleTypeLabel(type?: string) {
    if (!type) {
      return '';
    }
    const key = `risk.ruleNode.base.ruleType.${type.toLowerCase()}`;
    return $t(key) || type;
  }
</script>

<template>
  <div class="rule-node-sidebar">
    <div class="mb-3 flex items-center justify-between">
      <span class="font-bold">{{ $t('risk.strategyNode.studio.ruleNodeList') }}</span>
      <a-button
        v-if="hasPermission(PermCodes.Risk.ModelManage.StrategyRule.ADD)"
        type="primary"
        size="small"
        @click="handleAddRuleNode"
      >
        {{ $t('common.add') }}
      </a-button>
    </div>

    <a-spin :spinning="loading">
      <div v-if="ruleNodeList.length > 0" class="rule-node-list">
        <div
          v-for="row in ruleNodeList"
          :key="row.id"
          class="rule-node-item"
          :class="{ 'rule-node-item--active': row.id === selectedId }"
          @click="handleSelect(row)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium">{{ row.nodeName }}</div>
              <div class="mt-1 flex items-center gap-2">
                <span class="text-xs text-muted-foreground">#{{ row.sortNo }}</span>
                <a-tag color="blue" class="text-xs">{{ getRuleTypeLabel(row.type) }}</a-tag>
              </div>
            </div>
            <a-space :size="0" @click.stop>
              <a-button type="link" size="small" @click="handleEditRuleNode(row, $event)">{{
                $t('common.edit')
              }}</a-button>
              <a-button type="link" size="small" danger @click="handleDeleteRuleNode(row, $event)">{{
                $t('common.delete')
              }}</a-button>
            </a-space>
          </div>
        </div>
      </div>
      <a-empty v-else :description="$t('risk.ruleEntry.base.empty')" />
    </a-spin>

    <a-modal
      :open="ruleNodeEditVisible"
      :title="ruleNodeEditType === FormEditType.Add ? $t('common.add') : $t('common.edit')"
      :width="520"
      :confirm-loading="ruleNodeConfirmLoading"
      :mask-closable="false"
      :focusable="{ trap: false }"
      @ok="handleRuleNodeOk"
      @cancel="ruleNodeEditVisible = false"
    >
      <a-form
        ref="ruleNodeFormRef"
        :model="ruleNodeFormState"
        :rules="ruleNodeFormRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="mt-4 form-compact"
      >
        <a-form-item :label="$t('risk.ruleNode.base.field.nodeName')" name="nodeName">
          <a-input
            v-model:value="ruleNodeFormState.nodeName"
            :placeholder="$t('risk.ruleNode.form.add.nodeNamePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('risk.ruleNode.base.field.type')" name="type">
          <a-select
            v-model:value="ruleNodeFormState.type"
            :options="ruleTypeOptions"
            :placeholder="$t('risk.ruleNode.form.add.typePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('risk.ruleNode.base.field.sortNo')" name="sortNo">
          <a-input-number v-model:value="ruleNodeFormState.sortNo" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item
          v-if="ruleNodeFormState.type === 'NUMBER'"
          :label="$t('risk.ruleNode.base.field.outputVariable')"
          name="outputVariable"
        >
          <a-input
            v-model:value="ruleNodeFormState.outputVariable"
            :placeholder="$t('risk.ruleNode.form.add.outputVariablePlaceholder')"
          />
        </a-form-item>
        <a-form-item
          v-if="ruleNodeFormState.type === 'NUMBER'"
          :label="$t('risk.ruleNode.base.field.entryAggregation')"
          name="entryAggregation"
        >
          <a-select
            v-model:value="ruleNodeFormState.entryAggregation"
            :options="aggregationOptions"
            :placeholder="$t('risk.ruleNode.form.add.entryAggregationPlaceholder')"
            allow-clear
          />
        </a-form-item>
        <a-form-item
          v-if="ruleNodeFormState.type === 'LOOKUP'"
          :label="$t('risk.ruleNode.base.field.lookupTable')"
          name="lookupTableId"
        >
          <a-select
            v-model:value="ruleNodeFormState.lookupTableId"
            :options="lookupTableOptions"
            :placeholder="$t('risk.ruleNode.form.add.lookupTablePlaceholder')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
  .rule-node-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .rule-node-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
  }

  .rule-node-item {
    padding: 12px;
    cursor: pointer;
    border: 1px solid hsl(var(--border));
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .rule-node-item:hover {
    border-color: hsl(var(--primary) / 40%);
  }

  .rule-node-item--active {
    background: hsl(var(--primary) / 8%);
    border-color: hsl(var(--primary) / 50%);
  }
</style>
