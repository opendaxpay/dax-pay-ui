<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { SocialApi } from '#/api/iam/social.api';
  import type { SocialBindResult } from '#/api/iam/social.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ProfileSocialBind' });

  const { message, confirm } = useMessage();

  // 当前系统支持的平台列表
  const platforms = [
    { source: 'weChat' },
    { source: 'weCom' },
    { source: 'qq' },
    { source: 'github' },
    { source: 'gitee' },
    { source: 'feishu' },
    { source: 'dingTalk' },
  ];

  const platformList = computed(() =>
    platforms.map((p) => ({
      ...p,
      name: $t(`iam.social.platform.${p.source}`),
    })),
  );

  const bindList = ref<SocialBindResult[]>([]);
  const loading = ref(false);

  /**
   * 查询已绑定的第三方账号
   */
  async function fetchBindList() {
    loading.value = true;
    try {
      bindList.value = (await SocialApi.bindList()).data;
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
    const url = (await SocialApi.render(source, 'BIND')).data;
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
        await fetchBindList();
      },
    });
  }

  onMounted(fetchBindList);
</script>

<template>
  <a-spin :spinning="loading">
    <a-card :title="$t('profile.socialBind')" :bordered="false">
      <div class="space-y-3">
        <div
          v-for="platform in platformList"
          :key="platform.source"
          class="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
        >
          <div class="flex items-center gap-3">
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
