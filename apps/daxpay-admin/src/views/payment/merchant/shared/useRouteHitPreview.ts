import { computed, ref } from 'vue';

import {
  PayRouteApi,
  type PayRouteBasicConfigResult,
  type PayRouteSceneConfigResult,
} from '#/api/payment/route/pay-route.api';
import {
  PAY_ROUTE_MODE,
  type PayRouteMode,
} from '#/views/payment/merchant/route/shared/payRoute.constants';
import { normalizePayRouteMode } from '#/views/payment/merchant/route/shared/payRoute.labels';

/** 通道路由命中预览状态 */
export type RouteHitPreviewStatus = 'ok' | 'notConfigured' | 'noStrategy' | 'emptyMethod';

/** 与通道路由配置一致的只读命中结果 */
export interface RouteHitPreview {
  mode: PayRouteMode | '';
  channelMchNo?: string;
  channelMchLabel?: string;
  capability?: string;
  capabilityLabel?: string;
  status: RouteHitPreviewStatus;
}

/**
 * 通道路由命中预览：同源读 strategy/basic/scene，供聚合/码牌 AUTO·METHOD 展示
 * 规则对齐 PayRouteService（basic 按 provider，scene 按 method 精确匹配）
 */
export function useRouteHitPreview() {
  const loaded = ref(false);
  const loading = ref(false);
  const routeMode = ref<PayRouteMode | ''>('');
  // provider → 已配通道商户号
  const basicChannelMchByProvider = ref<Record<string, string>>({});
  // provider → channelMchNo → label
  const basicChannelMchLabelMap = ref<Record<string, Record<string, string>>>({});
  // method → 场景配置
  const sceneByMethod = ref<Record<string, { channelMchNo: string; capability: string }>>({});
  // method → channelMchNo → label
  const sceneChannelMchLabelMap = ref<Record<string, Record<string, string>>>({});
  // method|channelMchNo → capability → label
  const sceneCapabilityLabelMap = ref<Record<string, Record<string, string>>>({});
  // method → 友好名
  const methodLabelMap = ref<Record<string, string>>({});
  // method → provider（目录兜底）
  const methodToProvider = ref<Record<string, string>>({});

  const effectiveMode = computed(() => routeMode.value);

  /** 支付方式友好名 */
  function methodLabel(method: string): string {
    if (!method) {
      return '';
    }
    return methodLabelMap.value[method] || method;
  }

  /**
   * 加载应用通道路由数据（与路由页同一套 API）
   */
  async function load(appId: string): Promise<void> {
    if (!appId) {
      loaded.value = false;
      routeMode.value = '';
      return;
    }
    loading.value = true;
    try {
      // 先确保 strategy 已落库（首次打开会创建），避免与依赖它的 basic/scene 查询并发竞态
      // 后端 listBasicConfig/listSceneConfig 内部 requireStrategy 是「必须存在」语义，
      // 若与 getOrInitStrategy 并发，可能在 strategy 落库前到达后端而抛 routeStrategyNotExist
      const { data: strategy } = await PayRouteApi.getOrInitStrategy(appId);

      // get-or-init 成功则有 mode；异常为空时 preview 返回 noStrategy
      routeMode.value = strategy?.mode ? normalizePayRouteMode(strategy.mode) : '';

      // strategy 存在后再并发拉取依赖数据
      const [{ data: basicRows }, { data: sceneRows }, { data: directory }] = await Promise.all([
        PayRouteApi.listBasicConfig(appId),
        PayRouteApi.listSceneConfig(appId),
        PayRouteApi.listMethodDirectoryFlat(),
      ]);

      // 目录：method 标签与 provider 映射
      const labelMap: Record<string, string> = {};
      const providerMap: Record<string, string> = {};
      for (const item of directory || []) {
        if (item.method) {
          labelMap[item.method] = item.methodLabel || item.method;
          if (item.provider) {
            providerMap[item.method] = item.provider;
          }
        }
      }
      methodLabelMap.value = labelMap;
      methodToProvider.value = providerMap;

      // basic
      const basicMap: Record<string, string> = {};
      const basicLabels: Record<string, Record<string, string>> = {};
      for (const row of (basicRows || []) as PayRouteBasicConfigResult[]) {
        if (!row.provider) {
          continue;
        }
        if (row.channelMchNo) {
          basicMap[row.provider] = row.channelMchNo;
        }
        const lm: Record<string, string> = {};
        for (const opt of row.channelMchants || []) {
          if (opt.value) {
            lm[opt.value] = opt.label || opt.value;
          }
        }
        basicLabels[row.provider] = lm;
      }
      basicChannelMchByProvider.value = basicMap;
      basicChannelMchLabelMap.value = basicLabels;

      // scene 配置行
      const sceneMap: Record<string, { channelMchNo: string; capability: string }> = {};
      const capabilityItems: Array<{ provider: string; method: string; channelMchNo: string }> = [];
      for (const row of (sceneRows || []) as PayRouteSceneConfigResult[]) {
        if (!row.method) {
          continue;
        }
        const channelMchNo = row.channelMchNo || '';
        const capability = row.capability || '';
        sceneMap[row.method] = { channelMchNo, capability };
        const provider = providerMap[row.method] || '';
        if (provider && channelMchNo) {
          capabilityItems.push({ provider, method: row.method, channelMchNo });
        }
      }
      sceneByMethod.value = sceneMap;

      // scene 通道商户 / 能力 label（与路由页同源候选）
      const mchLabelMap: Record<string, Record<string, string>> = {};
      const capLabelMap: Record<string, Record<string, string>> = {};
      if (routeMode.value === PAY_ROUTE_MODE.SCENE) {
        const { data: channelMchBatch } = await PayRouteApi.listSceneChannelMchCandidatesBatch({
          appId,
        });
        // batch key: provider|method
        for (const [key, options] of Object.entries(channelMchBatch || {})) {
          const parts = key.split('|');
          const method = parts.length >= 2 ? parts[1]! : '';
          if (!method) {
            continue;
          }
          const lm: Record<string, string> = {};
          for (const opt of options || []) {
            if (opt.value) {
              lm[opt.value] = opt.label || opt.value;
            }
          }
          mchLabelMap[method] = { ...(mchLabelMap[method] || {}), ...lm };
        }
        if (capabilityItems.length > 0) {
          const { data: capabilityBatch } = await PayRouteApi.listSceneCapabilityCandidatesBatch({
            appId,
            items: capabilityItems,
          });
          for (const [key, options] of Object.entries(capabilityBatch || {})) {
            // key: provider|method|channelMchNo
            const parts = key.split('|');
            if (parts.length < 3) {
              continue;
            }
            const method = parts[1]!;
            const channelMchNo = parts[2]!;
            const mapKey = `${method}|${channelMchNo}`;
            const lm: Record<string, string> = {};
            for (const opt of options || []) {
              if (opt.value) {
                lm[opt.value] = opt.label || opt.value;
              }
            }
            capLabelMap[mapKey] = lm;
          }
        }
      }
      sceneChannelMchLabelMap.value = mchLabelMap;
      sceneCapabilityLabelMap.value = capLabelMap;

      loaded.value = true;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 按 provider + method 预览路由命中（与 PayRouteService 对齐）
   */
  function preview(provider: string, method: string): RouteHitPreview {
    if (!method) {
      return { mode: routeMode.value, status: 'emptyMethod' };
    }
    if (!loaded.value || !routeMode.value) {
      return { mode: '', status: 'noStrategy' };
    }

    const mode = routeMode.value;
    if (mode === PAY_ROUTE_MODE.BASIC) {
      const p = provider || methodToProvider.value[method] || '';
      const channelMchNo = p ? basicChannelMchByProvider.value[p] : undefined;
      if (!channelMchNo) {
        return { mode, status: 'notConfigured' };
      }
      const channelMchLabel =
        basicChannelMchLabelMap.value[p]?.[channelMchNo] || channelMchNo;
      return {
        mode,
        channelMchNo,
        channelMchLabel,
        status: 'ok',
      };
    }

    // scene：method 精确匹配
    const scene = sceneByMethod.value[method];
    if (!scene?.channelMchNo) {
      return { mode, status: 'notConfigured' };
    }
    const channelMchLabel =
      sceneChannelMchLabelMap.value[method]?.[scene.channelMchNo] || scene.channelMchNo;
    let capabilityLabel: string | undefined;
    if (scene.capability) {
      const capKey = `${method}|${scene.channelMchNo}`;
      capabilityLabel =
        sceneCapabilityLabelMap.value[capKey]?.[scene.capability] || scene.capability;
    }
    return {
      mode,
      channelMchNo: scene.channelMchNo,
      channelMchLabel,
      capability: scene.capability || undefined,
      capabilityLabel,
      status: 'ok',
    };
  }

  return {
    loaded,
    loading,
    effectiveMode,
    methodLabel,
    load,
    preview,
  };
}
