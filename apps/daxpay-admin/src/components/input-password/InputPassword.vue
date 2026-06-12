<script setup lang="ts">
  import type { PasswordPolicyValidateConfig } from '#/api/system/security.api';

  import { useSlots } from 'vue';

  import PasswordStrength from './PasswordStrength.vue';

  interface Props {
    /**
     * 是否显示密码强度
     */
    passwordStrength?: boolean;
    /**
     * 密码策略配置
     */
    config?: PasswordPolicyValidateConfig;
  }

  defineOptions({
    inheritAttrs: false,
  });

  const { passwordStrength = false, config = {} } = defineProps<Props>();

  const modelValue = defineModel<string>();

  const slots = useSlots();
</script>

<template>
  <div class="input-password-wrapper">
    <a-input-password v-bind="$attrs" v-model:value="modelValue" />
    <template v-if="passwordStrength">
      <PasswordStrength :password="modelValue" :config="config" />
      <p v-if="slots.strengthText" class="strength-text">
        <slot name="strengthText" />
      </p>
    </template>
  </div>
</template>

<style lang="less" scoped>
  .input-password-wrapper {
    width: 100%;
  }

  .strength-text {
    margin-top: 6px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
  }

  .dark .strength-text {
    color: rgba(255, 255, 255, 0.45);
  }
</style>
