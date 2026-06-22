<script lang="ts" setup>
  import type { SocialBindResult } from '#/api/iam/social.api';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { SocialApi } from '#/api/iam/social.api';
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
   * 绑定第三方账号(跳转授权, 授权后由后端回调处理)
   */
  async function handleBind(source: string) {
    const { data: url } = await SocialApi.render(source, 'BIND');
    if (url) {
      window.location.href = url;
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

  onMounted(fetchData);
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
