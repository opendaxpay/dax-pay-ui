<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    InstanceScorecardApi,
    type InstanceScorecardEntryFormResult,
    type InstanceScorecardMappingFormResult,
    type RuleNodeResult,
    type ScorecardDimensionResult,
  } from '#/api/risk/model.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    instanceId: string;
  }>();

  const { message } = useMessage();
  const { hasPermission } = usePermission();

  // 模型实例编辑权限
  const visible = ref(false);
  const loading = ref(false);
  const savingEntries = ref(false);
  const savingMappings = ref(false);
  const ruleNode = ref<RuleNodeResult>({});
  const dimensionList = ref<ScorecardDimensionResult[]>([]);
  const activeDimensionId = ref<string>('');
  const entryFormList = ref<InstanceScorecardEntryFormResult[]>([]);
  const mappingFormList = ref<InstanceScorecardMappingFormResult[]>([]);

  const activeDimension = computed(() =>
    dimensionList.value.find((item) => String(item.id) === activeDimensionId.value),
  );

  const decisionOptions = [
    { label: 'PASS', value: 'PASS' },
    { label: 'REJECT', value: 'REJECT' },
    { label: 'CHALLENGE', value: 'CHALLENGE' },
  ];

  /** 打开评分卡配置 */
  async function show(node: RuleNodeResult) {
    ruleNode.value = node;
    visible.value = true;
    await loadDimensions();
    if (dimensionList.value.length > 0) {
      activeDimensionId.value = String(dimensionList.value[0].id);
      await loadEntryForm();
    } else {
      entryFormList.value = [];
    }
    await loadMappingForm();
  }

  /** 加载模板维度（只读） */
  async function loadDimensions() {
    if (!ruleNode.value.id) {
      return;
    }
    loading.value = true;
    const { data } = await InstanceScorecardApi.listDimensions(String(ruleNode.value.id));
    dimensionList.value = data || [];
    loading.value = false;
  }

  /** 加载条目表单（模板结构 + 覆盖值） */
  async function loadEntryForm() {
    if (!activeDimensionId.value) {
      entryFormList.value = [];
      return;
    }
    loading.value = true;
    const { data } = await InstanceScorecardApi.listEntryForm(activeDimensionId.value, props.instanceId);
    entryFormList.value = data || [];
    loading.value = false;
  }

  /** 加载标尺表单（模板结构 + 覆盖值） */
  async function loadMappingForm() {
    if (!ruleNode.value.id) {
      mappingFormList.value = [];
      return;
    }
    const { data } = await InstanceScorecardApi.listMappingForm(String(ruleNode.value.id), props.instanceId);
    mappingFormList.value = data || [];
  }

  /** 切换维度 */
  async function handleSelectDimension(id: string) {
    activeDimensionId.value = id;
    await loadEntryForm();
  }

  /** 恢复条目为模板默认值 */
  function resetEntryRow(row: InstanceScorecardEntryFormResult) {
    row.conditionExpr = row.templateConditionExpr;
    row.score = row.templateScore;
    row.isExpression = row.templateIsExpression;
  }

  /** 恢复标尺为模板默认值 */
  function resetMappingRow(row: InstanceScorecardMappingFormResult) {
    row.minScoreExpr = row.templateMinScoreExpr;
    row.isExpression = row.templateIsExpression;
    row.grade = row.templateGrade;
    row.decision = row.templateDecision;
    row.isDefault = row.templateIsDefault;
  }

  /** 保存条目 */
  async function handleSaveEntries() {
    if (!activeDimensionId.value) {
      return;
    }
    savingEntries.value = true;
    await InstanceScorecardApi.saveEntries({
      instanceId: props.instanceId,
      dimensionId: activeDimensionId.value,
      entries: entryFormList.value.map((row) => ({
        seq: row.seq,
        conditionExpr: row.conditionExpr,
        score: row.score,
        isExpression: row.isExpression,
      })),
    });
    message.success($t('common.success'));
    await loadEntryForm();
    savingEntries.value = false;
  }

  /** 保存标尺 */
  async function handleSaveMappings() {
    if (!ruleNode.value.id) {
      return;
    }
    savingMappings.value = true;
    await InstanceScorecardApi.saveMappings({
      instanceId: props.instanceId,
      ruleNodeId: String(ruleNode.value.id),
      mappings: mappingFormList.value.map((row) => ({
        sortNo: row.sortNo,
        minScoreExpr: row.minScoreExpr,
        isExpression: row.isExpression,
        grade: row.grade,
        decision: row.decision,
        isDefault: row.isDefault,
      })),
    });
    message.success($t('common.success'));
    await loadMappingForm();
    savingMappings.value = false;
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer
    :open="visible"
    :title="`${$t('risk.modelInstance.scorecard.panelTitle')} - ${ruleNode.nodeName || ''}`"
    size="960"
    destroy-on-hidden
    :mask-closable="false"
    :focusable="{ trap: false }"
    @close="visible = false"
  >
    <p class="mb-4 text-sm text-muted-foreground">{{ $t('risk.modelInstance.scorecard.formHint') }}</p>
    <a-spin :spinning="loading">
      <div class="mb-6">
        <div class="mb-2 flex items-center justify-between">
          <span class="font-bold">{{ $t('risk.scorecard.base.field.dimension') }}</span>
          <template v-if="activeDimensionId && entryFormList.length > 0">
            <a-button
              v-if="hasPermission(PermCodes.Risk.ModelInstance.EDIT)"
              type="primary"
              size="small"
              :loading="savingEntries"
              @click="handleSaveEntries"
              >{{ $t('risk.modelInstance.scorecard.saveEntries') }}</a-button
            >
          </template>
        </div>

        <div v-if="dimensionList.length > 0" class="flex gap-4">
          <div class="min-w-[160px] max-w-[220px] shrink-0">
            <div
              v-for="dim in dimensionList"
              :key="dim.id"
              class="cursor-pointer rounded px-3 py-2 mb-1 transition-colors"
              :class="
                String(dim.id) === activeDimensionId ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/50'
              "
              @click="handleSelectDimension(String(dim.id!))"
            >
              <span class="text-sm truncate">{{ dim.name }}</span>
            </div>
          </div>

          <div v-if="activeDimension" class="min-w-0 flex-1">
            <div class="mb-2 text-sm font-medium">
              {{ $t('risk.scorecard.base.field.entry') }} - {{ activeDimension.name }}
            </div>
            <a-empty
              v-if="entryFormList.length === 0"
              :description="$t('risk.modelInstance.scorecard.noTemplateEntry')"
            />
            <vxe-table v-else :data="entryFormList" size="mini" :row-config="{ keyField: 'templateEntryId' }">
              <vxe-column
                field="seq"
                :title="$t('risk.scorecard.base.field.entrySeq')"
                :min-width="60"
                align="center"
              />
              <vxe-column
                field="templateConditionExpr"
                :title="$t('risk.modelInstance.scorecard.templateDefault')"
                :min-width="120"
              >
                <template #default="{ row }">
                  <span class="text-muted-foreground text-xs">{{ row.templateConditionExpr }}</span>
                </template>
              </vxe-column>
              <vxe-column
                field="conditionExpr"
                :title="$t('risk.scorecard.base.field.entryConditionExpr')"
                :min-width="160"
              >
                <template #default="{ row }">
                  <a-input v-model:value="row.conditionExpr" size="small" />
                </template>
              </vxe-column>
              <vxe-column
                field="templateScore"
                :title="$t('risk.modelInstance.scorecard.templateScore')"
                :min-width="80"
              >
                <template #default="{ row }">
                  <span class="text-muted-foreground text-xs">{{ row.templateScore }}</span>
                </template>
              </vxe-column>
              <vxe-column field="score" :title="$t('risk.scorecard.base.field.entryScore')" :min-width="100">
                <template #default="{ row }">
                  <a-input v-model:value="row.score" size="small" />
                </template>
              </vxe-column>
              <vxe-column
                field="isExpression"
                :title="$t('risk.scorecard.base.field.entryIsExpression')"
                :min-width="90"
                align="center"
              >
                <template #default="{ row }">
                  <a-switch v-model:checked="row.isExpression" size="small" />
                </template>
              </vxe-column>
              <vxe-column fixed="right" :title="$t('common.operation')" width="90" align="center">
                <template #default="{ row }">
                  <a-button
                    v-if="hasPermission(PermCodes.Risk.ModelInstance.EDIT)"
                    type="link"
                    size="small"
                    @click="resetEntryRow(row)"
                    >{{ $t('risk.modelInstance.scorecard.resetToTemplate') }}</a-button
                  >
                </template>
              </vxe-column>
            </vxe-table>
          </div>
        </div>
        <a-empty v-else :description="$t('risk.modelInstance.scorecard.noDimension')" />
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="font-bold">{{ $t('risk.scorecard.base.field.scoreMapping') }}</span>
          <a-button
            v-if="mappingFormList.length > 0"
            v-if="hasPermission(PermCodes.Risk.ModelInstance.EDIT)"
            type="primary"
            size="small"
            :loading="savingMappings"
            @click="handleSaveMappings"
            >{{ $t('risk.modelInstance.scorecard.saveMappings') }}</a-button
          >
        </div>
        <a-empty
          v-if="mappingFormList.length === 0"
          :description="$t('risk.modelInstance.scorecard.noTemplateMapping')"
        />
        <vxe-table v-else :data="mappingFormList" size="mini" :row-config="{ keyField: 'templateMappingId' }">
          <vxe-column
            field="sortNo"
            :title="$t('risk.scorecard.base.field.dimensionSortNo')"
            :min-width="60"
            align="center"
          />
          <vxe-column
            field="templateMinScoreExpr"
            :title="$t('risk.modelInstance.scorecard.templateDefault')"
            :min-width="100"
          >
            <template #default="{ row }">
              <span class="text-muted-foreground text-xs">{{ row.templateMinScoreExpr }}</span>
            </template>
          </vxe-column>
          <vxe-column field="minScoreExpr" :title="$t('risk.scorecard.base.field.minScoreExpr')" :min-width="120">
            <template #default="{ row }">
              <a-input v-model:value="row.minScoreExpr" size="small" />
            </template>
          </vxe-column>
          <vxe-column field="grade" :title="$t('risk.scorecard.base.field.grade')" :min-width="90">
            <template #default="{ row }">
              <a-input v-model:value="row.grade" size="small" />
            </template>
          </vxe-column>
          <vxe-column field="decision" :title="$t('risk.scorecard.base.field.decision')" :min-width="120">
            <template #default="{ row }">
              <a-select v-model:value="row.decision" size="small" class="w-full" :options="decisionOptions" />
            </template>
          </vxe-column>
          <vxe-column
            field="isExpression"
            :title="$t('risk.scorecard.base.field.entryIsExpression')"
            :min-width="80"
            align="center"
          >
            <template #default="{ row }">
              <a-switch v-model:checked="row.isExpression" size="small" />
            </template>
          </vxe-column>
          <vxe-column
            field="isDefault"
            :title="$t('risk.scorecard.base.field.isDefault')"
            :min-width="80"
            align="center"
          >
            <template #default="{ row }">
              <a-switch v-model:checked="row.isDefault" size="small" />
            </template>
          </vxe-column>
          <vxe-column fixed="right" :title="$t('common.operation')" width="90" align="center">
            <template #default="{ row }">
              <a-button
                v-if="hasPermission(PermCodes.Risk.ModelInstance.EDIT)"
                type="link"
                size="small"
                @click="resetMappingRow(row)"
                >{{ $t('risk.modelInstance.scorecard.resetToTemplate') }}</a-button
              >
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </a-spin>
  </a-drawer>
</template>
