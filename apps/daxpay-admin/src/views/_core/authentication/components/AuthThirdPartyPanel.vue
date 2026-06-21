<script lang="ts" setup>
  import { computed } from 'vue';

  import { SvgGithubIcon, SvgQQChatIcon, SvgWeChatIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  import { SocialApi } from '#/api/iam/social.api';

  defineOptions({ name: 'AuthThirdPartyPanel' });

  interface Props {
    showDivider?: boolean;
    // 授权场景: LOGIN=未登录直接登录, BIND=已登录绑定
    mode?: 'BIND' | 'LOGIN';
  }

  const props = withDefaults(defineProps<Props>(), {
    showDivider: true,
    mode: 'LOGIN',
  });

  // 仅展示后端支持且有图标的平台
  const thirdPartyList = computed(() => [
    // 国际化: 微信登录
    { icon: SvgWeChatIcon, name: $t('authentication.wechatLogin'), key: 'weChat' },
    // 国际化: QQ登录
    { icon: SvgQQChatIcon, name: $t('authentication.qqLogin'), key: 'qq' },
    // 国际化: Github登录
    { icon: SvgGithubIcon, name: $t('authentication.githubLogin'), key: 'github' },
  ]);

  /**
   * 点击三方图标, 获取授权地址并跳转
   */
  async function handleSocialLogin(key: string) {
    const url = (await SocialApi.render(key, props.mode)).data;
    if (url) {
      // 跳转到第三方授权页, 授权后由后端回调处理并重定向回前端 /oauth-callback
      window.location.href = url;
    }
  }
</script>

<template>
  <div class="mt-6">
    <a-divider v-if="props.showDivider" class="!text-gray-400">
      <!-- 国际化: 其他登录方式 -->
      <span class="text-xs">{{ $t('authentication.thirdPartyLogin') }}</span>
    </a-divider>
    <div class="flex flex-wrap justify-center gap-2">
      <a-tooltip v-for="item in thirdPartyList" :key="item.key" :title="item.name">
        <a-button
          type="text"
          size="large"
          class="!flex !h-10 !w-10 !items-center !justify-center !p-0"
          @click="handleSocialLogin(item.key)"
        >
          <component :is="item.icon" class="h-5 w-5 text-gray-500 hover:text-blue-500" />
        </a-button>
      </a-tooltip>
    </div>
  </div>
</template>
