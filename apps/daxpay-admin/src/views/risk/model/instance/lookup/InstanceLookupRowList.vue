<script lang="ts" setup>
  import type { ColumnType } from 'ant-design-vue/es/table';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    InstanceLookupRowApi,
    LookupTableApi,
    type LookupTableKeyDefItem,
    type LookupTableResult,
    type LookupTableRowItem,
  } from '#/api/risk/model.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    instanceId: string;
  }>();

  const emit = defineEmits(['ok']);
  const { message } = useMessage();
  const { hasPermission } = usePermission();

  // 模型实例编辑权限
  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const lookupTable = ref<LookupTableResult>({});
  const keyDefs = ref<LookupTableKeyDefItem[]>([]);
  const rows = ref<LookupTableRowItem[]>([]);

  // 国际化：行数据表格列定义
  const rowColumns = computed<ColumnType[]>(() => {
    const keyColumns: ColumnType[] = keyDefs.value.map((kd, i) => ({
      title: kd.name || kd.code || $t('risk.lookup.form.keyDef.unnamed'),
      dataIndex: `key_${i}`,
      width: 150,
      key: `key_${i}`,
    }));
    return [
      ...keyColumns,
      {
        title: $t('risk.lookup.base.field.value'),
        dataIndex: 'value',
        width: 150,
        key: 'value',
      },
      {
        title: $t('common.operation'),
        dataIndex: 'action',
        width: 70,
        key: 'action',
        align: 'center',
        fixed: 'right',
      },
    ];
  });

  function rowKey(_record: LookupTableRowItem, index: number) {
    return String(index);
  }

  /** 打开行管理抽屉 */
  async function show(table: LookupTableResult) {
    lookupTable.value = table;
    visible.value = true;
    await loadTableDetail();
    await loadRows();
  }

  /** 加载查表结构（只读列头） */
  async function loadTableDetail() {
    if (!lookupTable.value.id) {
      return;
    }
    const { data } = await LookupTableApi.findById(String(lookupTable.value.id));
    keyDefs.value = data?.keyDefs || [];
  }

  /** 加载实例行数据 */
  async function loadRows() {
    if (!lookupTable.value.id) {
      return;
    }
    loading.value = true;
    const { data } = await InstanceLookupRowApi.listByLookupTableId(String(lookupTable.value.id), props.instanceId);
    rows.value = (data || []).map((row) => {
      let keys: Record<string, any> = {};
      if (row.keys) {
        keys = JSON.parse(row.keys);
      }
      return {
        id: row.id,
        keys,
        value: row.value || '',
      };
    });
    loading.value = false;
  }

  /** 新增行 */
  function addRow() {
    const keys: Record<string, any> = {};
    keyDefs.value.forEach((kd) => {
      if (kd.code) {
        keys[kd.code] = '';
      }
    });
    rows.value = [...rows.value, { keys, value: '' }];
  }

  /** 删除行 */
  function removeRow(index: number) {
    rows.value = rows.value.filter((_, i) => i !== index);
  }

  /** 更新键列单元格值 */
  function updateKeyValue(record: LookupTableRowItem, keyCode: string, val: string) {
    const idx = rows.value.indexOf(record);
    if (idx >= 0) {
      const newKeys = { ...(record.keys || {}), [keyCode]: val };
      rows.value = rows.value.map((r, i) => (i === idx ? { ...r, keys: newKeys } : r));
    }
  }

  /** 批量保存行数据 */
  async function handleSave() {
    saving.value = true;
    await InstanceLookupRowApi.saveRows({
      lookupTableId: lookupTable.value.id,
      instanceId: props.instanceId,
      rows: rows.value.map((r) => ({
        id: r.id,
        keys: r.keys,
        value: r.value,
      })),
    });
    message.success($t('common.success'));
    saving.value = false;
    handleClose();
  }

  /** 关闭 */
  function handleClose() {
    visible.value = false;
    emit('ok');
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer
    :open="visible"
    :title="`${$t('risk.modelInstance.lookup.rowTitle')} - ${lookupTable.name || lookupTable.code || ''}`"
    size="960"
    destroy-on-hidden
    :mask-closable="false"
    :focusable="{ trap: false }"
    @close="handleClose"
  >
    <a-spin :spinning="loading">
      <p class="mb-3 text-sm text-muted-foreground">{{ $t('risk.modelInstance.lookup.instanceRowHint') }}</p>

      <!-- 行数据区域 -->
      <div class="mb-2 font-bold">{{ $t('risk.lookup.form.rowData.section') }}</div>
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
          <template v-if="column.dataIndex?.toString().startsWith('key_')">
            <a-input
              :value="record.keys?.[keyDefs[Number(String(column.dataIndex).split('_')[1])]?.code || '']"
              size="small"
              :placeholder="keyDefs[Number(String(column.dataIndex).split('_')[1])]?.code"
              :disabled="!keyDefs[Number(String(column.dataIndex).split('_')[1])]?.code"
              @change="
                (e: any) =>
                  updateKeyValue(record, keyDefs[Number(String(column.dataIndex).split('_')[1])]?.code || '', e.target.value)
              "
            />
          </template>
          <a-input v-else-if="column.dataIndex === 'value'" v-model:value="record.value" size="small" />
          <a-button
            v-else-if="column.dataIndex === 'action'"
            type="link"
            size="small"
            danger
            @click="removeRow(index!)"
            >{{ $t('common.delete') }}</a-button
          >
        </template>
      </a-table>
      <a-button type="dashed" size="small" class="mt-2" block @click="addRow">
        + {{ $t('risk.modelInstance.lookup.addRow') }}
      </a-button>
    </a-spin>

    <template #footer>
      <a-space>
        <a-button @click="handleClose">{{ $t('common.cancel') }}</a-button>
        <a-button
          v-if="hasPermission(PermCodes.Risk.ModelInstance.EDIT)"
          type="primary"
          :loading="saving"
          @click="handleSave"
          >{{ $t('risk.modelInstance.lookup.saveRows') }}</a-button
        >
      </a-space>
    </template>
  </a-drawer>
</template>
