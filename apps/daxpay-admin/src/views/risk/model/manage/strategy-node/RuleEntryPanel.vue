<script lang="ts" setup>
  import type { RuleEntryParam, RuleEntryResult, RuleNodeResult } from '#/api/risk/model.api';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { RuleEntryApi } from '#/api/risk/model.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    ruleNode: RuleNodeResult | null;
  }>();

  const emit = defineEmits(['ok']);
  const { message, confirm } = useMessage();
  const { hasPermission } = usePermission();

  // 策略规则新增权限
  const entryList = ref<RuleEntryResult[]>([]);
  const entryEditVisible = ref(false);
  const entryFormRef = ref();
  const entryFormState = ref<RuleEntryParam>({
    ruleNodeId: '',
    seq: 0,
    conditionExpr: '',
    resultValue: '',
    isExpression: false,
    outputVariable: '',
  });

  const entryFormRules = computed(() => ({
    conditionExpr: [{ required: true, message: $t('risk.ruleEntry.form.add.conditionExprPlaceholder') }],
    resultValue: [{ required: true, message: $t('risk.ruleEntry.form.add.resultValuePlaceholder') }],
    seq: [{ required: true, message: $t('risk.ruleEntry.form.add.seqPlaceholder') }],
  }));

  const decisionResultOptions = [
    { label: 'PASS', value: 'PASS' },
    { label: 'REJECT', value: 'REJECT' },
    { label: 'CHALLENGE', value: 'CHALLENGE' },
  ];

  const ruleNodeType = computed(() => props.ruleNode?.type || 'DECISION');
  const ruleNodeName = computed(() => props.ruleNode?.nodeName || '');

  watch(
    () => props.ruleNode?.id,
    (id) => {
      if (id) {
        queryEntryList();
      } else {
        entryList.value = [];
      }
    },
    { immediate: true },
  );

  /** 查询规则条目列表 */
  function queryEntryList() {
    if (!props.ruleNode?.id) {
      return;
    }
    RuleEntryApi.listByRuleNodeId(props.ruleNode.id).then((res: any) => {
      entryList.value = res.data || [];
    });
  }

  /** 新增规则条目 */
  function handleAddEntry() {
    entryFormState.value = {
      ruleNodeId: props.ruleNode?.id || '',
      seq: entryList.value.length,
      conditionExpr: '',
      resultValue: '',
      isExpression: false,
      outputVariable: '',
    };
    entryEditVisible.value = true;
  }

  /** 编辑规则条目 */
  function handleEditEntry(row: RuleEntryResult) {
    entryFormRef.value?.resetFields();
    entryFormState.value = {
      id: row.id!,
      ruleNodeId: props.ruleNode?.id || '',
      seq: row.seq ?? 0,
      conditionExpr: row.conditionExpr || '',
      resultValue: row.resultValue || '',
      isExpression: row.isExpression ?? false,
      outputVariable: row.outputVariable || '',
    };
    entryEditVisible.value = true;
  }

  /** 规则条目提交 */
  async function handleEntryOk() {
    await entryFormRef.value?.validate();
    const params = { ...entryFormState.value };
    await (params.id ? RuleEntryApi.update(params) : RuleEntryApi.add(params));
    message.success($t('common.success'));
    entryEditVisible.value = false;
    queryEntryList();
    emit('ok');
  }

  /** 删除规则条目 */
  function handleDeleteEntry(row: RuleEntryResult) {
    confirm({
      content: $t('risk.ruleEntry.base.action.confirmDelete'),
      onOk: () => {
        RuleEntryApi.delete(row.id!).then(() => {
          message.success($t('common.success'));
          queryEntryList();
        });
      },
    });
  }
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <div>
        <span class="font-bold">{{ $t('risk.ruleEntry.base.field.title') }}</span>
        <span v-if="ruleNodeName" class="ml-2 text-sm text-muted-foreground">- {{ ruleNodeName }}</span>
      </div>
      <a-button
        v-if="hasPermission(PermCodes.Risk.ModelManage.StrategyRule.ADD)"
        type="primary"
        size="small"
        @click="handleAddEntry"
      >
        {{ $t('common.add') }}
      </a-button>
    </div>

    <vxe-table
      v-if="entryList.length > 0"
      :row-config="{ keyField: 'id', isHover: true }"
      :data="entryList"
      size="mini"
    >
      <vxe-column field="seq" :title="$t('risk.ruleEntry.base.field.seq')" :min-width="60" align="center" />
      <vxe-column field="conditionExpr" :title="$t('risk.ruleEntry.base.field.conditionExpr')" />
      <vxe-column field="resultValue" :title="$t('risk.ruleEntry.base.field.resultValue')" :min-width="120" />
      <vxe-column
        field="isExpression"
        :title="$t('risk.ruleEntry.base.field.isExpression')"
        :min-width="80"
        align="center"
      >
        <template #default="{ row }">
          <a-tag v-if="row.isExpression" color="orange">{{ $t('common.yes') }}</a-tag>
          <a-tag v-else>{{ $t('common.no') }}</a-tag>
        </template>
      </vxe-column>
      <vxe-column fixed="right" :title="$t('common.operation')" width="120" align="center" :show-overflow="false">
        <template #default="{ row }">
          <a-space :size="2">
            <template #separator>
              <a-divider type="vertical" />
            </template>
            <a-button type="link" size="small" @click="handleEditEntry(row)">{{ $t('common.edit') }}</a-button>
            <a-button type="link" size="small" danger @click="handleDeleteEntry(row)">{{
              $t('common.delete')
            }}</a-button>
          </a-space>
        </template>
      </vxe-column>
    </vxe-table>

    <a-empty v-else :description="$t('risk.ruleEntry.base.empty')" />

    <a-modal
      :open="entryEditVisible"
      :title="entryFormState.id ? $t('common.edit') : $t('common.add')"
      :width="520"
      :mask-closable="false"
      :focusable="{ trap: false }"
      @ok="handleEntryOk"
      @cancel="entryEditVisible = false"
    >
      <a-form
        ref="entryFormRef"
        :model="entryFormState"
        :rules="entryFormRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="mt-4 form-compact"
      >
        <a-form-item :label="$t('risk.ruleEntry.base.field.seq')" name="seq">
          <a-input-number v-model:value="entryFormState.seq" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="$t('risk.ruleEntry.base.field.conditionExpr')" name="conditionExpr">
          <a-textarea
            v-model:value="entryFormState.conditionExpr"
            :placeholder="$t('risk.ruleEntry.form.add.conditionExprPlaceholder')"
            :rows="2"
          />
        </a-form-item>
        <a-form-item
          v-if="ruleNodeType === 'DECISION'"
          :label="$t('risk.ruleEntry.base.field.resultValue')"
          name="resultValue"
        >
          <a-select
            v-model:value="entryFormState.resultValue"
            :options="decisionResultOptions"
            :placeholder="$t('risk.ruleEntry.form.add.resultValuePlaceholder')"
          />
        </a-form-item>
        <a-form-item v-else :label="$t('risk.ruleEntry.base.field.resultValue')" name="resultValue">
          <a-input
            v-model:value="entryFormState.resultValue"
            :placeholder="$t('risk.ruleEntry.form.add.resultValuePlaceholder')"
          />
        </a-form-item>
        <a-form-item
          v-if="ruleNodeType === 'NUMBER'"
          :label="$t('risk.ruleEntry.base.field.isExpression')"
          name="isExpression"
        >
          <a-switch v-model:checked="entryFormState.isExpression" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
