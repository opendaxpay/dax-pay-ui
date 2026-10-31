<script lang="ts" setup>
  import type { MockIsvInfoResult } from '#/api/payment/channel/mock/isv-info.api';

  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MockIsvInfoApi } from '#/api/payment/channel/mock/isv-info.api';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * Mock 模拟服务商新建/编辑弹窗
   *
   * 同一弹窗承担新建/编辑/启停: show() 不传参=新建, 传行数据=编辑;
   * 启用绑定(enable)控制新通道商户绑定, 启用支付(payEnable)控制新支付请求, 两开关相互独立。
   */
  defineOptions({ name: 'MockIsvInfoEditModal' });

  const emit = defineEmits<{ ok: [] }>();

  const { message } = useMessage();

  const visible = ref(false);
  const confirmLoading = ref(false);
  const formRef = ref();

  const formState = ref<{
    enable: boolean;
    id?: null | string;
    isvName?: string;
    isvNo?: string;
    payEnable: boolean;
  }>({
    isvName: '',
    enable: true,
    payEnable: true,
  });

  const rules = {
    // 国际化: 服务商名称
    isvName: [{ required: true, message: $t('payment.channel.mock.isv.isvNameRequired') }],
  };

  /**
   * 打开弹窗(record 为空=新建, 携带行数据=编辑/启停)
   */
  function show(record?: MockIsvInfoResult) {
    formState.value = {
      id: record?.id,
      isvNo: record?.isvNo,
      isvName: record?.isvName,
      enable: record?.enable ?? true,
      payEnable: record?.payEnable ?? true,
    };
    visible.value = true;
  }

  function handleCancel() {
    visible.value = false;
  }

  /**
   * 提交新建/编辑(destroy-on-hidden 保证表单校验态随弹窗销毁重置)
   */
  function handleOk() {
    formRef.value
      ?.validate()
      .then(() => {
        confirmLoading.value = true;
        const state = formState.value;
        const request = state.id
          ? MockIsvInfoApi.update({
              id: state.id,
              isvName: state.isvName!,
              enable: state.enable,
              payEnable: state.payEnable,
            })
          : MockIsvInfoApi.create({
              isvName: state.isvName!,
              enable: state.enable,
              payEnable: state.payEnable,
            });
        request
          .then(() => {
            message.success(
              state.id ? $t('payment.channel.mock.isv.updateSuccess') : $t('payment.channel.mock.isv.createSuccess'),
            );
            visible.value = false;
            emit('ok');
          })
          .finally(() => {
            confirmLoading.value = false;
          });
      })
      .catch(() => {});
  }

  defineExpose({ show });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="formState.id ? $t('payment.channel.mock.isv.editTitle') : $t('payment.channel.mock.isv.createTitle')"
    :width="520"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="formState" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 17 }">
      <!-- 国际化: 服务商编号(系统生成不可改, 仅编辑时展示) -->
      <a-form-item v-if="formState.id" :label="$t('payment.channel.mock.isv.isvNo')">
        <span class="text-muted-foreground">{{ formState.isvNo || '-' }}</span>
      </a-form-item>
      <!-- 国际化: 服务商名称 -->
      <a-form-item :label="$t('payment.channel.mock.isv.isvName')" name="isvName">
        <a-input
          v-model:value="formState.isvName"
          :maxlength="100"
          :placeholder="$t('payment.channel.mock.isv.isvNamePlaceholder')"
        />
      </a-form-item>
      <!-- 国际化: 启用绑定 -->
      <a-form-item :label="$t('payment.channel.mock.isv.enable')" name="enable">
        <div class="flex items-center gap-2">
          <a-switch v-model:checked="formState.enable" />
          <span class="text-xs text-muted-foreground">{{ $t('payment.channel.mock.isv.enableTip') }}</span>
        </div>
      </a-form-item>
      <!-- 国际化: 启用支付 -->
      <a-form-item :label="$t('payment.channel.mock.isv.payEnable')" name="payEnable">
        <div class="flex items-center gap-2">
          <a-switch v-model:checked="formState.payEnable" />
          <span class="text-xs text-muted-foreground">{{ $t('payment.channel.mock.isv.payEnableTip') }}</span>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>
