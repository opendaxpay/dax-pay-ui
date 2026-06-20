<script setup lang="ts">
  import { nextTick, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { useMessage } from '#/hooks/useMessage';

  interface Props {
    /** 是否打开 */
    open: boolean;
    /** 头像 */
    avatar?: string;
    /** 用户名 */
    text?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    avatar: '',
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
    // 密码不能为空
    if (!password.value) {
      message.warning($t('ui.widgets.lockScreen.placeholder'));
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
      <a-avatar :size="72" :src="avatar" />
      <div class="my-4 text-base font-medium">{{ text }}</div>
      <a-input-password
        ref="inputRef"
        v-model:value="password"
        :placeholder="$t('ui.widgets.lockScreen.placeholder')"
        size="large"
        allow-clear
        @press-enter="handleSubmit"
      />
      <a-button type="primary" block size="large" class="mt-4" @click="handleSubmit">
        {{ $t('ui.widgets.lockScreen.screenButton') }}
      </a-button>
    </div>
  </a-modal>
</template>
