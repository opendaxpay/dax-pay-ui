<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { TerminalDeviceApi, type TerminalDeviceResult } from '#/api/payment/device/terminal.api';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * 门店默认终端设置弹窗(门店工作台「默认设置」组, 商户端)
   *
   * 与本店默认支付应用同款形态: 下拉单选 + 允许清空(留空=清除默认标记, 等价取消默认)。
   * 候选仅列本店已绑定且启用的商户终端; 默认终端同门店唯一由后端 set-default 先清后设保证;
   * 当前默认若已停用则不出现在选项中, 但仍可经清空选择清除其默认标记。
   */
  defineOptions({ name: 'MchStoreTerminalDefaultModal' });

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  const confirmLoading = ref(false);

  const storeNo = ref('');
  const storeName = ref('');
  // 空(null, 下拉清空) = 清除本店默认终端标记
  const selectedId = ref<null | string>();
  const terminals = ref<TerminalDeviceResult[]>([]);

  /** 本店当前默认终端(含停用, 用于取消默认; 停用项不进下拉选项) */
  const currentDefault = computed(() => terminals.value.find((item) => item.defaultTerminal));

  /** 下拉选项: 本店已绑定且启用的终端(名称 + 终端号) */
  const terminalOptions = computed(() =>
    terminals.value
      .filter((item) => item.enable !== false)
      .map((item) => ({
        label: `${item.name || item.terminalNo}（${item.terminalNo}）`,
        value: item.id!,
      })),
  );

  /** 弹窗标题(带门店名后缀) */
  const modalTitle = computed(() =>
    storeName.value
      ? $t('payment.merchant.store.workbench.defaultTerminalTitleWithStore', { store: storeName.value })
      : $t('payment.merchant.store.workbench.defaultTerminalTitle'),
  );

  /**
   * 加载本店商户终端(按门店过滤, 一次取足; 后端强制当前商户)
   */
  async function loadTerminals() {
    loading.value = true;
    try {
      const { data } = await TerminalDeviceApi.page({
        current: 1,
        size: 200,
        storeNo: storeNo.value,
      });
      terminals.value = data?.records || [];
      // 回显当前默认(停用的默认不在选项中, 显示为未选)
      const current = terminals.value.find((item) => item.defaultTerminal);
      selectedId.value = current && current.enable !== false && current.id ? String(current.id) : '';
    } finally {
      loading.value = false;
    }
  }

  /**
   * 打开弹窗
   *
   * @param ctx 目标门店上下文(storeNo + storeName)
   */
  async function show(ctx: { storeName?: string; storeNo: string }) {
    storeNo.value = ctx.storeNo;
    storeName.value = ctx.storeName || '';
    terminals.value = [];
    selectedId.value = null;
    visible.value = true;
    await loadTerminals();
  }

  /**
   * 保存: 选中终端走设默认, 清空选择且有当前默认时走取消默认
   */
  async function handleOk() {
    if (!selectedId.value && !currentDefault.value) {
      visible.value = false;
      return;
    }
    confirmLoading.value = true;
    try {
      if (selectedId.value) {
        // 设为门店默认终端
        await TerminalDeviceApi.setDefault(selectedId.value);
        message.success($t('payment.merchant.store.workbench.defaultTerminalSetOk'));
      } else if (currentDefault.value?.id) {
        // 取消门店默认终端
        await TerminalDeviceApi.clearDefault(currentDefault.value.id);
        message.success($t('payment.merchant.store.workbench.defaultTerminalClearOk'));
      }
      visible.value = false;
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
    :title="modalTitle"
    :width="520"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    @ok="handleOk"
  >
    <a-spin :spinning="loading">
      <!-- 说明行放 wrapper, 避免 antd 组件覆盖 Tailwind 间距 -->
      <div class="mb-3 text-xs text-muted-foreground">
        {{ $t('payment.merchant.store.workbench.defaultTerminalTip') }}
      </div>
      <a-alert
        v-if="terminals.length === 0"
        type="info"
        show-icon
        :message="$t('payment.merchant.store.workbench.defaultTerminalEmpty')"
      />
      <template v-else>
        <a-select
          v-model:value="selectedId"
          :options="terminalOptions"
          allow-clear
          :placeholder="$t('payment.merchant.store.workbench.defaultTerminalPlaceholder')"
          style="width: 100%"
        />
        <div class="mt-2 text-xs text-muted-foreground">
          {{ $t('payment.merchant.store.workbench.defaultTerminalClearTip') }}
        </div>
      </template>
    </a-spin>
  </a-modal>
</template>
