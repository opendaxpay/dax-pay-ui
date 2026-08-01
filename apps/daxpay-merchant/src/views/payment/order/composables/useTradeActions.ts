import { ref } from 'vue';

import { $t } from '@vben/locales';

import { useMessage } from '#/hooks/useMessage';

/** 交易操作 composable 选项 */
interface TradeActionsOptions {
  /** 同步状态 API 方法 */
  syncFn: (id: string) => Promise<unknown>;
  /** 关闭 API 方法 */
  closeFn: (id: string) => Promise<unknown>;
  /** 操作成功后的回调(通常是刷新列表) */
  onSuccess: () => void;
}

/**
 * 交易操作 composable
 *
 * 统一封装 sync/close 两个操作的确认弹窗 + API 调用 + 成功提示 + 刷新回调,
 * 消除 PayTradeList / NormalOrderList / GatewayOrderList 三个列表页的重复逻辑。
 */
export function useTradeActions(options: TradeActionsOptions) {
  const { confirm, message } = useMessage();
  const actionLoading = ref(false);

  /** 同步支付状态 */
  function handleSync(id: string) {
    confirm({
      title: $t('payment.order.action.syncConfirmTitle'),
      content: $t('payment.order.action.syncConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return options
          .syncFn(id)
          .then(() => {
            message.success($t('payment.order.action.syncSuccess'));
            options.onSuccess();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
  }

  /** 关闭订单(仅未支付, 资金态置 CLOSE) */
  function handleClose(id: string) {
    confirm({
      title: $t('payment.order.action.closeConfirmTitle'),
      content: $t('payment.order.action.closeConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return options
          .closeFn(id)
          .then(() => {
            message.success($t('payment.order.action.closeSuccess'));
            options.onSuccess();
          })
          .finally(() => {
            actionLoading.value = false;
          });
      },
    });
  }

  return { actionLoading, handleSync, handleClose };
}
