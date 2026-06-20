<script setup lang="ts">
  defineOptions({
    name: 'AuthenticationFormView',
  });

  defineProps<{
    dataSide?: 'bottom' | 'left' | 'right' | 'top';
  }>();
</script>

<template>
  <div class="relative flex-col-center bg-background px-6 py-10 lg:flex-initial lg:px-8 dark:bg-background-deep">
    <slot></slot>
    <!-- Router View with Transition and KeepAlive -->
    <RouterView v-slot="{ Component, route }">
      <KeepAlive :include="['Login']">
        <component
          :is="Component"
          :key="route.fullPath"
          class="auth-view-enter mt-6 w-full sm:mx-auto md:max-w-md"
        />
      </KeepAlive>
    </RouterView>

    <!-- Footer Copyright -->

    <div class="absolute bottom-3 flex text-center text-xs text-muted-foreground">
      <slot name="copyright"> </slot>
    </div>
  </div>
</template>

<style scoped>
  /* 路由切换时登录区卡片淡入 + 轻微位移：纯 CSS animation，不依赖 transitionend，规避 out-in 白屏 */
  .auth-view-enter {
    animation: auth-fade-slide-in 0.25s cubic-bezier(0.25, 0.8, 0.5, 1);
  }

  @keyframes auth-fade-slide-in {
    from {
      opacity: 0;
      transform: translateX(15px);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
