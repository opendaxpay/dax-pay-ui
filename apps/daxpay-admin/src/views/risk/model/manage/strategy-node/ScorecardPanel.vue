<script lang="ts" setup>
  import type {
    ScorecardDimensionResult,
    ScorecardDimensionParam,
    ScorecardEntryItem,
    ScorecardMappingResult,
    ScorecardMappingItem,
    RuleNodeResult,
  } from '#/api/risk/model.api';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { ScorecardApi } from '#/api/risk/model.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    ruleNode: RuleNodeResult | null;
  }>();

  const emit = defineEmits(['ok']);
  const { message, confirm } = useMessage();
  const { hasPermission } = usePermission();

  // 模型管理编辑权限
  const loading = ref(false);
  const dimensionList = ref<ScorecardDimensionResult[]>([]);
  const mappingList = ref<ScorecardMappingResult[]>([]);
  const activeDimensionId = ref<string>('');

  const ruleNodeName = computed(() => props.ruleNode?.nodeName || '');
  const activeDimension = computed(() => dimensionList.value.find((d) => String(d.id) === activeDimensionId.value));

  const dimensionEditVisible = ref(false);
  const dimensionEditType = ref<'add' | 'edit'>('add');
  const dimensionFormRef = ref();
  const dimensionFormState = ref<ScorecardDimensionParam>({
    ruleNodeId: '',
    name: '',
    sortNo: 0,
    entries: [],
  });
  const dimensionFormRules = computed(() => ({
    name: [{ required: true, message: $t('risk.scorecard.form.add.dimensionNamePlaceholder') }],
  }));

  const entryEditVisible = ref(false);
  const entryFormRef = ref();
  const entryFormState = ref<ScorecardEntryItem>({
    dimensionId: '',
    seq: 0,
    conditionExpr: '',
    score: '',
    isExpression: false,
  });
  const entryFormRules = computed(() => ({
    conditionExpr: [{ required: true, message: $t('risk.scorecard.form.add.conditionExprPlaceholder') }],
    score: [{ required: true, message: $t('risk.scorecard.form.add.scorePlaceholder') }],
  }));

  const mappingEditVisible = ref(false);
  const mappingEditType = ref<'add' | 'edit'>('add');
  const mappingFormRef = ref();
  const mappingFormState = ref<ScorecardMappingItem>({
    ruleNodeId: '',
    minScoreExpr: '',
    isExpression: false,
    grade: '',
    decision: '',
    isDefault: false,
    sortNo: 0,
  });
  const mappingFormRules = computed(() => ({
    minScoreExpr: [{ required: true, message: $t('risk.scorecard.form.add.minScoreExprPlaceholder') }],
    grade: [{ required: true, message: $t('risk.scorecard.form.add.gradePlaceholder') }],
    decision: [{ required: true, message: $t('risk.scorecard.form.add.decisionPlaceholder') }],
  }));

  const decisionOptions = [
    { label: 'PASS', value: 'PASS' },
    { label: 'REJECT', value: 'REJECT' },
    { label: 'CHALLENGE', value: 'CHALLENGE' },
  ];

  watch(
    () => props.ruleNode?.id,
    (id) => {
      activeDimensionId.value = '';
      dimensionList.value = [];
      mappingList.value = [];
      if (id) {
        queryDimensions();
        queryMappings();
      }
    },
    { immediate: true },
  );

  function queryDimensions() {
    if (!props.ruleNode?.id) {
      return;
    }
    loading.value = true;
    ScorecardApi.listDimensionsByRuleNodeId(String(props.ruleNode.id))
      .then((res: any) => {
        dimensionList.value = res.data || [];
        if (dimensionList.value.length > 0) {
          activeDimensionId.value = String(dimensionList.value[0]!.id);
        }
      })
      .finally(() => {
        loading.value = false;
      });
  }

  function queryMappings() {
    if (!props.ruleNode?.id) {
      return;
    }
    ScorecardApi.listMappingsByRuleNodeId(String(props.ruleNode.id)).then((res: any) => {
      mappingList.value = res.data || [];
    });
  }

  function handleSelectDimension(id: string) {
    activeDimensionId.value = id;
  }

  function handleAddEntry() {
    entryFormState.value = {
      dimensionId: dimensionFormState.value.id || '',
      seq: (dimensionFormState.value.entries || []).length,
      conditionExpr: '',
      score: '',
      isExpression: false,
    };
    entryEditVisible.value = true;
  }

  async function handleEntryOk() {
    await entryFormRef.value?.validate();
    if (!dimensionFormState.value.entries) {
      dimensionFormState.value.entries = [];
    }
    dimensionFormState.value.entries.push({ ...entryFormState.value });
    entryEditVisible.value = false;
  }

  function handleDeleteEntry(index: number) {
    dimensionFormState.value.entries?.splice(index, 1);
  }

  function handleAddDimension() {
    dimensionEditType.value = 'add';
    dimensionFormState.value = {
      ruleNodeId: String(props.ruleNode?.id || ''),
      name: '',
      sortNo: dimensionList.value.length,
      entries: [],
    };
    dimensionEditVisible.value = true;
  }

  function handleEditDimension(dim: ScorecardDimensionResult) {
    dimensionEditType.value = 'edit';
    dimensionFormRef.value?.resetFields();
    dimensionFormState.value = {
      id: String(dim.id),
      ruleNodeId: String(props.ruleNode?.id || ''),
      name: dim.name || '',
      sortNo: dim.sortNo ?? 0,
      entries: (dim.entries || []).map((e) => ({
        id: String(e.id),
        dimensionId: String(dim.id),
        seq: e.seq ?? 0,
        conditionExpr: e.conditionExpr || '',
        score: e.score || '',
        isExpression: e.isExpression ?? false,
      })),
    };
    dimensionEditVisible.value = true;
  }

  async function handleDimensionOk() {
    await dimensionFormRef.value?.validate();
    if (dimensionEditType.value === 'add') {
      await ScorecardApi.addDimension(dimensionFormState.value);
    } else {
      await ScorecardApi.updateDimension(dimensionFormState.value);
    }
    message.success($t('common.success'));
    dimensionEditVisible.value = false;
    queryDimensions();
    emit('ok');
  }

  function handleDeleteDimension(dim: ScorecardDimensionResult) {
    confirm({
      content: $t('risk.scorecard.base.action.confirmDeleteDimension'),
      onOk: () => {
        ScorecardApi.deleteDimension(String(dim.id)).then(() => {
          message.success($t('common.success'));
          if (activeDimensionId.value === String(dim.id)) {
            activeDimensionId.value =
              dimensionList.value.length > 1
                ? String(dimensionList.value.find((d) => String(d.id) !== String(dim.id))?.id || '')
                : '';
          }
          queryDimensions();
          emit('ok');
        });
      },
    });
  }

  function handleAddMapping() {
    mappingEditType.value = 'add';
    mappingFormState.value = {
      ruleNodeId: String(props.ruleNode?.id || ''),
      minScoreExpr: '',
      isExpression: false,
      grade: '',
      decision: '',
      isDefault: false,
      sortNo: mappingList.value.length,
    };
    mappingEditVisible.value = true;
  }

  function handleEditMapping(row: ScorecardMappingResult) {
    mappingEditType.value = 'edit';
    mappingFormRef.value?.resetFields();
    mappingFormState.value = {
      id: String(row.id),
      ruleNodeId: String(props.ruleNode?.id || ''),
      minScoreExpr: row.minScoreExpr || '',
      isExpression: row.isExpression ?? false,
      grade: row.grade || '',
      decision: row.decision || '',
      isDefault: row.isDefault ?? false,
      sortNo: row.sortNo ?? 0,
    };
    mappingEditVisible.value = true;
  }

  async function handleMappingOk() {
    await mappingFormRef.value?.validate();
    if (mappingEditType.value === 'add') {
      await ScorecardApi.addMapping(mappingFormState.value);
    } else {
      await ScorecardApi.updateMapping(mappingFormState.value);
    }
    message.success($t('common.success'));
    mappingEditVisible.value = false;
    queryMappings();
    emit('ok');
  }

  function handleDeleteMapping(row: ScorecardMappingResult) {
    confirm({
      content: $t('risk.scorecard.base.action.confirmDeleteMapping'),
      onOk: () => {
        ScorecardApi.deleteMapping(String(row.id)).then(() => {
          message.success($t('common.success'));
          queryMappings();
        });
      },
    });
  }
