<script lang="ts" setup>
  import { $t } from '@vben/locales';

  import { PermCodes } from '#/constants/perm-codes';
  import { usePermission } from '#/hooks/usePermission';

  import { PAY_ROUTE_MODE, type PayRouteMode } from '../shared/payRoute.constants';

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

  // 当前编辑的配置模式（基础/场景可切换）
  const editMode = defineModel<PayRouteMode>('editMode', { required: true });

  const { hasPermission } = usePermission();
</script>

<template>
  <!-- 移动端纵向堆叠，桌面横排 -->
  <div class="mb-4 flex flex-col items-start gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
    <span>{{ $t('payment.merchant.route.route.editModeLabel') }}</span>
    <a-radio-group v-model:value="editMode" button-style="solid">
      <a-radio :value="PAY_ROUTE_MODE.BASIC">
        <span class="inline-flex items-center gap-1">
          {{ $t('payment.merchant.route.route.modeBasic') }}
          <a-tag v-if="effectiveMode === PAY_ROUTE_MODE.BASIC" color="processing" class="!m-0 !text-xs">
            {{ $t('payment.merchant.route.route.activeModeTag') }}
          </a-tag>
        </span>
      </a-radio>
      <a-radio :value="PAY_ROUTE_MODE.SCENE">
        <span class="inline-flex items-center gap-1">
          {{ $t('payment.merchant.route.route.modeScene') }}
          <a-tag v-if="effectiveMode === PAY_ROUTE_MODE.SCENE" color="processing" class="!m-0 !text-xs">
            {{ $t('payment.merchant.route.route.activeModeTag') }}
          </a-tag>
        </span>
      </a-radio>
    </a-radio-group>
    <a-tooltip
      v-if="hasPermission(PermCodes.Merchant.AppRoute.MANAGE)"
      :title="isEditModeActive ? $t('payment.merchant.route.route.alreadyActiveMode') : ''"
    >
      <a-button type="primary" :disabled="isEditModeActive" @click="emit('applyActiveMode')">
        {{ $t('payment.merchant.route.route.setActiveMode') }}
      </a-button>
    </a-tooltip>
  </div>
</template>
