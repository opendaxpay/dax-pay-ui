<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { HkrtChannelMerchantApi } from '#/api/payment/channel/hkrt/channel-merchant.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'HkrtMchConfigEdit' });

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();
  const visible = ref(false);
  const confirmLoading = ref(false);
  const channelMchNo = ref('');

  const formState = ref({
    pn: '',
  });

  const title = $t('payment.channel.hkrtIsv.mchConfigTitle');

  const formRules = {
    pn: [{ required: true, message: $t('payment.channel.hkrtIsv.validation.pn') }],
  };

  /** 打开配置弹窗 */
  function show(mchChannelNo: string, currentPn?: string) {
    channelMchNo.value = mchChannelNo;
    formState.value.pn = currentPn ?? '';
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
    HkrtChannelMerchantApi.updatePn(channelMchNo.value, formState.value.pn)
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
      <!-- 国际化: SAAS 终端号 -->
      <a-form-item :label="$t('payment.channel.hkrtIsv.pn')" name="pn">
        <a-input
          v-model:value="formState.pn"
          :placeholder="$t('payment.channel.hkrtIsv.pnPlaceholder')"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
