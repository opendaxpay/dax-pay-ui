<script setup lang="ts">
  import { computed } from 'vue';

  import { $t } from '@vben/locales';

  import { UserAvatar } from '../user-avatar';

  interface Props {
    /** 用户名（取首字作为头像） */
    text?: string;
    /** 指定层级，未传时自动计算最大层级 */
    zIndex?: number;
  }

  defineOptions({
    name: 'LoginExpiredModal',
  });

  const props = withDefaults(defineProps<Props>(), {
    text: '',
    zIndex: 0,
  });

  const open = defineModel<boolean>('open');

  // 排除 ant-message 和 loading（9999）的 z-index，避免误算
  const zIndexExcludeClass = ['ant-message', 'loading'];
  function isZIndexExcludeClass(element: Element) {
    return zIndexExcludeClass.some((className) => element.classList.contains(className));
  }

  /**
   * 获取当前页面最大 z-index 并 +1，确保登录过期弹窗盖在所有内容之上
   */
  function calcZIndex() {
    let maxZ = 0;
    const elements = document.querySelectorAll('*');
    [...elements].forEach((element) => {
      const style = window.getComputedStyle(element);
      const zIndex = style.getPropertyValue('z-index');
      if (zIndex && !Number.isNaN(Number.parseInt(zIndex)) && !isZIndexExcludeClass(element)) {
        maxZ = Math.max(maxZ, Number.parseInt(zIndex));
      }
    });
    return maxZ + 1;
  }

  const getZIndex = computed(() => props.zIndex || calcZIndex());
</script>

<template>
  <a-modal
    v-model:open="open"
    :closable="false"
    :mask-closable="false"
    :keyboard="false"
    :footer="null"
    :header="null"
    :z-index="getZIndex"
    :width="420"
    centered
    class="login-expired-modal"
    wrap-class="login-expired-modal-wrap"
  >
    <div class="px-10 py-6 text-center">
      <!-- 用户首字头像 -->
      <UserAvatar :text="text" :size="80" class="mx-auto mb-6" />
      <!-- 标题与副标题 -->
      <h2 class="mb-1 text-xl font-semibold text-foreground">
        {{ $t('authentication.loginAgainTitle') }}
      </h2>
      <p class="mb-4 text-sm text-muted-foreground">
        {{ $t('authentication.loginAgainSubTitle') }}
      </p>
      <!-- 登录表单（由调用方通过默认插槽传入） -->
      <slot></slot>
    </div>
  </a-modal>
</template>
