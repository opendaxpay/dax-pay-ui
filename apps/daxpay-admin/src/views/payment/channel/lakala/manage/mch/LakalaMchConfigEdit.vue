<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { LakalaChannelMerchantApi } from '#/api/payment/channel/lakala/channel-merchant.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'LakalaMchConfigEdit' });

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();
  const visible = ref(false);
  const confirmLoading = ref(false);
  const channelMchNo = ref('');

  const formState = ref({
    termNo: '',
  });

  const title = $t('payment.channel.lakalaIsv.mchConfigTitle');

  const formRules = {
    termNo: [{ required: true, message: $t('payment.channel.lakalaIsv.validation.termNo') }],
  };

  /** 打开配置弹窗 */
  function show(mchChannelNo: string, currentTermNo?: string) {
    channelMchNo.value = mchChannelNo;
    formState.value.termNo = currentTermNo ?? '';
    visible.value = true;
  }

  function handleCancel() {
    visible.value = false;
  }

  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      // 校验失败: 表单已显示错误提示
      return;
    }
    confirmLoading.value = true;
    LakalaChannelMerchantApi.updateTermNo(channelMchNo.value, formState.value.termNo)
      .then(() => {
        message.success($t('common.saveSuccess'));
        handleCancel();
        emit('ok');
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  defineExpose({ show });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="480"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <!-- 国际化: 终端号 -->
      <a-form-item :label="$t('payment.channel.lakalaIsv.termNo')" name="termNo">
        <a-input
          v-model:value="formState.termNo"
          :placeholder="$t('payment.channel.lakalaIsv.termNoPlaceholder')"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
