<script lang="ts" setup>
  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AuthQrCodePanel' });

  withDefaults(defineProps<Props>(), {
    showTitle: true,
  });

  interface Props {
    showTitle?: boolean;
  }

  const { message } = useMessage();

  // 二维码加载状态
  const loading = ref(true);

  // 演示用二维码图片（使用在线二维码生成服务）
  const qrcodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://vben.vvbin.cn';

  /**
   * 二维码加载完成
   */
  function handleImageLoad() {
    loading.value = false;
  }

  /**
   * 二维码加载失败
   */
  function handleImageError() {
    loading.value = false;
    message.error('二维码加载失败');
  }

  /**
   * 刷新二维码
   */
  function refreshQrCode() {
    message.info('二维码刷新功能待接入');
  }

  onMounted(() => {
    // 如果图片加载很快，设置一个最小显示时间
    setTimeout(() => {
      loading.value = false;
    }, 500);
  });
</script>

<template>
  <div class="flex flex-col items-center">
    <div v-if="showTitle" class="mb-4 text-center">
      <p class="mb-1 text-lg font-medium text-gray-900 dark:text-gray-100">
        <!-- 国际化：扫码登录 -->
        {{ $t('authentication.qrcodeLogin') }}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        <!-- 国际化：请用手机扫描二维码登录 -->
        {{ $t('authentication.qrcodeSubtitle') }}
      </p>
    </div>

    <div class="group relative mb-4 cursor-pointer" @click="refreshQrCode">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <a-spin size="large" />
      </div>

      <!-- 二维码图片 -->
      <img
        v-show="!loading"
        :src="qrcodeUrl"
        alt="QR Code"
        class="h-48 w-48 rounded-lg"
        @load="handleImageLoad"
        @error="handleImageError"
      />

      <!-- 悬停刷新遮罩 -->
      <div
        v-show="!loading"
        class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <IconifyIcon icon="ant-design:reload-outlined" class="text-3xl text-white" />
      </div>
    </div>

    <p class="text-center text-sm text-gray-500 dark:text-gray-400">
      <!-- 国际化：扫码后点击 '确认'，即可完成登录 -->
      {{ $t('authentication.qrcodePrompt') }}
    </p>
  </div>
</template>
