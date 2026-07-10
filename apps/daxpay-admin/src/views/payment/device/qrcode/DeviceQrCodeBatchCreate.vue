<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import dayjs from 'dayjs';

  import {
    DeviceQrCodeApi,
    type DeviceQrCodeBatchParam,
  } from '#/api/payment/device/qrcode.api';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const visible = ref(false);
  const confirmLoading = ref(false);
  const formRef = ref();
  // 固定金额展示值(元)
  const fixedAmountYuan = ref<number | undefined>(undefined);

  const formState = ref<DeviceQrCodeBatchParam>({
    batchNo: '',
    count: 10,
    amountType: 'random',
    status: 'enabled',
  });

  const isFixedAmount = computed(() => formState.value.amountType === 'fixed');

  const formRules = computed(() => ({
    batchNo: [{ required: true, message: $t('payment.device.qrcode.validateBatchNo') }],
    count: [{ required: true, message: $t('payment.device.qrcode.validateCount') }],
    amountType: [{ required: true, message: $t('payment.device.qrcode.validateAmountType') }],
    status: [{ required: true, message: $t('payment.device.qrcode.validateStatus') }],
  }));

  /**
   * 一键生成批次号: Q + YYMMDDHHmmss(对齐商业版)
   */
  function genBatchNo() {
    formState.value.batchNo = `Q${dayjs().format('YYMMDDHHmmss')}`;
    // 生成后异步校验是否已存在
    checkBatchNo();
  }

  /**
   * 打开批量生成弹窗, 默认填入批次号
   * destroy-on-hidden 时需先挂载表单再赋值, 避免 Form 与 model 时序错位
   */
  async function show() {
    formState.value = {
      batchNo: '',
      count: 10,
      amountType: 'random',
      status: 'enabled',
    };
    fixedAmountYuan.value = undefined;
    visible.value = true;
    await nextTick();
    formRef.value?.clearValidate?.();
    // 自动生成批次号
    genBatchNo();
  }

  /**
   * 关闭弹窗
   */
  function handleCancel() {
    visible.value = false;
  }

  /**
   * 失焦/生成后校验批次号是否已存在
   */
  async function checkBatchNo() {
    const batchNo = formState.value.batchNo?.trim();
    if (!batchNo) {
      return;
    }
    const { data } = await DeviceQrCodeApi.existsByBatchNo(batchNo);
    if (data) {
      message.warning($t('payment.device.qrcode.batchNoExists'));
    }
  }

  /**
   * 提交批量创建
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    if (isFixedAmount.value && (fixedAmountYuan.value === undefined || fixedAmountYuan.value <= 0)) {
      message.error($t('payment.device.qrcode.validateFixedAmount'));
      return;
    }
    confirmLoading.value = true;
    try {
      const payload: DeviceQrCodeBatchParam = {
        ...formState.value,
        batchNo: formState.value.batchNo?.trim(),
        fixedAmount:
          isFixedAmount.value && fixedAmountYuan.value
            ? Math.round(fixedAmountYuan.value * 100)
            : undefined,
      };
      // 再校验一次批次号
      const { data: exists } = await DeviceQrCodeApi.existsByBatchNo(payload.batchNo!);
      if (exists) {
        message.error($t('payment.device.qrcode.batchNoExists'));
        return;
      }
      await DeviceQrCodeApi.createBatch(payload);
      message.success(
        $t('payment.device.qrcode.batchCreateSuccess', { count: payload.count ?? 0 }),
      );
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
    :title="$t('payment.device.qrcode.batchCreate')"
    :width="640"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :mask-closable="false"
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
        class="form-compact"
      >
        <a-form-item :label="$t('payment.device.qrcode.field.batchNo')" name="batchNo">
          <!-- antdv-next: Compact block 占满; 输入框 flex:1 吃掉剩余宽度, 与其它 width:100% 表单项对齐 -->
          <a-space-compact block style="width: 100%">
            <a-input
              v-model:value="formState.batchNo"
              :placeholder="$t('payment.device.qrcode.batchNoPlaceholder')"
              style="flex: 1; min-width: 0"
              @blur="checkBatchNo"
            />
            <a-button type="primary" @click="genBatchNo">
              {{ $t('payment.device.qrcode.genBatchNo') }}
            </a-button>
          </a-space-compact>
        </a-form-item>
        <a-form-item :label="$t('payment.device.qrcode.field.count')" name="count">
          <a-input-number
            v-model:value="formState.count"
            :min="1"
            :max="999"
            :precision="0"
            style="width: 100%"
            :placeholder="$t('common.pleaseInput')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.device.qrcode.field.name')">
          <a-input v-model:value="formState.name" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <a-form-item :label="$t('payment.device.qrcode.field.amountType')" name="amountType">
          <a-radio-group v-model:value="formState.amountType" button-style="solid">
            <a-radio-button value="random">{{ $t('payment.device.qrcode.amountType.random') }}</a-radio-button>
            <a-radio-button value="fixed">{{ $t('payment.device.qrcode.amountType.fixed') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item v-if="isFixedAmount" :label="$t('payment.device.qrcode.field.fixedAmount')">
          <a-input-number
            v-model:value="fixedAmountYuan"
            :min="0.01"
            :step="0.01"
            :precision="2"
            style="width: 100%"
            :placeholder="$t('common.pleaseInput')"
          />
        </a-form-item>
        <a-form-item :label="$t('payment.device.qrcode.field.status')" name="status">
          <a-radio-group v-model:value="formState.status" button-style="solid">
            <a-radio-button value="enabled">{{ $t('payment.device.qrcode.status.enabled') }}</a-radio-button>
            <a-radio-button value="disabled">{{ $t('payment.device.qrcode.status.disabled') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item :label="$t('payment.device.qrcode.field.remark')">
          <a-textarea v-model:value="formState.remark" :rows="2" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
