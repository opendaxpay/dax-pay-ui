<script lang="ts" setup>
  import type { ChannelMerchantResult } from '#/api/payment/channel/channel-merchant.api';

  import { nextTick, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { ChannelMerchantApi } from '#/api/payment/channel/channel-merchant.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ChannelMerchantNameEditModal' });

  const props = defineProps<{
    channelMerchant: ChannelMerchantResult;
  }>();

  const emit = defineEmits<{
    (e: 'success'): void;
  }>();

  const { message } = useMessage();

  const visible = ref(false);
  const saving = ref(false);
  const formRef = ref();
  // 表单数据
  const form = reactive({
    channelMerchantName: '',
  });

  // 表单校验规则
  const rules = {
    channelMerchantName: [
      {
        required: true,
        message: $t('payment.merchant.channelMerchant.channelMerchantNameRequired'),
        trigger: 'blur',
      },
    ],
  };

  /** 打开弹窗, 回填当前商户名称 */
  function open() {
    form.channelMerchantName = props.channelMerchant.channelMerchantName || '';
    visible.value = true;
    nextTick(() => {
      formRef.value?.clearValidate();
    });
  }

  /** 关闭弹窗 */
  function close() {
    visible.value = false;
  }

  /** 保存商户名称 */
  function handleSave() {
    formRef.value?.validate().then(() => {
      const id = props.channelMerchant.id;
      if (!id) {
        message.warning($t('payment.merchant.channelMerchant.missingId'));
        return;
      }
      saving.value = true;
      ChannelMerchantApi.update({
        id,
        channelMerchantName: form.channelMerchantName.trim(),
      })
        .then(() => {
          message.success($t('payment.merchant.channelMerchant.editMerchantNameSuccess'));
          emit('success');
          close();
        })
        .finally(() => {
          saving.value = false;
        });
    });
  }

  defineExpose({ open, close });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.merchant.channelMerchant.editMerchantNameTitle')"
    :confirm-loading="saving"
    :ok-text="$t('common.save')"
    :cancel-text="$t('common.cancelText')"
    destroy-on-hidden
    @ok="handleSave"
  >
    <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <!-- 国际化: 商户名称 -->
      <a-form-item :label="$t('payment.merchant.channelMerchant.channelMerchantName')" name="channelMerchantName">
        <a-input
          v-model:value="form.channelMerchantName"
          :placeholder="$t('payment.merchant.channelMerchant.pleaseInputName')"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