</script>

<template>
  <div>
    <div class="mb-4">
      <span class="font-bold">{{ $t('risk.scorecard.base.field.title') }}</span>
      <span v-if="ruleNodeName" class="ml-2 text-sm text-muted-foreground">- {{ ruleNodeName }}</span>
    </div>

    <a-spin :spinning="loading">
      <div class="mb-6">
        <div class="mb-2 flex items-center justify-between">
          <span class="font-bold">{{ $t('risk.scorecard.base.field.dimension') }}</span>
          <a-button
            v-if="hasPermission(PermCodes.Risk.ModelManage.EDIT)"
            type="primary"
            size="small"
            @click="handleAddDimension"
          >
            {{ $t('common.add') }}
          </a-button>
        </div>

        <div v-if="dimensionList.length > 0" class="flex gap-4">
          <div class="min-w-[160px] max-w-[220px] shrink-0 flex-[0_0_200px]">
            <div
              v-for="dim in dimensionList"
              :key="dim.id"
              class="cursor-pointer rounded px-3 py-2 mb-1 transition-colors"
              :class="
                String(dim.id) === activeDimensionId ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/50'
              "
              @click="handleSelectDimension(String(dim.id!))"
            >
              <div class="flex items-center justify-between gap-1 min-w-0">
                <span class="min-w-0 flex-1 truncate text-sm">{{ dim.name }}</span>
                <a-space :size="2">
                  <template #separator>
                    <a-divider type="vertical" />
                  </template>
                  <a-button type="link" size="small" @click.stop="handleEditDimension(dim)">{{
                    $t('common.edit')
                  }}</a-button>
                  <a-button type="link" size="small" danger @click.stop="handleDeleteDimension(dim)">{{
                    $t('common.delete')
                  }}</a-button>
                </a-space>
              </div>
            </div>
          </div>

          <div v-if="activeDimension" class="min-w-0 flex-1">
            <div class="mb-2 text-sm font-medium"
              >{{ $t('risk.scorecard.base.field.entry') }} - {{ activeDimension.name }}</div
            >
            <vxe-table
              :row-config="{ keyField: 'id', isHover: true }"
              :data="activeDimension.entries || []"
              size="mini"
            >
              <vxe-column
                field="seq"
                :title="$t('risk.scorecard.base.field.entrySeq')"
                :min-width="60"
                align="center"
              />
              <vxe-column field="conditionExpr" :title="$t('risk.scorecard.base.field.entryConditionExpr')" />
              <vxe-column field="score" :title="$t('risk.scorecard.base.field.entryScore')" :min-width="100" />
              <vxe-column
                field="isExpression"
                :title="$t('risk.scorecard.base.field.entryIsExpression')"
                :min-width="80"
                align="center"
              >
                <template #default="{ row }">
                  <a-tag v-if="row.isExpression" color="orange">{{ $t('common.yes') }}</a-tag>
                  <a-tag v-else>{{ $t('common.no') }}</a-tag>
                </template>
              </vxe-column>
            </vxe-table>
            <div
              v-if="!activeDimension.entries || activeDimension.entries.length === 0"
              class="text-muted-foreground text-sm mt-2"
            >
              {{ $t('risk.ruleEntry.base.empty') }}
            </div>
          </div>
        </div>
        <a-empty v-else :description="$t('risk.ruleEntry.base.empty')" />
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="font-bold">{{ $t('risk.scorecard.base.field.scoreMapping') }}</span>
          <a-button
            v-if="hasPermission(PermCodes.Risk.ModelManage.EDIT)"
            type="primary"
            size="small"
            @click="handleAddMapping"
          >
            {{ $t('common.add') }}
          </a-button>
        </div>
        <vxe-table
          v-if="mappingList.length > 0"
          :row-config="{ keyField: 'id', isHover: true }"
          :data="mappingList"
          size="mini"
        >
          <vxe-column
            field="sortNo"
            :title="$t('risk.scorecard.base.field.dimensionSortNo')"
            :min-width="60"
            align="center"
          />
          <vxe-column field="minScoreExpr" :title="$t('risk.scorecard.base.field.minScoreExpr')" :min-width="120" />
          <vxe-column field="grade" :title="$t('risk.scorecard.base.field.grade')" :min-width="80" align="center">
            <template #default="{ row }">
              <a-tag color="blue">{{ row.grade }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column
            field="decision"
            :title="$t('risk.scorecard.base.field.decision')"
            :min-width="100"
            align="center"
          />
          <vxe-column
            field="isDefault"
            :title="$t('risk.scorecard.base.field.isDefault')"
            :min-width="80"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.isDefault" color="green">{{ $t('common.yes') }}</a-tag>
              <a-tag v-else>{{ $t('common.no') }}</a-tag>
            </template>
          </vxe-column>
          <vxe-column fixed="right" :title="$t('common.operation')" width="120" align="center" :show-overflow="false">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button type="link" size="small" @click="handleEditMapping(row)">{{ $t('common.edit') }}</a-button>
                <a-button type="link" size="small" danger @click="handleDeleteMapping(row)">{{
                  $t('common.delete')
                }}</a-button>
              </a-space>
            </template>
          </vxe-column>
        </vxe-table>
        <a-empty v-else :description="$t('risk.ruleEntry.base.empty')" />
      </div>
    </a-spin>

    <a-modal
      :open="dimensionEditVisible"
      :title="
        dimensionEditType === 'add'
          ? $t('risk.scorecard.form.add.dimensionTitle')
          : $t('risk.scorecard.form.edit.dimensionTitle')
      "
      :width="700"
      :mask-closable="false"
      :focusable="{ trap: false }"
      @ok="handleDimensionOk"
      @cancel="dimensionEditVisible = false"
    >
      <a-form
        ref="dimensionFormRef"
        :model="dimensionFormState"
        :rules="dimensionFormRules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 18 }"
        class="mt-4 form-compact"
      >
        <a-form-item :label="$t('risk.scorecard.base.field.dimensionName')" name="name">
          <a-input
            v-model:value="dimensionFormState.name"
            :placeholder="$t('risk.scorecard.form.add.dimensionNamePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('risk.scorecard.base.field.dimensionSortNo')" name="sortNo">
          <a-input-number v-model:value="dimensionFormState.sortNo" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
      <div class="mt-4">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">{{ $t('risk.scorecard.base.field.entry') }}</span>
          <a-button type="link" size="small" @click="handleAddEntry">{{ $t('common.add') }}</a-button>
        </div>
        <vxe-table :row-config="{ isHover: true }" :data="dimensionFormState.entries || []" size="mini">
          <vxe-column field="seq" :title="$t('risk.scorecard.base.field.entrySeq')" :min-width="60" align="center" />
          <vxe-column field="conditionExpr" :title="$t('risk.scorecard.base.field.entryConditionExpr')" />
          <vxe-column field="score" :title="$t('risk.scorecard.base.field.entryScore')" :min-width="100" />
          <vxe-column fixed="right" :title="$t('common.operation')" width="80" align="center" :show-overflow="false">
            <template #default="{ $rowIndex }">
              <a-button type="link" size="small" danger @click="handleDeleteEntry($rowIndex)">{{
                $t('common.delete')
              }}</a-button>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </a-modal>

    <a-modal
      :open="entryEditVisible"
      :title="$t('risk.scorecard.form.add.entryTitle')"
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
        <a-form-item :label="$t('risk.scorecard.base.field.entrySeq')" name="seq">
          <a-input-number v-model:value="entryFormState.seq" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item :label="$t('risk.scorecard.base.field.entryConditionExpr')" name="conditionExpr">
          <a-textarea v-model:value="entryFormState.conditionExpr" :rows="2" />
        </a-form-item>
        <a-form-item :label="$t('risk.scorecard.base.field.entryScore')" name="score">
          <a-input v-model:value="entryFormState.score" :placeholder="$t('risk.scorecard.form.add.scorePlaceholder')" />
        </a-form-item>
        <a-form-item :label="$t('risk.scorecard.base.field.entryIsExpression')" name="isExpression">
          <a-switch v-model:checked="entryFormState.isExpression" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      :open="mappingEditVisible"
      :title="
        mappingEditType === 'add'
          ? $t('risk.scorecard.form.add.mappingTitle')
          : $t('risk.scorecard.form.edit.mappingTitle')
      "
      :width="520"
      :mask-closable="false"
      :focusable="{ trap: false }"
      @ok="handleMappingOk"
      @cancel="mappingEditVisible = false"
    >
      <a-form
        ref="mappingFormRef"
        :model="mappingFormState"
        :rules="mappingFormRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="mt-4 form-compact"
      >
        <a-form-item :label="$t('risk.scorecard.base.field.minScoreExpr')" name="minScoreExpr">
          <a-input
            v-model:value="mappingFormState.minScoreExpr"
            :placeholder="$t('risk.scorecard.form.add.minScoreExprPlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('risk.scorecard.base.field.entryIsExpression')" name="isExpression">
          <a-switch v-model:checked="mappingFormState.isExpression" />
        </a-form-item>
        <a-form-item :label="$t('risk.scorecard.base.field.grade')" name="grade">
          <a-input
            v-model:value="mappingFormState.grade"
            :placeholder="$t('risk.scorecard.form.add.gradePlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('risk.scorecard.base.field.decision')" name="decision">
          <a-select
            v-model:value="mappingFormState.decision"
            :options="decisionOptions"
            :placeholder="$t('risk.scorecard.form.add.decisionPlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="$t('risk.scorecard.base.field.isDefault')" name="isDefault">
          <a-switch v-model:checked="mappingFormState.isDefault" />
        </a-form-item>
        <a-form-item :label="$t('risk.scorecard.base.field.dimensionSortNo')" name="sortNo">
          <a-input-number v-model:value="mappingFormState.sortNo" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
