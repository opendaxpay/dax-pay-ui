<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    PayRiskHitApi,
    type PayRiskHitHandleParam,
    type PayRiskHitVo,
  } from '#/api/payment/risk/risk-hit.api';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);
  const { message } = useMessage();

  const visible = ref(false);
  const confirmLoading = ref(false);
  const formRef = ref();
  const current = ref<PayRiskHitVo>({});
  const formState = ref<PayRiskHitHandleParam>({
    id: '',
    handleStatus: 'ignored',
    handleRemark: '',
  });

  /** 打开处理弹窗 */
  function showHandle(row: PayRiskHitVo) {
    current.value = row;
    formState.value = {
      id: row.id!,
      handleStatus: 'ignored',
      handleRemark: '',
    };
    visible.value = true;
  }

  /** 取消 */
  function handleCancel() {
    visible.value = false;
  }

  /** 提交处理 */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    confirmLoading.value = true;
    try {
      await PayRiskHitApi.handle(formState.value);
      message.success($t('common.saveSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ showHandle });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.risk.hit.handleTitle')"
    :width="520"
    :destroy-on-hidden="true"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <div class="mb-4 text-sm text-gray-500">
        {{ $t('payment.risk.hit.field.hitType') }}: {{ current.hitType }} /
        {{ $t('payment.risk.hit.field.hitValue') }}: {{ current.hitValue }}
      </div>
      <a-form ref="formRef" :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <!-- 处理状态 -->
        <a-form-item
          :label="$t('payment.risk.hit.field.handleStatus')"
          name="handleStatus"
          :rules="[{ required: true, message: $t('common.pleaseSelect') }]"
        >
          <a-select v-model:value="formState.handleStatus" :placeholder="$t('common.pleaseSelect')">
            <a-select-option value="ignored">
              {{ $t('payment.risk.hit.handleStatus.ignored') }}
            </a-select-option>
            <a-select-option value="added_blacklist">
              {{ $t('payment.risk.hit.handleStatus.added_blacklist') }}
            </a-select-option>
            <a-select-option value="merchant_disabled">
              {{ $t('payment.risk.hit.handleStatus.merchant_disabled') }}
            </a-select-option>
            <a-select-option value="other">
              {{ $t('payment.risk.hit.handleStatus.other') }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <!-- 处理说明 -->
        <a-form-item :label="$t('payment.risk.hit.field.handleRemark')" name="handleRemark">
          <a-textarea v-model:value="formState.handleRemark" :rows="3" :maxlength="500" />
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-button @click="handleCancel">{{ $t('common.cancel') }}</a-button>
      <a-button type="primary" :loading="confirmLoading" @click="handleOk">
        {{ $t('common.save') }}
      </a-button>
    </template>
  </a-modal>
</template>
