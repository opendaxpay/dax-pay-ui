<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue';

  import { LockKeyhole } from '@vben/icons';
  import { $t, useI18n } from '@vben/locales';
  import { storeToRefs, useAccessStore } from '@vben/stores';

  import { useDateFormat, useNow, useScrollLock } from '@vueuse/core';

  import { UserAvatar } from '#/components/user-avatar';
  import { useMessage } from '#/hooks/useMessage';

  interface Props {
    /** 用户名（用于问候语展示，并取首字作为头像） */
    text?: string;
  }

  withDefaults(defineProps<Props>(), {
    text: '',
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
  // 密码错误标记，用于输入框 status 与抖动动画
  const isError = ref(false);

  // 根据当前小时段返回问候语 i18n key（早安/上午好/中午好/下午好/晚上好/夜深了）
  const greetingKey = computed(() => {
    const h = Number(hour.value);
    if (h < 6) return 'ui.widgets.lockScreen.greeting.night';
    if (h < 9) return 'ui.widgets.lockScreen.greeting.morning';
    if (h < 12) return 'ui.widgets.lockScreen.greeting.forenoon';
    if (h < 14) return 'ui.widgets.lockScreen.greeting.noon';
    if (h < 18) return 'ui.widgets.lockScreen.greeting.afternoon';
    return 'ui.widgets.lockScreen.greeting.evening';
  });

  /** 提交解锁 */
  function handleSubmit() {
    // 密码不能为空
    if (!password.value) {
      message.warning($t('authentication.passwordTip'));
      return;
    }
    // 密码正确则解锁，否则清空、抖动并提示
    if (lockScreenPassword?.value === password.value) {
      accessStore.unlockScreen();
    } else {
      message.error($t('authentication.passwordErrorTip'));
      password.value = '';
      // 触发抖动动画：先复位再置位，确保连续错误时动画可重复触发
      isError.value = false;
      nextTick(() => {
        isError.value = true;
        // 抖动结束后复位，避免影响后续输入态
        setTimeout(() => {
          isError.value = false;
        }, 400);
      });
    }
  }

  /** 切换到解锁表单 */
  function toggleUnlockForm() {
    showUnlockForm.value = !showUnlockForm.value;
    if (showUnlockForm.value) {
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  }

  /** 返回时钟页（解锁表单的 Esc / 返回按钮） */
  function backToClock() {
    showUnlockForm.value = false;
    password.value = '';
  }

  // 锁定 body 滚动，组件卸载后自动恢复
  const bodyScrollLock = useScrollLock(document.body);
  bodyScrollLock.value = true;
</script>

<template>
  <div
    class="fixed inset-0 z-[2000] overflow-hidden bg-background"
    tabindex="0"
    @keydown.enter.prevent="!showUnlockForm && toggleUnlockForm()"
  >
    <!-- 背景氛围层：主题色径向渐变 overlay，营造柔和层次（极简扁平风，无图片） -->
    <div class="lock-screen-overlay pointer-events-none absolute inset-0" />

    <!-- 时钟锁定页：无过渡动画，即时切换，避免动画期间露出底层纯白背景 -->
    <div v-show="!showUnlockForm" class="relative size-full">
      <!-- 顶部解锁入口：环形可点击区域，发现性优于裸图标 -->
      <div
        class="group absolute left-1/2 top-6 z-[2001] flex -translate-x-1/2 cursor-pointer flex-col items-center rounded-full px-5 py-2 text-foreground/70 ring-1 ring-border transition-all duration-300 hover:bg-accent hover:text-foreground"
        @click="toggleUnlockForm"
      >
        <LockKeyhole class="size-5 transition-all duration-300 group-hover:scale-125" />
        <span class="mt-1 text-sm font-medium">{{ $t('ui.widgets.lockScreen.unlock') }}</span>
      </div>

      <!-- 居中时钟 + 问候语 -->
      <div class="flex size-full flex-col items-center justify-center gap-8 px-4">
        <!-- 时钟：两个描边卡片（替代原扁平灰块） -->
        <div class="flex w-full justify-center gap-4 sm:gap-6 md:gap-8">
          <div
            class="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-border bg-card/60 text-[40px] font-semibold tabular-nums backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg sm:h-40 sm:w-40 sm:text-[52px] md:h-48 md:w-48 md:text-[72px]"
          >
            <span class="absolute left-3 top-3 text-xs font-medium text-muted-foreground sm:text-sm md:text-base">
              {{ meridiem }}
            </span>
            {{ hour }}
          </div>
          <div
            class="flex h-32 w-32 items-center justify-center rounded-2xl border border-border bg-card/60 text-[40px] font-semibold tabular-nums backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg sm:h-40 sm:w-40 sm:text-[52px] md:h-48 md:w-48 md:text-[72px]"
          >
            {{ minute }}
          </div>
        </div>

        <!-- 问候语 + 用户名 -->
        <div class="text-center">
          <div class="text-xl font-medium text-foreground sm:text-2xl">
            {{ $t(greetingKey) }}<span v-if="text">，{{ text }}</span>
          </div>
          <div class="mt-1 text-sm text-muted-foreground sm:text-base">{{ date }}</div>
        </div>
      </div>
    </div>

    <!-- 解锁表单：无过渡动画，即时切换，避免动画期间露出底层纯白背景 -->
    <div
      v-show="showUnlockForm"
      class="relative flex size-full items-center justify-center"
      @keydown.enter.prevent="handleSubmit"
      @keydown.esc.prevent="backToClock"
    >
      <!-- 毛玻璃卡片容器 -->
      <div
        class="flex w-[90%] max-w-sm flex-col items-center rounded-2xl border border-border bg-card/60 px-8 py-10 shadow-xl backdrop-blur-md"
        :class="{ 'animate-[vben-lock-shake_0.4s_ease-in-out]': isError }"
      >
        <!-- 头像：环形描边主题色首字头像 + 外层柔光 -->
        <div class="relative mb-4">
          <UserAvatar :text="text || $t('ui.widgets.lockScreen.guest')" :size="80" ring glow />
        </div>
        <!-- 用户名 + 小字问候语 -->
        <div class="mb-6 text-center">
          <div class="text-lg font-semibold text-foreground">{{ text || $t('ui.widgets.lockScreen.guest') }}</div>
          <div class="mt-1 text-sm text-muted-foreground">{{ $t(greetingKey) }}</div>
        </div>

        <!-- 密码输入框 -->
        <div class="mb-4 w-full">
          <a-input-password
            ref="inputRef"
            v-model:value="password"
            :placeholder="$t('ui.widgets.lockScreen.placeholder')"
            :status="isError ? 'error' : undefined"
            size="large"
            allow-clear
          />
        </div>

        <!-- 主按钮：进入系统 -->
        <a-button type="primary" block size="large" class="mb-3" @click="handleSubmit">
          {{ $t('ui.widgets.lockScreen.entry') }}
        </a-button>

        <!-- 次级操作：返回登录 / 返回，一行两按钮 -->
        <div class="flex w-full gap-2">
          <a-button block size="large" @click="$emit('toLogin')">
            {{ $t('ui.widgets.lockScreen.backToLogin') }}
          </a-button>
          <a-button block size="large" @click="backToClock">
            {{ $t('common.back') }}
          </a-button>
        </div>
      </div>
    </div>

    <!-- 底部时间：解锁页显示时:分+日期。absolute 定位常驻 DOM，无动画即时切换，
         避免任何过渡期间露出底层纯白背景。z-[2002] 确保盖在解锁卡片之上 -->
    <div
      v-show="showUnlockForm"
      class="pointer-events-none absolute bottom-6 w-full text-center text-sm text-muted-foreground md:text-base"
    >
      {{ hour }}:{{ minute }} <span class="ml-1">{{ meridiem }}</span>
      <span class="mx-2">·</span>
      {{ date }}
    </div>
  </div>
</template>

<style scoped>
  /* 背景氛围层：主题色径向渐变，营造柔和层次（极简扁平风，无图片） */
  .lock-screen-overlay {
    background:
      radial-gradient(ellipse at top, hsl(var(--primary) / 0.08), transparent 55%),
      radial-gradient(ellipse at bottom, hsl(var(--primary) / 0.05), transparent 60%);
  }

  /* 密码错误抖动动画（解锁卡片左右轻晃），与项目过渡风格保持一致 */
  @keyframes vben-lock-shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20% {
      transform: translateX(-8px);
    }
    40% {
      transform: translateX(8px);
    }
    60% {
      transform: translateX(-6px);
    }
    80% {
      transform: translateX(6px);
    }
  }
</style>
