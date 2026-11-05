<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { ChannelTerminalApi, type ChannelTerminalResult } from '#/api/payment/device/terminal.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ChannelTerminalRegisterModal' });

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const formRef = ref();
  const visible = ref(false);
  const confirmLoading = ref(false);
  const current = ref<ChannelTerminalResult | null>(null);
  const formState = ref<{ outTerminalNo?: string; status?: string }>({});

  // 登记状态(前端 dict.json, 与后端字典 channel_terminal_status 对齐)
  const statusOptions = computed(() => [
    { label: $t('dict.channel_terminal_status.init'), value: 'init' },
    { label: $t('dict.channel_terminal_status.wait'), value: 'wait' },
    { label: $t('dict.channel_terminal_status.submit'), value: 'submit' },
    { label: $t('dict.channel_terminal_status.logged'), value: 'logged' },
    { label: $t('dict.channel_terminal_status.error'), value: 'error' },
  ]);

  const formRules = computed(() => ({
    status: [{ required: true, message: $t('payment.device.terminal.validateStatus') }],
  }));

  /**
   * 已绑定的系统终端只读文案
   */
  const boundSystemLabel = computed(() => {
    const terminals = current.value?.systemTerminals || [];
    if (terminals.length === 0) {
      return '-';
    }
    return terminals.map((i) => `${i.name || '-'} (${i.terminalNo})`).join('；');
  });

  /**
   * 打开手动调整弹窗(手工订正通道侧终端号与登记状态, 不调通道; 任意状态可用)
   */
  function show(row: ChannelTerminalResult) {
    current.value = row;
    formState.value = {
      outTerminalNo: row.outTerminalNo || undefined,
      status: row.status || 'init',
    };
    visible.value = true;
  }

  /**
   * 提交手动调整
   */
  async function handleOk() {
    if (!current.value?.id) {
      return;
    }
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    confirmLoading.value = true;
    try {
      await ChannelTerminalApi.register({
        id: current.value.id,
        outTerminalNo: formState.value.outTerminalNo?.trim() || undefined,
        status: formState.value.status!,
      });
      // 调整成功, 已按所选状态更新
      message.success($t('payment.device.terminal.registerSuccess'));
      visible.value = false;
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  function handleCancel() {
    visible.value = false;
  }

  defineExpose({ show });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="$t('payment.device.terminal.registerTitle')"
    :width="520"
    :confirm-loading="confirmLoading"
    :mask-closable="false"
    :destroy-on-hidden="true"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="mb-3">
      <!-- 手动调整使用场景说明 -->
      <a-alert type="info" show-icon :message="$t('payment.device.terminal.registerTips')" />
    </div>
    <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <!-- 系统终端只读展示(绑定关系在通道终端登记时建立, 手动调整不改关联) -->
      <a-form-item :label="$t('payment.device.terminal.field.systemTerminal')">
        <span>{{ boundSystemLabel }}</span>
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.outTerminalNo')" name="outTerminalNo">
        <a-input
          v-model:value="formState.outTerminalNo"
          :placeholder="$t('payment.device.terminal.outTerminalNoPlaceholder')"
          allow-clear
        />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.status')" name="status">
        <a-select v-model:value="formState.status" :options="statusOptions" :placeholder="$t('common.pleaseSelect')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
