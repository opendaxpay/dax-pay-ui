<script lang="ts" setup>
  import { computed } from 'vue';

  import { SvgGithubIcon, SvgGoogleIcon, SvgQQChatIcon, SvgWeChatIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  defineOptions({ name: 'AuthThirdPartyPanel' });

  withDefaults(defineProps<Props>(), {
    showDivider: true,
  });

  interface Props {
    showDivider?: boolean;
  }

  const thirdPartyList = computed(() => [
    // 国际化：微信登录
    { icon: SvgWeChatIcon, name: $t('authentication.wechatLogin'), key: 'wechat' },
    // 国际化：QQ登录
    { icon: SvgQQChatIcon, name: $t('authentication.qqLogin'), key: 'qq' },
    // 国际化：Github登录
    { icon: SvgGithubIcon, name: $t('authentication.githubLogin'), key: 'github' },
    // 国际化：Google登录
    { icon: SvgGoogleIcon, name: $t('authentication.googleLogin'), key: 'google' },
  ]);
</script>

<template>
  <div class="mt-6">
    <a-divider v-if="showDivider" class="!text-gray-400">
      <!-- 国际化：其他登录方式 -->
      <span class="text-xs">{{ $t('authentication.thirdPartyLogin') }}</span>
    </a-divider>
    <div class="flex flex-wrap justify-center gap-2">
      <a-tooltip v-for="item in thirdPartyList" :key="item.key" :title="item.name">
        <a-button type="text" size="large" class="!flex !h-10 !w-10 !items-center !justify-center !p-0">
          <component :is="item.icon" class="h-5 w-5 text-gray-500 hover:text-blue-500" />
        </a-button>
      </a-tooltip>
    </div>
  </div>
</template>
