<script lang="ts" setup>
  import type { ColumnType } from 'ant-design-vue/es/table';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type LookupTableKeyDefItem,
    type LookupTableParam,
    type LookupTableResult,
    type LookupTableRowItem,
    LookupTableApi,
  } from '#/api/risk/model.api';
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
  const editId = ref<string>();
  const tableCode = ref('');

  const tableName = ref('');
  const keyDefs = ref<LookupTableKeyDefItem[]>([]);
  const rows = ref<LookupTableRowItem[]>([]);

  // 国际化：表单校验规则
  const formRules = computed(() => ({
    name: [{ required: true, message: $t('risk.lookup.form.add.namePlaceholder') }],
  }));

  // 国际化：行数据表格列定义
  const rowColumns = computed<ColumnType[]>(() => {
    const keyColumns: ColumnType[] = keyDefs.value.map((kd, i) => ({
      title: kd.name || kd.code || $t('risk.lookup.form.keyDef.unnamed'),
      dataIndex: `key_${i}`,
      width: 150,
      key: `key_${i}`,
      customRender: () => null,
    }));
    return [
      ...keyColumns,
      {
        title: $t('risk.lookup.base.field.value'),
        dataIndex: 'value',
        width: 150,
        key: 'value',
        customRender: () => null,
      },
      {
        title: $t('common.operation'),
        dataIndex: 'action',
        width: 70,
        key: 'action',
        align: 'center',
        fixed: 'right',
        customRender: () => null,
      },
    ];
  });

  const keyDefColumns = computed<ColumnType[]>(() => [
    {
      title: $t('risk.lookup.base.field.keyCode'),
      dataIndex: 'code',
      width: 120,
      key: 'code',
      customRender: () => null,
    },
    {
      title: $t('risk.lookup.base.field.keyName'),
      dataIndex: 'name',
      key: 'name',
      customRender: () => null,
    },
    {
      title: $t('risk.lookup.base.field.expression'),
      dataIndex: 'expression',
      key: 'expression',
      customRender: () => null,
    },
    {
      title: $t('common.operation'),
      dataIndex: 'action',
      width: 70,
      key: 'action',
      align: 'center',
      customRender: () => null,
    },
  ]);

  function rowKey(record: LookupTableRowItem, index: number) {
    return String(index);
  }

  function keyDefRowKey(_record: LookupTableKeyDefItem, index: number) {
    return String(index);
  }

  function resetForm() {
    tableName.value = '';
    tableCode.value = '';
    keyDefs.value = [{ code: '', name: '', expression: '' }];
    rows.value = [];
    formRef.value?.resetFields();
  }

  function show() {
    initFormEditType(FormEditType.Add);
    editId.value = undefined;
    resetForm();
  }

  async function showEdit(row: LookupTableResult) {
    initFormEditType(FormEditType.Edit);
    editId.value = row.id;
    resetForm();
    confirmLoading.value = true;
    try {
      const res: any = await LookupTableApi.findById(row.id!);
      const data = res.data as LookupTableResult;
      tableName.value = data.name || '';
      tableCode.value = data.code || '';
      keyDefs.value =
        data.keyDefs && data.keyDefs.length > 0
          ? data.keyDefs.map((k) => ({ id: k.id, code: k.code, name: k.name, expression: k.expression }))
          : [{ code: '', name: '', expression: '' }];
      rows.value =
        data.rows?.map((r) => ({
          id: r.id,
          keys: r.keys ? { ...r.keys } : {},
          value: r.value || '',
        })) || [];
    } finally {
      confirmLoading.value = false;
    }
  }

  function addKeyDef() {
    keyDefs.value = [...keyDefs.value, { code: '', name: '', expression: '' }];
  }

  function removeKeyDef(index: number) {
    const removedCode = keyDefs.value[index]?.code;
    keyDefs.value = keyDefs.value.filter((_, i) => i !== index);
    if (removedCode) {
      rows.value = rows.value.map((r) => {
        if (r.keys && removedCode in r.keys) {
          const newKeys = { ...r.keys };
          delete newKeys[removedCode];
          return { ...r, keys: newKeys };
        }
        return r;
      });
    }
  }

  function onKeyDefCodeChange(record: LookupTableKeyDefItem, oldCode: string, newCode: string) {
    if (!oldCode || oldCode === record.expression) {
      record.expression = newCode;
    }
    if (oldCode && oldCode !== newCode) {
      rows.value = rows.value.map((r) => {
        if (r.keys && oldCode in r.keys) {
          const newKeys: Record<string, any> = {};
          for (const [k, v] of Object.entries(r.keys)) {
            newKeys[k === oldCode ? newCode : k] = v;
          }
          return { ...r, keys: newKeys };
        }
        return r;
      });
    }
  }

  function addRow() {
    const keys: Record<string, any> = {};
    keyDefs.value.forEach((kd) => {
      if (kd.code) {
        keys[kd.code] = '';
      }
    });
    rows.value = [...rows.value, { keys, value: '' }];
  }

  function removeRow(index: number) {
    rows.value = rows.value.filter((_, i) => i !== index);
  }

  function updateKeyValue(record: LookupTableRowItem, keyCode: string, val: string) {
    const idx = rows.value.indexOf(record);
    if (idx >= 0) {
      const newKeys = { ...record.keys, [keyCode]: val };
      rows.value = rows.value.map((r, i) => (i === idx ? { ...r, keys: newKeys } : r));
    }
  }

  async function handleOk() {
    await formRef.value?.validate();
    confirmLoading.value = true;
    try {
      const params: LookupTableParam = {
        id: formEditType.value === FormEditType.Edit ? editId.value : undefined,
        modelId: props.modelId,
        name: tableName.value,
        keyDefs: keyDefs.value
          .filter((k) => k.code)
          .map((k) => ({
            id: formEditType.value === FormEditType.Edit && k.id ? k.id : undefined,
            code: k.code,
            name: k.name,
            expression: k.expression,
          })),
        rows: rows.value.map((r) => ({
          id: formEditType.value === FormEditType.Edit && r.id ? r.id : undefined,
          keys: r.keys,
          value: r.value,
        })),
      };
      if (formEditType.value === FormEditType.Edit) {
        await LookupTableApi.update(params);
      } else {
        await LookupTableApi.add(params);
      }
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
  <a-drawer
    :open="visible"
    :title="title"
    size="80%"
    :mask-closable="false"
    :focusable="{ trap: false }"
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="{ name: tableName }"
        :rules="formRules"
        :label-col="{ span: 3 }"
        :wrapper-col="{ span: 21 }"
        class="mt-4 form-compact"
      >
        <!-- 查表编码（编辑模式显示） -->
        <a-form-item v-if="formEditType === FormEditType.Edit" :label="$t('risk.lookup.base.field.tableCode')">
          <span class="text-gray-500">{{ tableCode }}</span>
        </a-form-item>
        <!-- 查表名称 -->
        <a-form-item :label="$t('risk.lookup.base.field.name')" name="name">
          <a-input v-model:value="tableName" :placeholder="$t('risk.lookup.form.add.namePlaceholder')" />
        </a-form-item>
      </a-form>

      <!-- 键定义区域标题 -->
      <div class="mb-2 mt-4 font-bold">{{ $t('risk.lookup.form.keyDef.section') }}</div>
      <a-table
        :data-source="keyDefs"
        :columns="keyDefColumns"
        :pagination="false"
        size="small"
        bordered
        :row-key="keyDefRowKey"
      >
        <template #bodyCell="{ column, record, index }">
          <!-- 键编码 -->
          <a-input
            v-if="column.dataIndex === 'code'"
            :value="record.code"
            size="small"
            :placeholder="$t('risk.lookup.form.addKeyDef.codePlaceholder')"
            @change="
              (e: any) => {
                const oldCode = record.code;
                record.code = e.target.value;
                onKeyDefCodeChange(record, oldCode, e.target.value);
              }
            "
          />
          <!-- 键名称 -->
          <a-input
            v-else-if="column.dataIndex === 'name'"
            v-model:value="record.name"
            size="small"
            :placeholder="$t('risk.lookup.form.addKeyDef.namePlaceholder')"
          />
          <!-- 表达式 -->
          <a-input
            v-else-if="column.dataIndex === 'expression'"
            v-model:value="record.expression"
            size="small"
            :placeholder="$t('risk.lookup.form.addKeyDef.expressionPlaceholder')"
          />
          <!-- 删除键 -->
          <a-button
            v-if="column.dataIndex === 'action'"
            type="link"
            size="small"
            danger
            @click="removeKeyDef(index!)"
            >{{ $t('common.delete') }}</a-button
          >
        </template>
      </a-table>
      <!-- 新增键按钮 -->
      <a-button type="dashed" size="small" class="mt-2" block @click="addKeyDef">
        + {{ $t('risk.lookup.form.keyDef.addKey') }}
      </a-button>

      <!-- 行数据区域标题 -->
      <div class="mb-2 mt-4 font-bold">{{ $t('risk.lookup.form.rowData.section') }}</div>
      <a-table
        :data-source="rows"
        :columns="rowColumns"
        :pagination="false"
        size="small"
        bordered
        :scroll="{ x: keyDefs.length * 150 + 250 }"
        :row-key="rowKey"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.dataIndex?.startsWith('key_')">
            <a-input
              :value="record.keys?.[keyDefs[Number(column.dataIndex.split('_')[1])]?.code || '']"
              size="small"
              :placeholder="keyDefs[Number(column.dataIndex.split('_')[1])]?.code"
              :disabled="!keyDefs[Number(column.dataIndex.split('_')[1])]?.code"
              @change="
                (e: any) =>
                  updateKeyValue(record, keyDefs[Number(column.dataIndex.split('_')[1])]?.code, e.target.value)
              "
            />
          </template>
          <!-- 值 -->
          <a-input v-else-if="column.dataIndex === 'value'" v-model:value="record.value" size="small" />
          <!-- 删除行 -->
          <a-button v-if="column.dataIndex === 'action'" type="link" size="small" danger @click="removeRow(index!)">{{
            $t('common.delete')
          }}</a-button>
        </template>
      </a-table>
      <!-- 新增行按钮 -->
      <a-button type="dashed" size="small" class="mt-2" block @click="addRow">
        + {{ $t('risk.lookup.form.rowData.addRow') }}
      </a-button>
    </a-spin>

    <template #footer>
      <a-space>
        <!-- 取消按钮 -->
        <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
        <!-- 确认按钮 -->
        <a-button type="primary" :loading="confirmLoading" @click="handleOk">{{ $t('common.confirm') }}</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
