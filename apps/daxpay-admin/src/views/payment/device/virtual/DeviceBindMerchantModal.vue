<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MchAppInfoApi } from '#/api/payment/merchant/mch-app-info.api';
  import { MerchantApi } from '#/api/payment/merchant/merchant.api';
  import { MchStoreInfoApi } from '#/api/payment/merchant/store.api';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * 虚拟设备绑定商户弹窗(商户+应用+门店三件套, 无代理商)
   *
   * 绑定商户并可选关联应用与门店: 应用空=商户默认应用, 门店空=商户通用设备。
   */
  defineOptions({ name: 'DeviceBindMerchantModal' });

  const props = defineProps<{
    /** 设备台账 API(bindMerchant) */
    api: { bindMerchant: (data: any) => Promise<any> };
  }>();

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const visible = ref(false);
  const confirmLoading = ref(false);
  const formRef = ref();

  // 调整模式: 设备已绑定商户时回填当前归属并锁定商户, 仅允许改应用/门店
  const boundMode = ref(false);

  // 待绑定设备 id
  const ids = ref<string[]>([]);
  // 商户下拉
  const mchOptions = ref<LabelValue[]>([]);
  // 应用下拉(随商户级联, 可空=默认应用)
  const appOptions = ref<LabelValue[]>([]);
  // 门店下拉(随商户级联, 可空)
  const storeOptions = ref<LabelValue[]>([]);

  const formState = ref<{ appId?: string; mchNo?: string; storeNo?: string }>({
    mchNo: undefined,
    appId: undefined,
    storeNo: undefined,
  });

  const formRules = {
    // 请选择商户
    mchNo: [{ required: true, message: $t('payment.device.virtual.bind.validationMchNo') }],
  };

  /**
   * 加载商户下拉
   */
  async function loadMchOptions() {
    const { data } = await MerchantApi.dropdown(false, true);
    mchOptions.value = data || [];
  }

  /**
   * 按商户加载应用下拉
   */
  async function loadAppOptions(mchNo?: string) {
    appOptions.value = [];
    formState.value.appId = undefined;
    if (!mchNo) {
      return;
    }
    const { data } = await MchAppInfoApi.enableList(mchNo);
    appOptions.value = (data || []).map((item) => {
      const base = item.appName ? `${item.appName} (${item.appId})` : (item.appId as string);
      // 默认应用标注
      const label = item.defaultApp ? `${base} [${$t('payment.device.virtual.bind.defaultApp')}]` : base;
      return { label, value: item.appId as string };
    });
  }

  /**
   * 按商户加载门店下拉
   */
  async function loadStoreOptions(mchNo?: string) {
    storeOptions.value = [];
    formState.value.storeNo = undefined;
    if (!mchNo) {
      return;
    }
    const { data } = await MchStoreInfoApi.page({
      mchNo,
      current: 1,
      size: 200,
    });
    storeOptions.value = (data?.records || []).map((item: any) => ({
      label: item.storeName ? `${item.storeName} (${item.storeNo})` : (item.storeNo as string),
      value: item.storeNo as string,
    }));
  }

  /**
   * 商户变更: 级联刷新应用与门店
   */
  function handleMchChange(value: string) {
    loadAppOptions(value);
    loadStoreOptions(value);
  }

  /**
   * 打开绑定弹窗
   *
   * @param selectedIds 待绑定设备 id
   * @param current     当前归属(已绑定设备回填并锁定商户, 仅允许改应用/门店)
   */
  async function show(selectedIds: string[], current?: { appId?: string; mchNo?: string; storeNo?: string }) {
    ids.value = selectedIds;
    boundMode.value = !!current?.mchNo;
    // resetFields 须在赋值前调用, 否则会把回填的商户号重置回初始空值
    formRef.value?.resetFields();
    formState.value = { mchNo: current?.mchNo, appId: undefined, storeNo: undefined };
    appOptions.value = [];
    storeOptions.value = [];
    visible.value = true;
    await loadMchOptions();
    if (!current?.mchNo) {
      return;
    }
    // 级联加载内部会先清空下级, 故回填须待下拉选项就绪后再赋值
    await Promise.all([loadAppOptions(current.mchNo), loadStoreOptions(current.mchNo)]);
    // 加载期间弹窗被切换到其他设备时丢弃本次回填(防异步竞态串显)
    if (formState.value.mchNo !== current.mchNo) {
      return;
    }
    formState.value.appId = current.appId;
    formState.value.storeNo = current.storeNo;
  }

  function handleCancel() {
    visible.value = false;
  }

  /**
   * 提交绑定: 应用/门店均可空(应用空则支付走商户默认应用, 门店空则为商户通用设备)
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    confirmLoading.value = true;
    try {
      await props.api.bindMerchant({
        ids: ids.value,
        mchNo: formState.value.mchNo,
        appId: formState.value.appId,
        storeNo: formState.value.storeNo,
      });
      message.success($t('common.operationSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="boundMode ? $t('payment.device.virtual.actionAdjust') : $t('payment.device.virtual.bind.title')"
    :width="560"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical">
        <!-- 商户号(调整模式锁定, 换商户须先解绑) -->
        <a-form-item
          :label="$t('payment.device.virtual.field.mchNo')"
          name="mchNo"
          :extra="boundMode ? $t('payment.device.virtual.bind.mchLockedHint') : undefined"
        >
          <a-select
            v-model:value="formState.mchNo"
            :options="mchOptions"
            :placeholder="$t('common.pleaseSelect')"
            :disabled="boundMode"
            show-search
            option-filter-prop="label"
            @change="handleMchChange"
          />
        </a-form-item>
        <!-- 应用(可空=默认应用) -->
        <a-form-item :label="$t('payment.device.virtual.field.appName')" name="appId">
          <a-select
            v-model:value="formState.appId"
            :options="appOptions"
            :placeholder="$t('payment.device.virtual.bind.appPlaceholder')"
            :disabled="!formState.mchNo"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <!-- 门店(可空=商户通用设备) -->
        <a-form-item :label="$t('payment.device.virtual.field.storeName')" name="storeNo">
          <a-select
            v-model:value="formState.storeNo"
            :options="storeOptions"
            :placeholder="$t('payment.device.virtual.bind.storePlaceholder')"
            :disabled="!formState.mchNo"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
