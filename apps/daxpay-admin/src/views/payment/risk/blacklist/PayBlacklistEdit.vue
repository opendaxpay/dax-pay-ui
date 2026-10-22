<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { ChinaRegionApi, type Region } from '#/api/core/region.api';
  import {
    PayBlacklistApi,
    type PayBlacklistParam,
    type PayBlacklistVo,
  } from '#/api/payment/risk/blacklist.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  /** 名单类型（与后端 type 一致） */
  type BlacklistType = 'city' | 'ip' | 'province';

  const emit = defineEmits(['ok']);

  /** 直辖市省份编码（市级名单等同省级, 名单值存省编码） */
  const DIRECT_CITY_CODES = new Set(['11', '12', '31', '50']);

  const { message } = useMessage();
  const formRef = ref();

  const { visible, confirmLoading, initFormEditType, handleCancel, showable, formEditType } =
    useFormEdit();

  const isAdd = computed(() => formEditType.value === FormEditType.Add);

  // 表单
  const formState = ref<PayBlacklistParam & { regionPath?: string[] }>({
    id: '',
    type: 'ip',
    value: '',
    status: 'enable',
    reason: '',
    expireTime: undefined,
    remark: '',
    regionPath: [],
  });

  // 省份列表（province / city 类型用, 含市级 children 供联动）
  const provinceList = ref<Region[]>([]);
  const provinceLoading = ref(false);

  const drawerTitle = computed(() => {
    if (isAdd.value) {
      // 新增黑名单
      return $t('payment.risk.blacklist.add');
    }
    if (showable.value) {
      // 查看黑名单
      return $t('payment.risk.blacklist.viewTitle');
    }
    // 编辑黑名单
    return $t('payment.risk.blacklist.editTitle');
  });

  const valuePlaceholder = computed(() => {
    // 名单值输入框仅 IP 类型使用, 省市类型走区划选择
    if (formState.value.type === 'ip') {
      // IP 地址
      return $t('payment.risk.blacklist.placeholder.ip');
    }
    return $t('common.pleaseInput');
  });

  // 省份选项（value 存行政区划编码, 与后端黑名单存储一致）
  const provinceOptions = computed(() =>
    provinceList.value.map((p) => ({ value: p.code, label: p.name })),
  );

  // 城市级联选项（省→市; 直辖市无独立市级, 折叠为叶子且名单值存省编码）
  const cityOptions = computed(() =>
    provinceList.value.map((p) => ({
      value: p.code,
      label: p.name,
      children: DIRECT_CITY_CODES.has(p.code)
        ? []
        : (p.children || []).map((c) => ({ value: c.code, label: c.name })),
    })),
  );

  // 级联选中路径 → 名单值: 取最后一级（普通市=市编码, 直辖市=省编码）
  watch(
    () => formState.value.regionPath,
    (path) => {
      if (formState.value.type === 'city') {
        formState.value.value = path && path.length > 0 ? path[path.length - 1] : '';
      }
    },
  );

  // 黑名单类型选项
  const typeOptions = computed(() => [
    { value: 'ip', label: $t('payment.risk.blacklist.type.ip') },
    { value: 'province', label: $t('payment.risk.blacklist.type.province') },
    { value: 'city', label: $t('payment.risk.blacklist.type.city') },
  ]);

  /** 加载省份列表（含市级 children, 供 city 类型联动） */
  async function loadProvinces() {
    if (provinceList.value.length > 0) {
      return;
    }
    provinceLoading.value = true;
    try {
      const { data } = await ChinaRegionApi.findAllProvinceAndCity();
      provinceList.value = data || [];
    } finally {
      provinceLoading.value = false;
    }
  }

  watch(
    () => formState.value.type,
    (val) => {
      if (val === 'province' || val === 'city') {
        void loadProvinces();
      }
    },
  );

  /** 重置表单 */
  function resetForm() {
    formState.value = {
      id: '',
      type: 'ip',
      value: '',
      status: 'enable',
      reason: '',
      expireTime: undefined,
      remark: '',
      regionPath: [],
    };
    formRef.value?.resetFields();
  }

  /** 填充详情 */
  async function fillForm(record: PayBlacklistVo) {
    confirmLoading.value = true;
    try {
      const { data } = await PayBlacklistApi.get(record.id!);
      const row = data || record;
      if (row.type === 'province' || row.type === 'city') {
        await loadProvinces();
      }
      formState.value = {
        id: row.id!,
        type: row.type,
        value: row.value,
        status: row.status,
        reason: row.reason,
        expireTime: row.expireTime,
        remark: row.remark,
        regionPath: [],
      };
      // city 类型回推级联路径: 直辖市名单存省编码, 普通市为 [省码, 市码]
      if (row.type === 'city' && row.value) {
        formState.value.regionPath = DIRECT_CITY_CODES.has(row.value)
          ? [row.value]
          : [row.value.slice(0, 2), row.value];
      }
    } finally {
      confirmLoading.value = false;
    }
  }

  /** 新增 */
  function showAdd() {
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /** 编辑 */
  async function showEdit(record: PayBlacklistVo) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    await fillForm(record);
  }

  /** 查看 */
  async function showView(record: PayBlacklistVo) {
    initFormEditType(FormEditType.Show);
    resetForm();
    await fillForm(record);
  }

  /** 切换类型时清理级联路径 */
  function handleTypeChange(val: BlacklistType | string) {
    formState.value.type = val;
    formState.value.regionPath = val === 'city' ? formState.value.regionPath : [];
  }

  /** 保存 */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    confirmLoading.value = true;
    try {
      // 剔除级联用字段 regionPath（非后端字段）
      const { regionPath: _regionPath, ...payload } = formState.value;
      // 新增走 add, 编辑走 update
      await (isAdd.value
        ? PayBlacklistApi.add(payload)
        : PayBlacklistApi.update(payload));
      message.success($t('common.saveSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ showAdd, showEdit, showView });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="drawerTitle"
    :default-size="720"
    :destroy-on-hidden="true"
    :mask-closable="showable"
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="formState"
        layout="vertical"
        class="pt-2"
        :disabled="showable"
      >
        <!-- 类型 -->
        <a-form-item
          :label="$t('payment.risk.blacklist.field.type')"
          name="type"
          :rules="[{ required: true, message: $t('common.pleaseSelect') }]"
        >
          <a-select
            :value="formState.type"
            :options="typeOptions"
            :placeholder="$t('common.pleaseSelect')"
            :disabled="!isAdd"
            @update:value="handleTypeChange"
          />
        </a-form-item>

        <!-- IP：精确匹配说明 -->
        <div v-if="formState.type === 'ip'" class="mb-4">
          <a-alert
            :message="$t('payment.risk.blacklist.tip.ipHint')"
            type="info"
            show-icon
          />
        </div>
        <!-- 省/市：IP 归属匹配说明（地区拦截开关统一生效） -->
        <div
          v-if="formState.type === 'province' || formState.type === 'city'"
          class="mb-4"
        >
          <a-alert
            :message="$t('payment.risk.blacklist.tip.regionHint')"
            type="info"
            show-icon
          />
        </div>

        <!-- 名单值 -->
        <a-form-item
          :label="$t('payment.risk.blacklist.field.value')"
          name="value"
          :rules="[{ required: true, message: $t('common.pleaseInput') }]"
        >
          <!-- 城市：省→市级联（名单值存市编码; 直辖市折叠为省, 存省编码） -->
          <a-cascader
            v-if="formState.type === 'city'"
            v-model:value="formState.regionPath"
            :options="cityOptions"
            :placeholder="$t('payment.risk.blacklist.placeholder.city')"
            :disabled="!isAdd"
            :loading="provinceLoading"
            class="w-full"
            allow-clear
            show-search
          />
          <a-select
            v-else-if="formState.type === 'province'"
            v-model:value="formState.value"
            show-search
            option-filter-prop="label"
            :loading="provinceLoading"
            :options="provinceOptions"
            :placeholder="$t('payment.risk.blacklist.placeholder.province')"
            :disabled="!isAdd"
            allow-clear
          />
          <a-input
            v-else
            v-model:value="formState.value"
            :placeholder="valuePlaceholder"
            :disabled="!isAdd"
            :maxlength="128"
          />
        </a-form-item>

        <!-- 状态 -->
        <a-form-item
          :label="$t('payment.risk.blacklist.field.status')"
          name="status"
          :rules="[{ required: true, message: $t('common.pleaseSelect') }]"
        >
          <a-radio-group v-model:value="formState.status" button-style="solid">
            <a-radio-button value="enable">{{ $t('payment.risk.blacklist.status.enable') }}</a-radio-button>
            <a-radio-button value="disable">{{ $t('payment.risk.blacklist.status.disable') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <!-- 原因 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.reason')" name="reason">
          <a-input
            v-model:value="formState.reason"
            :placeholder="$t('common.pleaseInput')"
            :maxlength="255"
          />
        </a-form-item>
        <!-- 过期 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.expireTime')" name="expireTime">
          <a-date-picker
            v-model:value="formState.expireTime"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
            :placeholder="$t('payment.risk.blacklist.tip.expireEmpty')"
          />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item :label="$t('payment.risk.blacklist.field.remark')" name="remark">
          <a-textarea v-model:value="formState.remark" :rows="2" :maxlength="255" />
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ showable ? $t('common.close') : $t('common.cancel') }}</a-button>
        <a-button v-if="!showable" type="primary" :loading="confirmLoading" @click="handleOk">
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
