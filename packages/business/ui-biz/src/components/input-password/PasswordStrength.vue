<script setup lang="ts">
  import type { PasswordPolicyValidateConfig } from '../../types/password-policy';
  import type { PasswordCondition } from '../../utils/password-validator';

  import { computed } from 'vue';

  import { IconifyIcon } from '@vben-core/icons';

  import { calculateIntrinsicStrength, getPasswordConditions } from '../../utils/password-validator';

  interface Props {
    password?: string;
    config?: PasswordPolicyValidateConfig;
  }

  const props = withDefaults(defineProps<Props>(), {
    password: '',
    config: () => ({}),
  });

  const strengthList: string[] = ['', '#e74242', '#ED6F6F', '#EFBD47', '#55D18780', '#55D187'];

  const currentStrength = computed(() => {
    return calculateIntrinsicStrength(props.password);
  });

  const currentColor = computed(() => {
    return strengthList[currentStrength.value];
  });

  const conditions = computed<PasswordCondition[]>(() => {
    return getPasswordConditions(props.password, props.config);
  });
</script>

<template>
  <div class="password-strength">
    <!-- 强度条 -->
    <div class="password-strength-bar">
      <div
        v-for="index in 5"
        :key="index"
        class="password-strength-item"
        :style="{ backgroundColor: currentStrength >= index ? currentColor : undefined }"
      />
    </div>
    <!-- 条件列表 -->
    <div v-if="conditions.length > 0" class="password-conditions">
      <div
        v-for="condition in conditions"
        :key="condition.key"
        class="condition-item"
        :class="[{ satisfied: condition.satisfied }]"
      >
        <span class="condition-icon">
          <IconifyIcon v-if="condition.satisfied" icon="ant-design:check-outlined" />
          <IconifyIcon v-else icon="ant-design:close-outlined" />
        </span>
        <span class="condition-label">{{ condition.label }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
  .password-strength {
    margin-top: 4px;

    &-bar {
      display: flex;
      justify-content: space-between;
      gap: 4px;
    }

    &-item {
      flex: 1;
      height: 4px;
      background-color: rgba(0, 0, 0, 0.06);
      border-radius: 2px;
      transition: background-color 0.3s;
    }
  }

  .password-conditions {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
  }

  .condition-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    transition: color 0.3s;

    &.satisfied {
      color: #52c41a;
    }
  }

  .condition-icon {
    font-size: 12px;
  }

  .dark {
    .password-strength-item {
      background-color: rgba(255, 255, 255, 0.12);
    }

    .condition-item {
      color: rgba(255, 255, 255, 0.45);

      &.satisfied {
        color: #52c41a;
      }
    }
  }
</style>
