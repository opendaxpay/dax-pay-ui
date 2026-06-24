<script lang="ts" setup>
  import type { SocialBindResult } from '#/api/iam/user-social.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { SocialApi } from '#/api/iam/social.api';
  import { UserSocialApi } from '#/api/iam/user-social.api';
  import { SocialLogo } from '#/components/social';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'UserSocialBind' });

  const { message, confirm } = useMessage();

  /** 抽屉可见性 */
  const visible = ref(false);

  /** 加载状态 */
  const loading = ref(false);

  /** 当前用户ID */
  const userId = ref('');

  /** 当前用户名(用于标题) */
  const userName = ref('');

  /** 已启用的平台列表 */
  const enabledPlatforms = ref<{ source: string }[]>([]);

  /** 目标用户的绑定列表 */
  const bindList = ref<SocialBindResult[]>([]);

  /** 平台列表(合并启用 + 绑定状态) */
  const platformList = computed(() =>
    enabledPlatforms.value.map((p) => ({
      ...p,
      name: $t(`iam.social.platform.${p.source}`),
    })),
  );

  /** 抽屉标题 */
  const drawerTitle = computed(() =>
    userName.value ? `${$t('iam.user.social.title')} - ${userName.value}` : $t('iam.user.social.title'),
  );

  /**
   * 查找平台是否已绑定
   */
  function findBind(source: string) {
    return bindList.value.find((item) => item.source === source);
  }

  /**
   * 打开抽屉
   * @param id 用户ID
   * @param name 用户名(用于标题显示)
   */
  async function show(id: number | string, name?: string) {
    userId.value = String(id);
    userName.value = name || '';
    visible.value = true;
    await fetchData();
  }

  /**
   * 拉取数据: 已启用平台 + 目标用户绑定列表
   */
  async function fetchData() {
    loading.value = true;
    try {
      const [{ data: platforms }, { data: binds }] = await Promise.all([
        SocialApi.enabledList(),
        UserSocialApi.bindList(userId.value),
      ]);
      enabledPlatforms.value = platforms ?? [];
      bindList.value = binds ?? [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 解绑第三方账号
   */
  function handleUnbind(source: string, nickname?: string) {
    confirm({
      title: $t('common.confirm'),
      content: $t('iam.user.social.unbindConfirm', { name: nickname || source }),
      onOk: async () => {
        await UserSocialApi.unbind(userId.value, source);
        message.success($t('iam.user.social.unbindSuccess'));
        await fetchData();
      },
    });
  }

  defineExpose({
    show,
  });
</script>

<template>
  <a-drawer v-model:open="visible" :title="drawerTitle" :size="640" :destroy-on-hidden="true">
    <a-spin :spinning="loading">
      <a-empty v-if="platformList.length === 0" :description="$t('iam.user.social.noEnabled')" />
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
              <a-tag color="green">{{ $t('iam.user.social.bound') }}</a-tag>
              <span class="text-sm text-gray-500">
                {{ findBind(platform.source)?.username }}
              </span>
            </template>
            <a-tag v-else color="default">{{ $t('iam.user.social.unbound') }}</a-tag>
          </div>
          <div>
            <a-button
              v-if="findBind(platform.source)"
              danger
              size="small"
              @click="handleUnbind(platform.source, findBind(platform.source)?.username)"
            >
              {{ $t('iam.user.social.unbindAction') }}
            </a-button>
          </div>
        </div>
      </div>
    </a-spin>
  </a-drawer>
</template>
