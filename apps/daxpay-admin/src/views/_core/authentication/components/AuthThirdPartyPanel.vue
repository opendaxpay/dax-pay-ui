<script lang="ts" setup>
  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { SocialApi } from '#/api/iam/social.api';
  import { SocialLogo } from '#/components/social';

  defineOptions({ name: 'AuthThirdPartyPanel' });

  const props = withDefaults(defineProps<Props>(), {
    showDivider: true,
    mode: 'LOGIN',
  });

  interface Props {
    showDivider?: boolean;
    // 授权场景: LOGIN=未登录直接登录, BIND=已登录绑定
    mode?: 'BIND' | 'LOGIN';
  }

  // 已启用的第三方平台列表(由后端配置驱动)
  const platformList = ref<{ source: string }[]>([]);

  /**
   * 拉取后端已启用的第三方登录平台
   */
  async function fetchEnabledList() {
    const { data } = await SocialApi.enabledList();
    platformList.value = data ?? [];
  }

  /**
   * 点击三方图标, 获取授权地址并跳转
   */
  async function handleSocialLogin(source: string) {
    const { data: url } = await SocialApi.render(source, props.mode);
    if (url) {
      // 跳转到第三方授权页, 授权后由后端回调处理并重定向回前端 /oauth-callback
      window.location.href = url;
    }
  }

  onMounted(fetchEnabledList);
</script>

<template>
  <div v-if="platformList.length > 0" class="mt-6">
    <a-divider v-if="props.showDivider" class="!text-gray-400">
      <!-- 国际化: 其他登录方式 -->
      <span class="text-xs">{{ $t('authentication.thirdPartyLogin') }}</span>
    </a-divider>
    <div class="flex flex-wrap justify-center gap-2">
      <a-tooltip v-for="item in platformList" :key="item.source" :title="$t(`iam.social.platform.${item.source}`)">
        <a-button
          type="text"
          size="large"
          class="social-btn !flex !h-10 !w-10 !items-center !justify-center !p-0"
          @click="handleSocialLogin(item.source)"
        >
          <SocialLogo :source="item.source" :size="28" />
        </a-button>
      </a-tooltip>
    </div>
  </div>
</template>

<style scoped>
  .social-btn :deep(.logo-img) {
    transition: transform 0.2s ease;
  }

  .social-btn:hover :deep(.logo-img) {
    transform: scale(1.1);
  }
</style>
