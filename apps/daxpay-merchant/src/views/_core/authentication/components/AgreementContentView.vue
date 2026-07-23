<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue';

  import { $t, useI18n } from '@vben/locales';

  import dayjs from 'dayjs';
  import { MdPreview } from 'md-editor-v3';

  import { UserProtocolApi, type UserProtocolContent } from '#/api/system/basic/protocol/user-protocol.api';

  import 'md-editor-v3/lib/preview.css';

  defineOptions({ name: 'AgreementContentView' });

  const props = defineProps<{
    /** 协议类型: USER_AGREEMENT(用户协议) | PRIVACY_POLICY(隐私政策) */
    type: 'PRIVACY_POLICY' | 'USER_AGREEMENT';
  }>();

  const { locale } = useI18n();

  // 协议内容
  const content = ref<UserProtocolContent>({});
  const loading = ref(false);
  const isEmpty = ref(false);

  // 标题: 优先取后端返回的 title, 否则按协议类型取 i18n
  const title = computed(() => {
    return (
      content.value.title ||
      $t(props.type === 'USER_AGREEMENT' ? 'authentication.termsTitle' : 'authentication.privacyTitle')
    );
  });

  // 版本标签与生效时间等元信息
  const metaText = computed(() => {
    const parts: string[] = [];
    if (content.value.versionLabel) {
      parts.push(content.value.versionLabel);
    } else if (content.value.versionNo) {
      // 版本号
      parts.push(`v${content.value.versionNo}`);
    }
    if (content.value.effectiveTime) {
      // 生效时间
      const formatted = dayjs(content.value.effectiveTime).format('YYYY-MM-DD');
      if (formatted && formatted !== 'Invalid Date') {
        parts.push(`${$t('authentication.agreementEffectiveTime')}: ${formatted}`);
      }
    }
    return parts.join('  \u00B7  ');
  });

  /** 加载协议内容 */
  async function loadContent() {
    loading.value = true;
    isEmpty.value = false;
    try {
      const result = await UserProtocolApi.findDefault(props.type, 'WEB', locale.value);
      // 接口返回空或无正文内容时视为未配置
      if (!result?.data || !result.data.content) {
        isEmpty.value = true;
        content.value = {};
      } else {
        content.value = result.data;
      }
    } catch {
      // 协议未配置等情况, 显示空态(silentError 已拦截全局 toast)
      isEmpty.value = true;
      content.value = {};
    } finally {
      loading.value = false;
    }
  }

  onMounted(loadContent);

  // 语言切换时重新拉取对应语言的协议内容
  watch(locale, loadContent);
</script>

<template>
  <div class="flex min-h-screen w-full justify-center px-4 py-10">
    <div class="w-full max-w-4xl">
      <a-card class="rounded-lg shadow-lg" variant="borderless">
        <!-- 标题区 -->
        <div class="mb-2 text-center">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {{ title }}
          </h1>
          <p v-if="metaText" class="mt-2 text-sm text-gray-400">
            {{ metaText }}
          </p>
        </div>
        <a-divider />
        <!-- 加载态 -->
        <a-skeleton v-if="loading" active :paragraph="{ rows: 12 }" />
        <!-- 空态: 协议未配置 -->
        <a-empty v-else-if="isEmpty" :description="$t('authentication.agreementEmpty')" />
        <!-- 协议正文(Markdown 渲染) -->
        <MdPreview v-else id="agreement-content-preview" :model-value="content.content || ''" />
      </a-card>
    </div>
  </div>
</template>
