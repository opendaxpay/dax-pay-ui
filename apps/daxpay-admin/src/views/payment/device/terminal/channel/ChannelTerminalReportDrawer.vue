<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    ChannelTerminalApi,
    type ChannelTerminalResult,
    TerminalDeviceApi,
    type TerminalDeviceResult,
  } from '#/api/payment/device/terminal.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ChannelTerminalReportDrawer' });

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const saving = ref(false);
  const current = ref<ChannelTerminalResult | null>(null);
  // 通道是否支持自动报备(不支持则报备动作禁用, 人工通道走台账的登记功能)
  const autoReport = ref(false);
  const terminalOptions = ref<TerminalDeviceResult[]>([]);
  const form = ref<{ systemTerminalNo?: string }>({});

  // 已绑定的商户终端(1:1 模型下至多一条)
  const boundTerminals = computed(() => current.value?.systemTerminals ?? []);
  // 已绑定即锁定: 终端下拉不可改, 换绑走解绑/注销流程
  const locked = computed(() => boundTerminals.value.length > 0);
  // 锁定时的提示文案(按登记状态分档)
  const lockHint = computed(() =>
    current.value?.status === 'submit'
      ? $t('payment.device.terminal.reportLockHintSubmitted')
      : $t('payment.device.terminal.reportLockHintBound'),
  );
  const terminalSelectOptions = computed(() =>
    terminalOptions.value.map((i) => ({ label: `${i.name || '-'} (${i.terminalNo})`, value: i.terminalNo })),
  );

  /**
   * 类型文案
   */
  function typeLabel(type?: string) {
    if (!type) {
      return '-';
    }
    return $t(`dict.terminal_type.${type}`);
  }

  /**
   * 打开报备抽屉: 选择商户终端即绑定, 发起报备调通道 API(仅自动通道可用)
   */
  async function show(row: ChannelTerminalResult) {
    current.value = row;
    form.value = {
      systemTerminalNo: row.systemTerminals?.[0]?.terminalNo,
    };
    visible.value = true;
    loading.value = true;
    try {
      const [{ data: types }, { data: terminals }] = await Promise.all([
        ChannelTerminalApi.terminalTypes(row.product || ''),
        TerminalDeviceApi.listByMchNo(row.mchNo || ''),
      ]);
      autoReport.value = (types || []).length > 0;
      terminalOptions.value = (terminals || []).filter((i) => i.enable !== false);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 提交报备(报备即绑定)
   */
  async function handleOk() {
    if (!current.value?.id) {
      return;
    }
    if (!autoReport.value) {
      message.warning($t('payment.device.terminal.reportNotSupported'));
      return;
    }
    if (!form.value.systemTerminalNo) {
      message.warning($t('payment.device.terminal.reportSelectTerminal'));
      return;
    }
    saving.value = true;
    try {
      await ChannelTerminalApi.report({
        id: current.value.id,
        systemTerminalNo: form.value.systemTerminalNo,
      });
      // 报备请求已执行
      message.success($t('payment.device.terminal.reportSuccess'));
      visible.value = false;
      emit('ok');
    } finally {
      saving.value = false;
    }
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.device.terminal.reportTitle')"
    :default-size="520"
    :mask-closable="false"
    :styles="{ footer: { textAlign: 'right' } }"
    destroy-on-hidden
  >
    <a-spin :spinning="loading">
      <a-form layout="vertical">
        <a-form-item :label="$t('payment.device.terminal.field.channelMchNo')">
          <a-input :value="current?.channelMchNo" disabled />
        </a-form-item>
        <a-form-item :label="$t('payment.device.terminal.field.type')">
          <a-input :value="typeLabel(current?.type)" disabled />
        </a-form-item>
        <a-form-item :label="$t('payment.device.terminal.field.systemTerminal')" required>
          <div v-if="boundTerminals.length > 0" class="mb-2">
            <a-tag v-for="term in boundTerminals" :key="term.terminalNo">
              {{ `${term.name || '-'} (${term.terminalNo})` }}
            </a-tag>
          </div>
          <a-select
            v-model:value="form.systemTerminalNo"
            :options="terminalSelectOptions"
            :disabled="locked"
            :placeholder="$t('payment.device.terminal.pleaseSelectTerminal')"
            show-search
            option-filter-prop="label"
            allow-clear
          />
          <div class="text-xs text-muted-foreground">
            {{ locked ? lockHint : $t('payment.device.terminal.reportSelectHint') }}
          </div>
        </a-form-item>
        <!-- 不支持自动报备的通道提示走登记 -->
        <a-alert
          v-if="!loading && !autoReport"
          type="warning"
          show-icon
          :message="$t('payment.device.terminal.reportNotSupported')"
        />
      </a-form>
    </a-spin>

    <template #footer>
      <a-space>
        <a-button @click="visible = false">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="saving" :disabled="!autoReport" @click="handleOk">
          {{ $t('payment.device.terminal.report') }}
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
