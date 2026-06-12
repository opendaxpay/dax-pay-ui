<script lang="ts" setup>
  import { ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { ConfigParamApi, ModelInstanceApi, type ConfigParamResult } from '#/api/risk/model.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  const props = defineProps<{
    modelId: string;
    instanceId: string;
  }>();
  const { message } = useMessage();
  const { hasPermission } = usePermission();

  // 模型实例编辑权限
  // 加载中
  const loading = ref(false);
  // 保存中
  const saving = ref(false);
  // 参数定义列表
  const paramDefs = ref<ConfigParamResult[]>([]);
  // 覆盖值映射
  const overrideValues = ref<Record<string, any>>({});

  watch(
    () => [props.modelId, props.instanceId],
    () => {
      if (props.modelId && props.instanceId) {
        loadData();
      }
    },
    { immediate: true },
  );

  /** 加载配置参数定义与实例覆盖值 */
  async function loadData() {
    loading.value = true;
    const [defRes, instRes] = await Promise.all([
      ConfigParamApi.listByModelId(props.modelId),
      ModelInstanceApi.findByInstanceId(props.instanceId),
    ]);
    paramDefs.value = defRes.data || [];
    let parsed: Record<string, any> = {};
    if (instRes.data?.configParams) {
      parsed = JSON.parse(instRes.data.configParams);
    }
    const values: Record<string, any> = {};
    for (const def of paramDefs.value) {
      const code = def.paramCode!;
      values[code] = parsed[code] ?? undefined;
    }
    overrideValues.value = values;
    loading.value = false;
  }

  /** 保存配置参数覆盖 */
  function handleSave() {
    saving.value = true;
    const result: Record<string, any> = {};
    for (const def of paramDefs.value) {
      const code = def.paramCode!;
      const value = overrideValues.value[code];
      if (value !== undefined && value !== null && value !== '') {
        result[code] = value;
      }
    }
    ModelInstanceApi.updateConfigParams({
      instanceId: props.instanceId,
      configParams: JSON.stringify(result),
    }).then(() => {
      message.success($t('common.success'));
      loadData();
      saving.value = false;
    });
  }
</script>

<template>
  <div>
    <div class="mb-3 flex justify-end">
      <a-button
        v-if="hasPermission(PermCodes.Risk.ModelInstance.EDIT)"
        type="primary"
        :loading="saving"
        @click="handleSave"
        >{{ $t('common.save') }}</a-button
      >
    </div>
    <vxe-table :data="paramDefs" :loading="loading" :row-config="{ keyField: 'id' }">
      <!-- 参数编码 -->
      <vxe-column field="paramCode" :title="$t('risk.modelInstance.base.configParam.paramCode')" :min-width="140" />
      <!-- 参数名称 -->
      <vxe-column field="paramName" :title="$t('risk.configParam.base.field.paramName')" :min-width="140" />
      <!-- 参数类型 -->
      <vxe-column field="paramType" :title="$t('risk.configParam.base.field.paramType')" :min-width="100" />
      <!-- 模板默认值 -->
      <vxe-column
        field="defaultValue"
        :title="$t('risk.modelInstance.base.configParam.defaultValue')"
        :min-width="120"
      />
      <!-- 覆盖值 -->
      <vxe-column field="overrideValue" :title="$t('risk.modelInstance.workbench.overrideValue')" :min-width="180">
        <template #default="{ row }">
          <a-input-number
            v-if="row.paramType === 'NUMBER'"
            v-model:value="overrideValues[row.paramCode]"
            class="w-full"
            :placeholder="$t('risk.modelInstance.form.add.configParamValuePlaceholder')"
          />
          <a-select
            v-else-if="row.paramType === 'BOOLEAN'"
            v-model:value="overrideValues[row.paramCode]"
            allow-clear
            class="w-full"
            :placeholder="$t('risk.modelInstance.form.add.configParamValuePlaceholder')"
          >
            <a-select-option :value="true">{{ $t('risk.configParam.base.boolean.true') }}</a-select-option>
            <a-select-option :value="false">{{ $t('risk.configParam.base.boolean.false') }}</a-select-option>
          </a-select>
          <a-input
            v-else
            v-model:value="overrideValues[row.paramCode]"
            :placeholder="$t('risk.modelInstance.form.add.configParamValuePlaceholder')"
          />
        </template>
      </vxe-column>
    </vxe-table>
  </div>
</template>
