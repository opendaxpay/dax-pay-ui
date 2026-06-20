<script setup lang="ts">
  import { nextTick, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { UserAvatar } from '#/components/user-avatar';
  import { useMessage } from '#/hooks/useMessage';

  interface Props {
    /** 是否打开 */
    open: boolean;
    /** 用户名（取首字作为头像） */
    text?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    text: '',
  });

  const emit = defineEmits<{
    submit: [password: string];
    'update:open': [value: boolean];
  }>();

  const { message } = useMessage();
  const password = ref('');
  const inputRef = ref();

  // 弹窗打开时重置密码并自动聚焦输入框
  watch(
    () => props.open,
    (val) => {
      if (val) {
        password.value = '';
        nextTick(() => {
          inputRef.value?.focus();
        });
      }
    },
  );

  function handleClose() {
    emit('update:open', false);
  }

  function handleSubmit() {
    // 密码不能为空（提示用更准确的 passwordTip，而非 placeholder）
    if (!password.value) {
      message.warning($t('authentication.passwordTip'));
      return;
    }
    emit('submit', password.value);
    emit('update:open', false);
  }
</script>

<template>
  <a-modal
    :open="open"
    :title="$t('ui.widgets.lockScreen.title')"
    :footer="null"
    :width="400"
    centered
    @cancel="handleClose"
    @update:open="(val: boolean) => emit('update:open', val)"
  >
    <div class="flex flex-col items-center px-4 pb-2 pt-6">
      <!-- 头像：环形描边主题色首字头像，与全屏锁屏页风格统一 -->
      <UserAvatar :text="text" :size="72" ring />
      <div class="my-4 text-base font-medium">{{ text }}</div>
      <a-input-password
        ref="inputRef"
        v-model:value="password"
        :placeholder="$t('ui.widgets.lockScreen.placeholder')"
        size="large"
        allow-clear
        @press-enter="handleSubmit"
      />
      <a-button type="primary" block size="large" class="mt-6" @click="handleSubmit">
        {{ $t('ui.widgets.lockScreen.screenButton') }}
      </a-button>
    </div>
  </a-modal>
</template>
