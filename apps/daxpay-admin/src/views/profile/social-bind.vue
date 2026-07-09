<script lang="ts" setup>
  import type { SocialBindResult } from '#/api/iam/social.api';

  import { computed, onMounted, onUnmounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { renderSocialAuth, SocialApi } from '#/api/iam/social.api';
  import { SocialLogo } from '#/components/social';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ProfileSocialBind' });

  const { message, confirm } = useMessage();

  /** 后端已启用的平台列表 */
  const enabledPlatforms = ref<{ source: string }[]>([]);

  const platformList = computed(() =>
    enabledPlatforms.value.map((p) => ({
      ...p,
      name: $t(`iam.social.platform.${p.source}`),
    })),
  );

  const bindList = ref<SocialBindResult[]>([]);
  const loading = ref(false);

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
   * 绑定第三方账号(打开弹窗进行授权, 授权后弹窗自动关闭并通知刷新)
   * 支付宝走专用端点, 与登录页 renderSocialAuth 一致
   */
  async function handleBind(source: string) {
    const { data: url } = await renderSocialAuth(source, 'admin', 'BIND');
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
          class="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
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
            <a-button v-else type="primary" size="small" @click="handleBind(platform.source)">
              {{ $t('profile.socialBindAction') }}
            </a-button>
          </div>
        </div>
      </div>
    </a-card>
  </a-spin>
</template>
