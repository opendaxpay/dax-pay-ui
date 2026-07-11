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

  // DIRECT 模式用：目录 method 仅作候选过滤，不落库
  const filterMethod = ref('');

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
  // method value → provider（加载通道商户用）
  const methodProviderMap = ref<Record<string, string>>({});
  const channelMchOptions = ref<LabelValue[]>([]);
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
    filterMethod.value = '';
    channelMchOptions.value = [];
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
      const providerLabel = item.provider || '';
      options.push({
        label: providerLabel ? `${providerLabel} / ${label}` : label,
        value: item.method,
      });
      providerMap[item.method] = item.provider;
    }
    methodOptions.value = options;
    methodProviderMap.value = providerMap;
  }

  /** DIRECT：按 filterMethod 加载通道商户 */
  async function loadChannelMchOptions(method: string) {
    channelMchOptions.value = [];
    capabilityOptions.value = [];
    if (!method || !context.value.appId) {
      return;
    }
    const provider = methodProviderMap.value[method];
    if (!provider) {
      return;
    }
    const { data } = await PayRouteApi.listSceneChannelMchCandidates({
      appId: context.value.appId,
      provider,
      method,
    });
    channelMchOptions.value = data || [];
  }

  /** DIRECT：加载支付能力 */
  async function loadCapabilityOptions(method: string, channelMchNo: string) {
    capabilityOptions.value = [];
    if (!method || !channelMchNo || !context.value.appId) {
      return;
    }
    const provider = methodProviderMap.value[method];
    if (!provider) {
      return;
    }
    const { data } = await PayRouteApi.listSceneCapabilityCandidates({
      appId: context.value.appId,
      provider,
      method,
      channelMchNo,
    });
    capabilityOptions.value = data || [];
  }

  /** 解析模式切换 */
  function onResolveModeChange() {
    formState.value.method = undefined;
    formState.value.channelMchNo = undefined;
    formState.value.capability = undefined;
    filterMethod.value = '';
    channelMchOptions.value = [];
    capabilityOptions.value = [];
  }

  /** DIRECT 过滤 method 变更 */
  async function onFilterMethodChange(method: any) {
    filterMethod.value = method || '';
    formState.value.channelMchNo = undefined;
    formState.value.capability = undefined;
    await loadChannelMchOptions(filterMethod.value);
  }

  /** 通道商户变更 */
  async function onChannelMchChange(channelMchNo: any) {
    formState.value.channelMchNo = channelMchNo || undefined;
    formState.value.capability = undefined;
    if (channelMchNo && filterMethod.value) {
      await loadCapabilityOptions(filterMethod.value, channelMchNo);
    } else {
      capabilityOptions.value = [];
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
      // DIRECT 编辑时无法还原 filterMethod，需用户重选目录方式加载候选；若已有 channelMch 则尝试 batch 匹配
      if (formState.value.resolveMode === RESOLVE_MODE.DIRECT && row.channelMchNo) {
        await tryRestoreDirectCandidates(row.channelMchNo, row.capability);
      }
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 编辑 DIRECT 项时尝试用 batch 候选还原 filterMethod / 选项
   */
  async function tryRestoreDirectCandidates(channelMchNo: string, capability?: string) {
    const { data } = await PayRouteApi.listSceneChannelMchCandidatesBatch({
      appId: context.value.appId,
    });
    if (!data) {
      return;
    }
    for (const [key, list] of Object.entries(data)) {
      const hit = (list || []).some((item) => item.value === channelMchNo);
      if (!hit) {
        continue;
      }
      // key = provider|method
      const parts = key.split('|');
      const method = parts.length >= 2 ? parts[1]! : '';
      if (method) {
        filterMethod.value = method;
        await loadChannelMchOptions(method);
        if (channelMchNo) {
          formState.value.channelMchNo = channelMchNo;
          await loadCapabilityOptions(method, channelMchNo);
          formState.value.capability = capability;
        }
        return;
      }
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
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="720"
    :confirm-loading="confirmLoading"
    :mask-closable="showable"
    destroy-on-close
    @ok="handleOk"
    @cancel="handleCancel"
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
                allow-clear
                :options="iconOptions"
                :placeholder="$t('payment.merchant.cashier.cashier.iconPlaceholder')"
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
                />
              </a-form-item>
            </a-col>
          </template>

          <template v-else>
            <a-col :span="24">
              <a-form-item :label="$t('payment.merchant.cashier.cashier.method')">
                <a-select
                  v-model:value="filterMethod"
                  :disabled="showable"
                  show-search
                  option-filter-prop="label"
                  :options="methodOptions"
                  :placeholder="$t('payment.merchant.cashier.cashier.methodPlaceholder')"
                  @change="onFilterMethodChange"
                />
                <div class="mt-1 text-xs text-muted-foreground">
                  {{ $t('payment.merchant.cashier.cashier.methodFilterHint') }}
                </div>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item
                :label="$t('payment.merchant.cashier.cashier.channelMerchant')"
                name="channelMchNo"
              >
                <a-select
                  v-model:value="formState.channelMchNo"
                  :disabled="showable || !filterMethod"
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
                />
              </a-form-item>
            </a-col>
          </template>
        </a-row>
      </a-form>
    </a-spin>
  </a-modal>
</template>
