<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    CashierConfigApi,
    type CashierItemParam,
    type CashierItemResult,
  } from '#/api/payment/merchant/cashier.api';
  import { PayRouteApi } from '#/api/payment/route/pay-route.api';
   import { FormEditType } from '#/enums/formEditType';
   import { useFormEdit } from '#/hooks/useFormEdit';
   import { useMessage } from '#/hooks/useMessage';
   import { getProviderSvgUrl } from '#/views/payment/shared/payProviderDisplay';

  import {
    CASHIER_ICON_OPTIONS,
    CASHIER_TYPE,
    RESOLVE_MODE,
    type CashierType,
  } from './shared/constants';

  const emit = defineEmits<{ ok: [] }>();

  const { message } = useMessage();
  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType, showable } = useFormEdit();

  const context = ref<{
    mchNo: string;
    appId: string;
    cashierType: CashierType;
    scene?: string;
  }>({
    mchNo: '',
    appId: '',
    cashierType: CASHIER_TYPE.H5,
  });

  // DIRECT 模式：通道商户扁平选项（去重）+ 商户→method 组合映射 + 能力→provider 映射（图标联动）
  const channelMchOptions = ref<LabelValue[]>([]);
  const channelMchCombosMap = ref<Record<string, Array<{ method: string; provider: string }>>>({});
  const capabilityProviderMap = ref<Record<string, string>>({});

  const formState = ref<CashierItemParam>({
    mchNo: '',
    appId: '',
    cashierType: CASHIER_TYPE.H5,
    name: '',
    resolveMode: RESOLVE_MODE.METHOD,
    recommend: false,
    sortNo: 0,
  });

  const methodOptions = ref<LabelValue[]>([]);
  // method value → provider（METHOD 模式联动图标用）
  const methodProviderMap = ref<Record<string, string>>({});
  const capabilityOptions = ref<LabelValue[]>([]);

  const iconOptions = computed(() =>
    CASHIER_ICON_OPTIONS.map((o) => ({
      value: o.value,
      label: $t(o.labelKey),
    })),
  );

  const formRules = computed(() => {
    const rules: Record<string, any[]> = {
      name: [{ required: true, message: $t('payment.merchant.cashier.cashier.validationName') }],
      icon: [{ required: true, message: $t('payment.merchant.cashier.cashier.validationIcon') }],
      resolveMode: [{ required: true, message: $t('payment.merchant.cashier.cashier.validationResolveMode') }],
    };
    if (formState.value.resolveMode === RESOLVE_MODE.METHOD) {
      rules.method = [{ required: true, message: $t('payment.merchant.cashier.cashier.validationMethod') }];
    } else {
      rules.channelMchNo = [
        { required: true, message: $t('payment.merchant.cashier.cashier.validationChannelMch') },
      ];
      rules.capability = [
        { required: true, message: $t('payment.merchant.cashier.cashier.validationCapability') },
      ];
    }
    return rules;
  });

  /** 重置表单 */
  function resetForm() {
    formState.value = {
      mchNo: context.value.mchNo,
      appId: context.value.appId,
      cashierType: context.value.cashierType,
      scene: context.value.cashierType === CASHIER_TYPE.H5 ? context.value.scene : undefined,
      name: '',
      icon: undefined,
      recommend: false,
      sortNo: 0,
      resolveMode: RESOLVE_MODE.METHOD,
      method: undefined,
      channelMchNo: undefined,
      capability: undefined,
    };
    channelMchOptions.value = [];
    channelMchCombosMap.value = {};
    capabilityProviderMap.value = {};
    capabilityOptions.value = [];
    formRef.value?.resetFields();
  }

  /** 加载支付方式目录 */
  async function loadMethodDirectory() {
    const { data } = await PayRouteApi.listMethodDirectoryFlat();
    const options: LabelValue[] = [];
    const providerMap: Record<string, string> = {};
    for (const item of data || []) {
      const label = item.methodLabel || item.method;
      // 只展示方式名称，不显示 provider 编码前缀
      options.push({
        label,
        value: item.method,
      });
      providerMap[item.method] = item.provider;
    }
    methodOptions.value = options;
    methodProviderMap.value = providerMap;
  }

  /** DIRECT：批量加载全部通道商户（扁平去重，记录每商户的全部 provider|method 组合） */
  async function loadAllChannelMchOptions() {
    channelMchOptions.value = [];
    channelMchCombosMap.value = {};
    if (!context.value.appId) {
      return;
    }
    const { data } = await PayRouteApi.listSceneChannelMchCandidatesBatch({
      appId: context.value.appId,
    });
    if (!data) {
      return;
    }
    // 按 channelMchNo 去重，同时收集每商户的全部 provider|method 组合
    const labelMap = new Map<string, string>();
    const combosMap: Record<string, Array<{ method: string; provider: string }>> = {};
    for (const [key, list] of Object.entries(data)) {
      const parts = key.split('|');
      const provider = parts[0] || '';
      const method = parts.length >= 2 ? parts[1]! : '';
      if (!method) {
        continue;
      }
      for (const item of list || []) {
        labelMap.set(item.value, item.label);
        if (!combosMap[item.value]) {
          combosMap[item.value] = [];
        }
        combosMap[item.value]!.push({ method, provider });
      }
    }
    channelMchOptions.value = [...labelMap.entries()].map(([value, label]) => ({
      label,
      value,
    }));
    channelMchCombosMap.value = combosMap;
  }

  /** DIRECT：按通道商户加载支付能力候选（batch API 合并该商户全部 method 组合） */
  async function loadCapabilityByChannelMch(channelMchNo: string) {
    capabilityOptions.value = [];
    capabilityProviderMap.value = {};
    if (!channelMchNo || !context.value.appId) {
      return;
    }
    const combos = channelMchCombosMap.value[channelMchNo];
    if (!combos?.length) {
      return;
    }
    const { data } = await PayRouteApi.listSceneCapabilityCandidatesBatch({
      appId: context.value.appId,
      items: combos.map((c) => ({
        provider: c.provider,
        method: c.method,
        channelMchNo,
      })),
    });
    if (!data) {
      return;
    }
    // 合并去重，同时建立 capability → provider 映射（用于图标联动）
    const capLabelMap = new Map<string, string>();
    const capProviderMap: Record<string, string> = {};
    for (const [key, list] of Object.entries(data)) {
      const provider = key.split('|')[0] || '';
      for (const item of list || []) {
        capLabelMap.set(item.value, item.label);
        capProviderMap[item.value] = provider;
      }
    }
    capabilityProviderMap.value = capProviderMap;
    // label 统一用 i18n 翻译
    const toLabel = (code: string) =>
      $t(`payment.merchant.cashier.cashier.capabilities.${code}`) || code;
    let options = [...capLabelMap.keys()].map((value) => ({
      label: toLabel(value),
      value,
    }));
    // 编辑回显兜底：确保已选值在选项中
    const currentCap = formState.value.capability;
    if (currentCap && !options.some((o) => o.value === currentCap)) {
      options = [...options, { label: toLabel(currentCap), value: currentCap }];
    }
    capabilityOptions.value = options;
  }

  /** 解析模式切换 */
  function onResolveModeChange() {
    formState.value.method = undefined;
    formState.value.channelMchNo = undefined;
    formState.value.capability = undefined;
    capabilityOptions.value = [];
    capabilityProviderMap.value = {};
  }

  /** METHOD 模式支付方式变更 — 联动图标（icon = provider） */
  function onMethodChange(method: any) {
    const provider = method ? methodProviderMap.value[method as string] : undefined;
    if (provider) {
      formState.value.icon = provider;
    }
  }

  /** DIRECT 通道商户变更 — 加载该商户全部支付能力 */
  async function onChannelMchChange(channelMchNo: any) {
    formState.value.channelMchNo = channelMchNo || undefined;
    formState.value.capability = undefined;
    if (!channelMchNo) {
      capabilityOptions.value = [];
      return;
    }
    await loadCapabilityByChannelMch(channelMchNo as string);
  }

  /** DIRECT 支付能力变更 — 联动图标（icon = provider，从 batch key 反推） */
  function onCapabilityChange(capability: any) {
    if (!capability) {
      return;
    }
    const provider = capabilityProviderMap.value[capability as string];
    if (provider) {
      formState.value.icon = provider;
    }
  }

  /** 新增 */
  async function show(opts: {
    mchNo: string;
    appId: string;
    cashierType: CashierType;
    scene?: string;
  }) {
    context.value = { ...opts };
    initFormEditType(FormEditType.Add);
    resetForm();
    await loadMethodDirectory();
    await loadAllChannelMchOptions();
  }

  /** 编辑 */
  async function showEdit(opts: {
    mchNo: string;
    appId: string;
    cashierType: CashierType;
    scene?: string;
    record: CashierItemResult;
  }) {
    context.value = {
      mchNo: opts.mchNo,
      appId: opts.appId,
      cashierType: opts.cashierType,
      scene: opts.scene,
    };
    initFormEditType(FormEditType.Edit);
    resetForm();
    await loadMethodDirectory();
    await loadAllChannelMchOptions();
    confirmLoading.value = true;
    try {
      const { data } = await CashierConfigApi.getById(opts.record.id!);
      const row = data || opts.record;
      formState.value = {
        id: row.id || undefined,
        mchNo: opts.mchNo,
        appId: opts.appId,
        cashierType: opts.cashierType,
        scene: opts.cashierType === CASHIER_TYPE.H5 ? opts.scene : undefined,
        name: row.name || '',
        icon: row.icon || undefined,
        recommend: !!row.recommend,
        sortNo: row.sortNo ?? 0,
        resolveMode: row.resolveMode || RESOLVE_MODE.METHOD,
        method: row.method || undefined,
        channelMchNo: row.channelMchNo || undefined,
        capability: row.capability || undefined,
      };
      // DIRECT 编辑时还原支付能力候选
      if (formState.value.resolveMode === RESOLVE_MODE.DIRECT && row.channelMchNo) {
        await loadCapabilityByChannelMch(row.channelMchNo);
      }
    } finally {
      confirmLoading.value = false;
    }
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
      const payload: CashierItemParam = {
        ...formState.value,
        mchNo: context.value.mchNo,
        appId: context.value.appId,
        cashierType: context.value.cashierType,
        scene: context.value.cashierType === CASHIER_TYPE.H5 ? context.value.scene : undefined,
        recommend: !!formState.value.recommend,
        sortNo: formState.value.sortNo ?? 0,
      };
      // DIRECT 不落库 method
      if (payload.resolveMode === RESOLVE_MODE.DIRECT) {
        payload.method = undefined;
      } else {
        payload.channelMchNo = undefined;
        payload.capability = undefined;
      }
      if (formEditType.value === FormEditType.Edit) {
        await CashierConfigApi.update(payload);
      } else {
        await CashierConfigApi.save(payload);
      }
      message.success($t('common.operationSuccess'));
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
    v-model:open="visible"
    :title="title"
    :size="800"
    :destroy-on-hidden="true"
    :mask-closable="showable"
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        layout="vertical"
        class="pt-2"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="$t('payment.merchant.cashier.cashier.name')" name="name">
              <a-input
                v-model:value="formState.name"
                :disabled="showable"
                :placeholder="$t('payment.merchant.cashier.cashier.namePlaceholder')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('payment.merchant.cashier.cashier.sortNo')" name="sortNo">
              <a-input-number
                v-model:value="formState.sortNo"
                :disabled="showable"
                class="w-full"
                :placeholder="$t('payment.merchant.cashier.cashier.sortNoPlaceholder')"
              />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item :label="$t('payment.merchant.cashier.cashier.resolveMode')" name="resolveMode">
              <a-radio-group
                v-model:value="formState.resolveMode"
                button-style="solid"
                :disabled="showable"
                @change="onResolveModeChange"
              >
                <a-radio-button :value="RESOLVE_MODE.METHOD">{{
                  $t('payment.merchant.cashier.cashier.modeMethod')
                }}</a-radio-button>
                <a-radio-button :value="RESOLVE_MODE.DIRECT">{{
                  $t('payment.merchant.cashier.cashier.modeDirect')
                }}</a-radio-button>
              </a-radio-group>
            </a-form-item>
          </a-col>

          <template v-if="formState.resolveMode === RESOLVE_MODE.METHOD">
            <a-col :span="24">
              <a-form-item :label="$t('payment.merchant.cashier.cashier.method')" name="method">
                <a-select
                  v-model:value="formState.method"
                  :disabled="showable"
                  show-search
                  option-filter-prop="label"
                  :options="methodOptions"
                  :placeholder="$t('payment.merchant.cashier.cashier.methodPlaceholder')"
                  @change="onMethodChange"
                />
              </a-form-item>
            </a-col>
          </template>

          <template v-else>
            <a-col :span="12">
              <a-form-item
                :label="$t('payment.merchant.cashier.cashier.channelMerchant')"
                name="channelMchNo"
              >
                <a-select
                  v-model:value="formState.channelMchNo"
                  :disabled="showable"
                  show-search
                  option-filter-prop="label"
                  :options="channelMchOptions"
                  :placeholder="$t('payment.merchant.cashier.cashier.channelMerchantPlaceholder')"
                  @change="onChannelMchChange"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item :label="$t('payment.merchant.cashier.cashier.capability')" name="capability">
                <a-select
                  v-model:value="formState.capability"
                  :disabled="showable || !formState.channelMchNo"
                  show-search
                  option-filter-prop="label"
                  :options="capabilityOptions"
                  :placeholder="$t('payment.merchant.cashier.cashier.capabilityPlaceholder')"
                  @change="onCapabilityChange"
                />
              </a-form-item>
            </a-col>
          </template>

          <a-col :span="12">
            <a-form-item :label="$t('payment.merchant.cashier.cashier.recommend')" name="recommend">
              <a-radio-group v-model:value="formState.recommend" button-style="solid" :disabled="showable">
                <a-radio-button :value="false">{{
                  $t('payment.merchant.cashier.cashier.recommendNo')
                }}</a-radio-button>
                <a-radio-button :value="true">{{
                  $t('payment.merchant.cashier.cashier.recommendYes')
                }}</a-radio-button>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="$t('payment.merchant.cashier.cashier.icon')" name="icon">
              <a-select
                v-model:value="formState.icon"
                :disabled="showable"
                show-search
                option-filter-prop="label"
                :options="iconOptions"
                :placeholder="$t('payment.merchant.cashier.cashier.iconPlaceholder')"
              >
                <template #optionRender="{ option }">
                  <img
                    v-if="getProviderSvgUrl(option.data.value)"
                    :src="getProviderSvgUrl(option.data.value)"
                    class="icon-inline"
                    :alt="option.data.label"
                  />
                  <span>{{ option.data.label }}</span>
                </template>
                <template #labelRender="{ label, value }">
                  <img
                    v-if="getProviderSvgUrl(value)"
                    :src="getProviderSvgUrl(value)"
                    class="icon-inline"
                    :alt="label"
                  />
                  <span>{{ label }}</span>
                </template>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
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

<style scoped>
  .icon-inline {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 4px;
    vertical-align: -3px;
    object-fit: contain;
  }
</style>
