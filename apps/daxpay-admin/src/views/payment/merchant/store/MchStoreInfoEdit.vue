<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MchStoreInfoApi, type MchStoreInfoParam, type MchStoreInfoResult } from '#/api/payment/merchant/store.api';
  import { RegionCascader } from '#/components/region';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();
  const mchNo = ref('');

  const { visible, confirmLoading, title, initFormEditType, handleCancel, formEditType, showable } = useFormEdit();

  const formState = ref<MchStoreInfoParam>({
    mchNo: '',
    storeName: '',
    status: 'enable',
    defaultStore: false,
  });

  const statusOptions = computed(() => [
    { label: $t('payment.merchant.store.store.status.enable'), value: 'enable' },
    { label: $t('payment.merchant.store.store.status.disabled'), value: 'disabled' },
  ]);

  const formRules = computed(() => ({
    storeName: [{ required: true, message: $t('payment.merchant.store.store.validationStoreName') }],
    status: [{ required: true, message: $t('payment.merchant.store.store.validationStatus') }],
    // 默认门店必选
    defaultStore: [{ required: true, message: $t('payment.merchant.store.store.validationDefaultStore') }],
  }));

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      mchNo: mchNo.value,
      storeName: '',
      status: 'enable',
      defaultStore: false,
    };
    formRef.value?.resetFields();
  }

  /**
   * 打开新增弹窗
   */
  function show(no: string) {
    mchNo.value = no;
    initFormEditType(FormEditType.Add);
    resetForm();
  }

  /**
   * 加载详情数据并填充表单
   */
  async function fillForm(record: MchStoreInfoResult) {
    confirmLoading.value = true;
    try {
      const { data } = await MchStoreInfoApi.get(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        mchNo: mchNo.value,
        storeName: row.storeName,
        contactPhone: row.contactPhone,
        logoUrl: row.logoUrl,
        facadeUrl: row.facadeUrl,
        interiorUrl: row.interiorUrl,
        regionCode: row.regionCode,
        address: row.address,
        longitude: row.longitude,
        latitude: row.latitude,
        status: row.status || 'enable',
        defaultStore: !!row.defaultStore,
        remark: row.remark,
      };
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 打开编辑弹窗
   */
  async function showEdit(no: string, record: MchStoreInfoResult) {
    mchNo.value = no;
    initFormEditType(FormEditType.Edit);
    resetForm();
    await fillForm(record);
  }

  /**
   * 打开查看弹窗
   */
  async function showView(no: string, record: MchStoreInfoResult) {
    mchNo.value = no;
    initFormEditType(FormEditType.Show);
    resetForm();
    await fillForm(record);
  }

  /**
   * 保存
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败：表单已显示错误提示
      return;
    }
    confirmLoading.value = true;
    try {
      const payload: MchStoreInfoParam = {
        ...formState.value,
        mchNo: mchNo.value,
      };
      await (formEditType.value === FormEditType.Edit ? MchStoreInfoApi.update(payload) : MchStoreInfoApi.add(payload));
      message.success($t('common.operationSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ show, showEdit, showView });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="title"
    :size="650"
    :destroy-on-hidden="true"
    :mask-closable="showable"
    :styles="{ footer: { textAlign: 'right' } }"
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="form-compact"
      >
        <!-- 门店名称 -->
        <a-form-item :label="$t('payment.merchant.store.store.field.storeName')" name="storeName">
          <a-input v-model:value="formState.storeName" :disabled="showable" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 状态 -->
        <a-form-item :label="$t('payment.merchant.store.store.field.status')" name="status">
          <a-select v-model:value="formState.status" :disabled="showable" :options="statusOptions" />
        </a-form-item>
        <!-- 默认门店(必选) -->
        <a-form-item :label="$t('payment.merchant.store.store.defaultStore')" name="defaultStore">
          <a-radio-group v-model:value="formState.defaultStore" button-style="solid" :disabled="showable">
            <a-radio-button :value="true">{{ $t('common.yes') }}</a-radio-button>
            <a-radio-button :value="false">{{ $t('common.no') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <!-- 联系人电话 -->
        <a-form-item :label="$t('payment.merchant.store.store.field.contactPhone')">
          <a-input
            v-model:value="formState.contactPhone"
            :disabled="showable"
            :placeholder="$t('common.pleaseInput')"
          />
        </a-form-item>
        <!-- 图片字段(门店LOGO/门头照/门店内景照)暂隐藏, 字段逻辑保留于 script -->
        <!-- 所在地区 -->
        <a-form-item :label="$t('payment.merchant.store.store.field.region')">
          <RegionCascader
            v-model="formState.regionCode"
            :level="3"
            :disabled="showable"
            :placeholder="$t('payment.merchant.store.store.regionPlaceholder')"
          />
        </a-form-item>
        <!-- 详细地址 -->
        <a-form-item :label="$t('payment.merchant.store.store.field.address')">
          <a-input v-model:value="formState.address" :disabled="showable" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 经度 -->
        <a-form-item :label="$t('payment.merchant.store.store.field.longitude')">
          <a-input-number
            v-model:value="formState.longitude"
            :precision="7"
            :step="0.0000001"
            :disabled="showable"
            :placeholder="$t('common.pleaseInput')"
            style="width: 100%"
          />
        </a-form-item>
        <!-- 纬度 -->
        <a-form-item :label="$t('payment.merchant.store.store.field.latitude')">
          <a-input-number
            v-model:value="formState.latitude"
            :precision="7"
            :step="0.0000001"
            :disabled="showable"
            :placeholder="$t('common.pleaseInput')"
            style="width: 100%"
          />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item :label="$t('payment.merchant.store.store.field.remark')">
          <a-textarea
            v-model:value="formState.remark"
            :rows="2"
            :disabled="showable"
            :placeholder="$t('common.pleaseInput')"
          />
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
