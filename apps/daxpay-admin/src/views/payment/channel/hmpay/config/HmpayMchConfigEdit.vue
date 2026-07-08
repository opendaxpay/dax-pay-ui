<script lang="ts" setup>
  import type { HmpayIsvChannelMerchantUpdateParam } from '#/api/payment/channel/hmpay/channel-merchant.api';

  import { nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    HmpayChannelMerchantApi,
    type HmpayIsvChannelMerchant,
  } from '#/api/payment/channel/hmpay/channel-merchant.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'HmpayMchConfigEdit' });

  const props = defineProps<{ channelMchNo: string }>();
  const emit = defineEmits(['ok']);

  const { labelCol, wrapperCol, modalWidth, confirmLoading, visible, handleCancel } = useFormEdit();
  const { message } = useMessage();

  const formRef = ref();
  // 回填的完整配置(merchantNo 只读展示), 提交时仅下送可编辑字段
  const form = ref<HmpayIsvChannelMerchant>({} as HmpayIsvChannelMerchant);

  /** 打开弹窗并加载河马付通道商户配置 */
  function init() {
    visible.value = true;
    resetForm();
    loadConfig();
  }

  function loadConfig() {
    confirmLoading.value = true;
    HmpayChannelMerchantApi.findByChannelMchNo(props.channelMchNo)
      .then(({ data }) => {
        form.value = { ...data } as HmpayIsvChannelMerchant;
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  function resetForm() {
    nextTick(() => {
      formRef.value?.resetFields();
    });
  }

  /** 保存可选配置(门店号), merchantNo 为核心识别字段不可改 */
  async function handleOk() {
    confirmLoading.value = true;
    const param: HmpayIsvChannelMerchantUpdateParam = {
      channelMchNo: props.channelMchNo,
      storeId: form.value.storeId,
    };
    HmpayChannelMerchantApi.updateConfig(param)
      .then(() => {
        message.success($t('common.saveSuccess'));
        handleCancel();
        emit('ok');
      })
      .finally(() => {
        confirmLoading.value = false;
      });
  }

  defineExpose({ init });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.channel.hmpayIsv.mchConfigTitle')"
    :width="modalWidth"
    :confirm-loading="confirmLoading"
    :ok-text="$t('common.save')"
    :cancel-text="$t('common.cancel')"
    :mask-closable="false"
    destroy-on-hidden
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form ref="formRef" :model="form" :label-col="labelCol" :wrapper-col="wrapperCol">
        <!-- 国际化: 杉德商户号(核心识别字段, 创建后只读) -->
        <a-form-item :label="$t('payment.channel.hmpayIsv.merchantNo')" name="merchantNo">
          <a-input :value="form.merchantNo" disabled />
        </a-form-item>

        <!-- 国际化: 门店号 -->
        <a-form-item :label="$t('payment.channel.hmpayIsv.storeId')" name="storeId">
          <a-input v-model:value="form.storeId" :placeholder="$t('payment.channel.hmpayIsv.storeIdPlaceholder')" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>
