<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { DeviceQrCodeApi, type DeviceQrCodeParam, type DeviceQrCodeResult } from '#/api/payment/device/qrcode.api';
  import { FormEditType } from '#/enums/formEditType';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();

  const { visible, confirmLoading, title, initFormEditType, handleCancel } = useFormEdit();

  // 编辑态只读展示用商户名称(不参与提交)
  const editMchName = ref('');
  // 落地程序类型只读(创建后不可改)
  const editProgramType = ref('h5');

  const formState = ref<DeviceQrCodeParam>({
    name: '',
    amountType: 'random',
  });

  // 金额类型为固定时, 固定金额必填
  const isFixedAmount = computed(() => formState.value.amountType === 'fixed');

  // formState.fixedAmount 以「元」存储, 提交时再×100转分
  const formRules = computed(() => {
    const rules: Record<string, any[]> = {
      name: [{ required: true, message: $t('payment.device.qrcode.validateName') }],
      amountType: [{ required: true, message: $t('payment.device.qrcode.validateAmountType') }],
    };
    if (isFixedAmount.value) {
      rules.fixedAmount = [
        { required: true, message: $t('payment.device.qrcode.validateFixedAmount') },
        {
          type: 'number',
          min: 0.01,
          message: $t('payment.device.qrcode.validateFixedAmount'),
        },
      ];
    }
    return rules;
  });

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      name: '',
      amountType: 'random',
      fixedAmount: undefined,
    };
    editMchName.value = '';
    editProgramType.value = 'h5';
    formRef.value?.resetFields();
  }

  /**
   * 打开编辑弹窗(归属只读)
   */
  async function showEdit(record: DeviceQrCodeResult) {
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    try {
      const { data } = await DeviceQrCodeApi.get(record.id!);
      const row = data || record;
      formState.value = {
        id: row.id!,
        name: row.name,
        mchNo: row.mchNo,
        amountType: row.amountType,
        // 分转元展示
        fixedAmount: row.fixedAmount ? row.fixedAmount / 100 : undefined,
        remark: row.remark,
      };
      editMchName.value = row.mchName || '';
      // 类型只读展示, 不参与提交
      editProgramType.value = row.programType || 'h5';
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 保存
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败: 表单已显示错误提示
      return;
    }
    confirmLoading.value = true;
    try {
      // 金额元转分, 在构造时一次性赋值避免对对象立即修改
      const payload: DeviceQrCodeParam = {
        id: formState.value.id,
        name: formState.value.name,
        amountType: formState.value.amountType,
        fixedAmount:
          isFixedAmount.value && formState.value.fixedAmount
            ? Math.round(formState.value.fixedAmount * 100)
            : undefined,
        remark: formState.value.remark,
      };
      await DeviceQrCodeApi.update(payload);
      message.success($t('common.operationSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  // import 放最后避免循环依赖(参照项目惯例)
  defineExpose({ showEdit });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
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
        <!-- 归属只读 -->
        <a-form-item :label="$t('payment.device.qrcode.field.mchName')">
          <a-tag v-if="formState.mchNo" color="blue">{{ editMchName || formState.mchNo }}</a-tag>
          <a-tag v-else color="default">{{ $t('payment.device.qrcode.unbound') }}</a-tag>
        </a-form-item>
        <a-form-item :label="$t('payment.device.qrcode.field.mchNo')">
          <a-tag v-if="formState.mchNo" color="blue">{{ formState.mchNo }}</a-tag>
          <a-tag v-else color="default">{{ $t('payment.device.qrcode.unbound') }}</a-tag>
        </a-form-item>
        <!-- 码牌类型只读(创建后不可改) -->
        <a-form-item :label="$t('payment.device.qrcode.field.programType')">
          <a-tag v-if="editProgramType === 'mini_app'" color="purple">
            {{ $t('payment.device.qrcode.programType.mini_app') }}
          </a-tag>
          <a-tag v-else color="blue">
            {{ $t('payment.device.qrcode.programType.h5') }}
          </a-tag>
        </a-form-item>
        <!-- 码牌名称 -->
        <a-form-item :label="$t('payment.device.qrcode.field.name')" name="name">
          <a-input v-model:value="formState.name" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
        <!-- 金额类型 -->
        <a-form-item :label="$t('payment.device.qrcode.field.amountType')" name="amountType">
          <a-radio-group v-model:value="formState.amountType" button-style="solid">
            <a-radio-button value="random">{{ $t('payment.device.qrcode.amountType.random') }}</a-radio-button>
            <a-radio-button value="fixed">{{ $t('payment.device.qrcode.amountType.fixed') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <!-- 固定金额(仅固定金额类型显示, 表单内以元存储) -->
        <a-form-item v-if="isFixedAmount" :label="$t('payment.device.qrcode.field.fixedAmount')" name="fixedAmount">
          <a-input-number
            v-model:value="formState.fixedAmount"
            :min="0.01"
            :step="0.01"
            :precision="2"
            style="width: 100%"
            :placeholder="$t('common.pleaseInput')"
          />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item :label="$t('payment.device.qrcode.field.remark')">
          <a-textarea v-model:value="formState.remark" :rows="2" :placeholder="$t('common.pleaseInput')" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
