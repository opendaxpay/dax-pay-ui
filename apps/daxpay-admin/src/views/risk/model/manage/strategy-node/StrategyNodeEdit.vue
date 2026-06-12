<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { StrategyNodeApi, type StrategyNodeParam } from '#/api/risk/model.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const props = defineProps<{
    modelId: string;
  }>();

  const emit = defineEmits(['ok']);
  const { message } = useMessage();

  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType } = useFormEdit();

  // 决策模式选项
  const decisionModeOptions = computed(() => [
    { label: $t('risk.strategyNode.base.decisionMode.allPass'), value: 'ALL_PASS' },
    { label: $t('risk.strategyNode.base.decisionMode.firstHit'), value: 'FIRST_HIT' },
    { label: $t('risk.strategyNode.base.decisionMode.anyPass'), value: 'ANY_PASS' },
  ]);

  // 表单数据
  const formState = ref<StrategyNodeParam>({
    nodeName: '',
    sortNo: 0,
    decisionMode: 'FIRST_HIT',
    precondition: '',
  });

  // 表单校验规则
  const formRules = computed(() => ({
    nodeName: [{ required: true, message: $t('risk.strategyNode.form.add.nodeNamePlaceholder') }],
    sortNo: [{ required: true, message: $t('risk.strategyNode.form.add.sortNoPlaceholder') }],
    decisionMode: [{ required: true, message: $t('risk.strategyNode.form.add.decisionModePlaceholder') }],
  }));

  /** 重置表单 */
  function resetForm() {
    formState.value = {
      nodeName: '',
      sortNo: 0,
      decisionMode: 'FIRST_HIT',
      precondition: '',
    };
    formRef.value?.resetFields();
  }

  /** 新增模式 */
  function show() {
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /** 编辑模式 */
  async function showEdit(id: string) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    try {
      const res = await StrategyNodeApi.findById(id);
      const row = res.data;
      formState.value = {
        id: row.id!,
        modelId: props.modelId,
        nodeId: row.nodeId || '',
        nodeName: row.nodeName || '',
        sortNo: row.sortNo ?? 0,
        decisionMode: row.decisionMode || 'FIRST_HIT',
        precondition: row.precondition || '',
      };
    } finally {
      confirmLoading.value = false;
    }
  }

  /** 确认提交 */
  async function handleOk() {
    await formRef.value?.validate();
    confirmLoading.value = true;
    try {
      const params: StrategyNodeParam = {
        ...formState.value,
        modelId: props.modelId,
      };
      await (formEditType.value === FormEditType.Edit ? StrategyNodeApi.update(params) : StrategyNodeApi.add(params));
      message.success($t('common.success'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show, showEdit });
</script>

<template>
  <a-modal
    :open="visible"
    :title="title"
    :width="560"
    :confirm-loading="confirmLoading"
    :mask-closable="false"
    :focusable="{ trap: false }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="mt-4 form-compact"
      >
        <!-- 节点名称 -->
        <a-form-item :label="$t('risk.strategyNode.base.field.nodeName')" name="nodeName">
          <a-input
            v-model:value="formState.nodeName"
            :placeholder="$t('risk.strategyNode.form.add.nodeNamePlaceholder')"
          />
        </a-form-item>
        <!-- 决策模式 -->
        <a-form-item :label="$t('risk.strategyNode.base.field.decisionMode')" name="decisionMode">
          <a-select
            v-model:value="formState.decisionMode"
            :options="decisionModeOptions"
            :placeholder="$t('risk.strategyNode.form.add.decisionModePlaceholder')"
          />
        </a-form-item>
        <!-- 准入条件 -->
        <a-form-item :label="$t('risk.strategyNode.base.field.precondition')" name="precondition">
          <a-textarea
            v-model:value="formState.precondition"
            :placeholder="$t('risk.strategyNode.form.add.preconditionPlaceholder')"
            :rows="3"
          />
        </a-form-item>
        <!-- 排序号 -->
        <a-form-item :label="$t('risk.strategyNode.base.field.sortNo')" name="sortNo">
          <a-input-number
            v-model:value="formState.sortNo"
            :min="0"
            :placeholder="$t('risk.strategyNode.form.add.sortNoPlaceholder')"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
