<script lang="ts" setup>
  import type { RouteHitPreview } from './useRouteHitPreview';

  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { PAY_ROUTE_MODE } from '#/views/payment/route/shared/payRoute.constants';

  defineOptions({ name: 'RouteHitPreviewBlock' });

  const props = withDefaults(
    defineProps<{
      /**
       * 未配置时的强调级别
       * - soft: 灰色文案（默认，降噪）
       * - emphasize: 橙色告警（如同环境另一形态已配置）
       */
      emptyTone?: 'emphasize' | 'soft';
      /** 命中预览结果 */
      hit: RouteHitPreview;
      /** i18n 前缀，如 payment.merchant.aggregate.aggregate */
      i18nPrefix: string;
      /** 移动端内联字段名（<768px 显示，桌面由父级表头承担；不传则不显示） */
      mobileLabels?: { capability?: string; channelMch?: string };
    }>(),
    { emptyTone: 'soft', mobileLabels: () => ({}) },
  );

  // scene 才展示配置的能力；basic 仅说明运行时派生
  const isScene = computed(() => props.hit.mode === PAY_ROUTE_MODE.SCENE);

  function t(key: string) {
    return $t(`${props.i18nPrefix}.${key}`);
  }
</script>

<template>
  <!-- display:contents 使两列直接参与父级 grid -->
  <div class="route-hit-cells">
    <!-- 通道商户 -->
    <div class="cell-value">
      <!-- 移动端内联字段名（桌面由父级表头承担） -->
      <span v-if="mobileLabels?.channelMch" class="w-20 shrink-0 truncate text-xs text-muted-foreground md:hidden">
        {{ mobileLabels.channelMch }}
      </span>
      <template v-if="hit.status === 'ok'">
        <span class="cell-text" :title="hit.channelMchLabel || hit.channelMchNo">
          {{ hit.channelMchLabel || hit.channelMchNo }}
        </span>
      </template>
      <a-tag v-else-if="hit.status === 'notConfigured' && emptyTone === 'emphasize'" color="warning">
        {{ t('routeNotConfigured') }}
      </a-tag>
      <span v-else-if="hit.status === 'notConfigured'" class="text-muted-foreground text-xs">
        {{ t('routeNotConfiguredShort') }}
      </span>
      <a-tag v-else-if="hit.status === 'noStrategy'" color="warning">
        {{ t('routeNoStrategy') }}
      </a-tag>
      <span v-else class="text-muted-foreground">—</span>
    </div>

    <!-- 支付能力 -->
    <div class="cell-value">
      <!-- 移动端内联字段名（桌面由父级表头承担） -->
      <span v-if="mobileLabels?.capability" class="w-20 shrink-0 truncate text-xs text-muted-foreground md:hidden">
        {{ mobileLabels.capability }}
      </span>
      <template v-if="hit.status === 'ok' && isScene">
        <span class="cell-text text-muted-foreground" :title="hit.capability || hit.capabilityLabel || ''">
          {{ hit.capabilityLabel || hit.capability || $t('payment.merchant.route.route.sceneRouteNotSelected') }}
        </span>
      </template>
      <span
        v-else-if="hit.status === 'ok' && !isScene"
        class="text-muted-foreground text-xs"
        :title="t('capabilityRuntimeDerived')"
      >
        {{ t('capabilityRuntimeDerived') }}
      </span>
      <span v-else class="text-muted-foreground">—</span>
    </div>
  </div>
</template>

<style scoped>
  .route-hit-cells {
    display: contents;
  }

  .cell-value {
    display: flex;
    align-items: center;
    min-width: 0;
    min-height: 32px;
  }

  .cell-text {
    /* 作为 flex item 参与收缩，保证 label 并存时省略号仍生效 */
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }
</style>
