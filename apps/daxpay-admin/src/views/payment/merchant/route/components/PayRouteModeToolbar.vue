<script lang="ts" setup>
  import type { PayRouteMode } from '../shared/payRoute.constants';

  import { $t } from '@vben/locales';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'PayRouteModeToolbar' });

  // effectiveMode：库表 strategy.mode 当前生效模式；editMode：页面正在编辑的配置模式
  defineProps<{
    // 策略已生效的路由模式
    effectiveMode: PayRouteMode;
    // 编辑中的模式是否已与生效模式一致（一致时禁用「启用该模式」）
    isEditModeActive: boolean;
  }>();

  const emit = defineEmits<{
    applyActiveMode: [];
  }>();

  // 当前编辑的配置模式（基础/场景可切换；精细模式仅展示）
  const editMode = defineModel<PayRouteMode>('editMode', { required: true });

  const { hasPermission } = usePermission();
</script>

<template>
  <div class="mb-4 flex flex-wrap items-center gap-4">
    <span>{{ $t('payment.merchant.route.route.editModeLabel') }}</span>
    <a-radio-group v-model:value="editMode">
      <a-radio value="basic">
        <span class="inline-flex items-center gap-1">
          {{ $t('payment.merchant.route.route.modeBasic') }}
          <a-tag v-if="effectiveMode === 'basic'" color="processing" class="!m-0 !text-xs">
            {{ $t('payment.merchant.route.route.activeModeTag') }}
          </a-tag>
        </span>
      </a-radio>
      <a-radio value="scene">
        <span class="inline-flex items-center gap-1">
          {{ $t('payment.merchant.route.route.modeScene') }}
          <a-tag v-if="effectiveMode === 'scene'" color="processing" class="!m-0 !text-xs">
            {{ $t('payment.merchant.route.route.activeModeTag') }}
          </a-tag>
        </span>
      </a-radio>
      <!-- 精细模式：功能未实现，固定 disabled，若历史数据为 advanced 仍显示「生效中」 -->
      <a-radio value="advanced" disabled>
        <span class="inline-flex items-center gap-1">
          {{ $t('payment.merchant.route.route.modeAdvanced') }}
          <a-tag v-if="effectiveMode === 'advanced'" color="processing" class="!m-0 !text-xs">
            {{ $t('payment.merchant.route.route.activeModeTag') }}
          </a-tag>
        </span>
      </a-radio>
    </a-radio-group>
    <a-tooltip
      v-if="hasPermission(PermCodes.Payment.AppPayRoute.EDIT)"
      :title="isEditModeActive ? $t('payment.merchant.route.route.alreadyActiveMode') : ''"
    >
      <a-button type="primary" :disabled="isEditModeActive" @click="emit('applyActiveMode')">
        {{ $t('payment.merchant.route.route.setActiveMode') }}
      </a-button>
    </a-tooltip>
  </div>
</template>
