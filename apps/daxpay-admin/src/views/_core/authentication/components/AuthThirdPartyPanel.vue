<script lang="ts" setup>
  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { SocialApi } from '#/api/iam/social.api';
  import { SocialLogo } from '#/components/social';
  import { CLIENT_CODE } from '#/constants/client';

  defineOptions({ name: 'AuthThirdPartyPanel' });

  const props = withDefaults(defineProps<Props>(), {
    showDivider: true,
    mode: 'LOGIN',
    // 登录前的协议勾选守卫（触发调用方表单校验，返回是否已同意）
    ensureAgreement: undefined,
    // 身份域终端, 默认运营端
    client: CLIENT_CODE,
  });

  interface Props {
    showDivider?: boolean;
    // 授权场景: LOGIN=未登录直接登录, BIND=已登录绑定
    mode?: 'BIND' | 'LOGIN';
    // 登录前的协议勾选守卫（触发调用方表单校验，返回是否已同意）
    ensureAgreement?: () => Promise<boolean>;
    // 身份域 clientCode
    client?: string;
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
   * 点击三方图标, 获取授权地址并跳转(含支付宝, 统一走 SocialApi.render)
   */
  async function handleSocialLogin(source: string) {
    // 仅登录场景校验协议勾选，提示由父表单红字显示（绑定场景不校验）
    if (props.mode === 'LOGIN' && props.ensureAgreement) {
      const ok = await props.ensureAgreement();
      if (!ok) return;
    }
    const { data: url } = await SocialApi.render(source, props.client, props.mode);
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
