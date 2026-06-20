<script setup lang="ts">
  import { nextTick, ref } from 'vue';

  import { LockKeyhole } from '@vben/icons';
  import { $t, useI18n } from '@vben/locales';
  import { storeToRefs, useAccessStore } from '@vben/stores';

  import { useDateFormat, useNow, useScrollLock } from '@vueuse/core';

  import { useMessage } from '#/hooks/useMessage';

  interface Props {
    /** 头像 */
    avatar?: string;
  }

  withDefaults(defineProps<Props>(), {
    avatar: '',
  });

  defineEmits<{ toLogin: [] }>();

  const { locale } = useI18n();
  const { message } = useMessage();
  const accessStore = useAccessStore();
  const { lockScreenPassword } = storeToRefs(accessStore);

  const now = useNow();
  const meridiem = useDateFormat(now, 'A');
  const hour = useDateFormat(now, 'HH');
  const minute = useDateFormat(now, 'mm');
  const date = useDateFormat(now, 'YYYY-MM-DD dddd', { locales: locale.value });

  const showUnlockForm = ref(false);
  const password = ref('');
  const inputRef = ref();

  function handleSubmit() {
    // 密码不能为空
    if (!password.value) {
      message.warning($t('authentication.passwordTip'));
      return;
    }
    // 密码正确则解锁，否则清空并提示
    if (lockScreenPassword?.value === password.value) {
      accessStore.unlockScreen();
    } else {
      message.error($t('authentication.passwordErrorTip'));
      password.value = '';
    }
  }

  function toggleUnlockForm() {
    showUnlockForm.value = !showUnlockForm.value;
    if (showUnlockForm.value) {
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  }

  // 锁定 body 滚动，组件卸载后自动恢复
  const bodyScrollLock = useScrollLock(document.body);
  bodyScrollLock.value = true;
</script>

<template>
  <div class="fixed inset-0 z-[2000] bg-background">
    <!-- 时钟锁定页 -->
    <transition name="slide-left">
      <div v-show="!showUnlockForm" class="size-full">
        <div
          class="group absolute left-1/2 top-6 z-[2001] flex -translate-x-1/2 cursor-pointer flex-col items-center text-xl font-semibold text-foreground/80 hover:text-foreground"
          @click="toggleUnlockForm"
        >
          <LockKeyhole class="size-5 transition-all duration-300 group-hover:scale-125" />
          <span>{{ $t('ui.widgets.lockScreen.unlock') }}</span>
        </div>
        <div class="flex size-full items-center justify-center">
          <div class="flex w-full justify-center gap-4 px-4 sm:gap-6 md:gap-8">
            <div
              class="relative flex h-35 w-35 items-center justify-center rounded-xl bg-accent text-[36px] sm:h-40 sm:w-40 sm:text-[42px] md:h-50 md:w-50 md:text-[72px]"
            >
              <span class="absolute left-3 top-3 text-xs font-semibold sm:text-sm md:text-xl">
                {{ meridiem }}
              </span>
              {{ hour }}
            </div>
            <div
              class="flex h-35 w-35 items-center justify-center rounded-xl bg-accent text-[36px] sm:h-40 sm:w-40 sm:text-[42px] md:h-50 md:w-50 md:text-[72px]"
            >
              {{ minute }}
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 解锁表单 -->
    <transition name="slide-right">
      <div
        v-if="showUnlockForm"
        class="flex size-full items-center justify-center"
        @keydown.enter.prevent="handleSubmit"
      >
        <div class="mb-10 flex w-[90%] max-w-75 flex-col items-center px-4">
          <a-avatar :size="80" :src="avatar" class="mb-6" />
          <div class="mb-2 w-full">
            <a-input-password
              ref="inputRef"
              v-model:value="password"
              :placeholder="$t('ui.widgets.lockScreen.placeholder')"
              size="large"
              allow-clear
            />
          </div>
          <a-button type="primary" block size="large" @click="handleSubmit">
            {{ $t('ui.widgets.lockScreen.entry') }}
          </a-button>
          <a-button block size="large" class="my-2" @click="$emit('toLogin')">
            {{ $t('ui.widgets.lockScreen.backToLogin') }}
          </a-button>
          <a-button block size="large" @click="toggleUnlockForm">
            {{ $t('common.back') }}
          </a-button>
        </div>
      </div>
    </transition>

    <!-- 底部时间 -->
    <div class="absolute bottom-5 w-full text-center text-xl md:text-2xl xl:text-xl 2xl:text-3xl">
      <div v-if="showUnlockForm" class="mb-2 text-2xl md:text-3xl">
        {{ hour }}:{{ minute }}
        <span class="text-base md:text-lg">{{ meridiem }}</span>
      </div>
      <div class="text-xl md:text-3xl">{{ date }}</div>
    </div>
  </div>
</template>
