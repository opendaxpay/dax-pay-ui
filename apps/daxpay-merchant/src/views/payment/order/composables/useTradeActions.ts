import { ref } from 'vue';

import { $t } from '@vben/locales';

import { useMessage } from '#/hooks/useMessage';

/** 交易操作 composable 选项 */
interface TradeActionsOptions<T = Record<string, any>> {
  /** 同步状态 API 方法(可选, 仅资金交易列表使用) */
  syncFn?: (id: string) => Promise<unknown>;
  /** 关闭 API 方法(接收行数据, 关闭所需的容器ID/类型等从 row 中取) */
  closeFn: (row: T) => Promise<unknown>;
  /** 操作成功后的回调(通常是刷新列表) */
  onSuccess: () => void;
}

/**
 * 交易操作 composable
 *
 * 统一封装 sync/close 两个操作的确认弹窗 + API 调用 + 成功提示 + 刷新回调,
 * 消除 PayTradeList / NormalOrderList / GatewayOrderList 三个列表页的重复逻辑。
 */
export function useTradeActions<T = Record<string, any>>(options: TradeActionsOptions<T>) {
  const { confirm, message } = useMessage();
  const actionLoading = ref(false);

  /** 同步支付状态 */
  function handleSync(id: string) {
    const syncFn = options.syncFn;
    if (!syncFn) return;
    confirm({
      title: $t('payment.order.action.syncConfirmTitle'),
      content: $t('payment.order.action.syncConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return syncFn(id)
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
  function handleClose(row: T) {
    confirm({
      title: $t('payment.order.action.closeConfirmTitle'),
      content: $t('payment.order.action.closeConfirmContent'),
      onOk() {
        actionLoading.value = true;
        return options
          .closeFn(row)
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
