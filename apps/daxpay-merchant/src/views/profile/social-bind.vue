<script lang="ts" setup>
  import type { SocialBindResult } from '#/api/iam/social.api';
  import type { SocialEnabledPlatform } from '#/api/iam/social.api';

  import { computed, onMounted, onUnmounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { SocialApi } from '#/api/iam/social.api';
  import { SocialLogo } from '#/components/social';
  import { CLIENT_CODE } from '#/constants/client';
  import { useMessage } from '#/hooks/useMessage';

  import SocialBindScanModal from './components/SocialBindScanModal.vue';

  defineOptions({ name: 'ProfileSocialBind' });

  const { message, confirm } = useMessage();

  /** 后端已启用的平台列表 */
  const enabledPlatforms = ref<SocialEnabledPlatform[]>([]);

  const platformList = computed(() =>
    enabledPlatforms.value.map((p) => ({
      ...p,
      name: $t(`iam.social.platform.${p.source}`),
    })),
  );

  const bindList = ref<SocialBindResult[]>([]);
  const loading = ref(false);

  /** 扫码绑定弹窗(公众号等仅微信内可授权的平台) */
  const scanVisible = ref(false);
  const scanSource = ref('');
  const scanPlatformName = ref('');

  /** 拉取已启用平台 + 已绑定账号 */
  async function fetchData() {
    loading.value = true;
    try {
      const [{ data: platforms }, { data: binds }] = await Promise.all([SocialApi.enabledList(), SocialApi.bindList()]);
      enabledPlatforms.value = platforms ?? [];
      bindList.value = binds ?? [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 查找平台是否已绑定
   */
  function findBind(source: string) {
    return bindList.value.find((item) => item.source === source);
  }

  /**
   * 是否微信内置浏览器(公众号网页授权仅微信内可完成)
   */
  function isWechatClient() {
    return /MicroMessenger/i.test(navigator.userAgent);
  }

  /**
   * 绑定第三方账号
   *
   * 普通平台: 打开弹窗授权, 授权后弹窗自动关闭并通知刷新;
   * 公众号等仅微信内可授权的平台: PC 浏览器改走扫码跨设备绑定(手机微信扫码完成授权)
   */
  async function handleBind(source: string, scanBind?: boolean, platformName?: string) {
    if (scanBind && !isWechatClient()) {
      scanSource.value = source;
      scanPlatformName.value = platformName ?? source;
      scanVisible.value = true;
      return;
    }
    const { data: url } = await SocialApi.render(source, CLIENT_CODE, 'BIND');
    if (url) {
      window.open(url, 'social-bind', 'width=600,height=700');
    }
  }

  /**
   * 监听弹窗回传的绑定结果
   */
  function handlePostMessage(event: MessageEvent) {
    if (event.data?.type === 'social_bind_success') {
      message.success($t('profile.socialBindSuccess'));
      fetchData();
    }
  }

  /**
   * 解绑第三方账号
   */
  function handleUnbind(source: string, nickname?: string) {
    confirm({
      title: $t('profile.socialUnbindTitle'),
      content: $t('profile.socialUnbindConfirm', { name: nickname || source }),
      onOk: async () => {
        await SocialApi.unbind(source);
        message.success($t('profile.socialUnbindSuccess'));
        await fetchData();
      },
    });
  }

  onMounted(() => {
    window.addEventListener('message', handlePostMessage);
    fetchData();
  });

  onUnmounted(() => {
    window.removeEventListener('message', handlePostMessage);
  });
</script>

<template>
  <a-spin :spinning="loading">
    <a-card :title="$t('profile.socialBind')" variant="borderless">
      <a-empty v-if="platformList.length === 0" :description="$t('profile.socialUnbound')" />
      <div v-else class="space-y-3">
        <div
          v-for="platform in platformList"
          :key="platform.source"
          class="flex items-center justify-between border-b border-border py-3 last:border-0"
        >
          <div class="flex items-center gap-3">
            <SocialLogo :source="platform.source" :size="32" />
            <span class="text-base font-medium">{{ platform.name }}</span>
            <template v-if="findBind(platform.source)">
              <a-tag color="green">{{ $t('profile.socialBound') }}</a-tag>
              <span class="text-sm text-gray-500">
                {{ findBind(platform.source)?.username }}
              </span>
            </template>
            <a-tag v-else color="default">{{ $t('profile.socialUnbound') }}</a-tag>
          </div>
          <div>
            <template v-if="findBind(platform.source)">
              <a-button danger size="small" @click="handleUnbind(platform.source, findBind(platform.source)?.username)">
                {{ $t('profile.socialUnbindAction') }}
              </a-button>
            </template>
            <a-button
              v-else
              type="primary"
              size="small"
              @click="handleBind(platform.source, platform.scanBind, platform.name)"
            >
              {{ $t('profile.socialBindAction') }}
            </a-button>
          </div>
        </div>
      </div>
    </a-card>
    <!-- 公众号扫码绑定弹窗(手机微信扫码完成授权) -->
    <SocialBindScanModal
      v-model:open="scanVisible"
      :source="scanSource"
      :platform-name="scanPlatformName"
      @success="fetchData"
    />
  </a-spin>
</template>
