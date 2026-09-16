<script setup lang="ts">
  import type { ConfigSubForm } from '../config-sub-form';

  import { computed, ref } from 'vue';

  import { PageShell } from '@daxpay/ui-biz/components/page-shell';

  import { $t } from '#/locales';

  import MailConfigForm from './mail/MailConfigForm.vue';
  import OssConfigForm from './oss/OssConfigForm.vue';
  import SensitiveWordConfigForm from './sensitive-word/SensitiveWordConfigForm.vue';
  import UrlConfigForm from './url/UrlConfigForm.vue';
  import WebsiteConfigForm from './website/WebsiteConfigForm.vue';

  defineOptions({ name: 'PlatformConfig' });

  // 默认展示端点配置(基础配置优先)
  const activeKey = ref<string>('url');

  // 当前激活子表单实例(供常驻 header 渲染操作按钮与状态标签)
  const subForm = ref<ConfigSubForm | null>(null);

  const tabs = [
    {
      key: 'url',
      // 端点配置标题
      label: $t('system.platform.url.title'),
      // 端点配置描述
      description: $t('system.platform.url.description'),
    },
    {
      key: 'website',
      // 站点配置标题
      label: $t('system.platform.website.title'),
      // 站点配置描述
      description: $t('system.platform.website.description'),
    },
    {
      key: 'oss',
      // OSS配置标题
      label: $t('system.platform.oss.title'),
      // OSS配置描述
      description: $t('system.platform.oss.description'),
    },
    {
      key: 'mail',
      // 邮件配置标题
      label: $t('system.platform.mail.title'),
      // 邮件配置描述
      description: $t('system.platform.mail.description'),
    },
    {
      key: 'sensitive-word',
      // 敏感词策略标题
      label: $t('system.sensitiveWord.config.title'),
      // 敏感词策略描述
      description: $t('system.sensitiveWord.config.description'),
    },
  ] as const;

  // 当前激活 tab(key 异常时回退首项), 标题/描述常驻右栏 header
  const activeTab = computed(() => {
    return tabs.find((tab) => tab.key === activeKey.value) ?? tabs[0]!;
  });
</script>

<template>
  <PageShell :title="activeTab.label" :description="activeTab.description" :tags="subForm?.summaryTags ?? []">
    <!-- 配置页外壳: 左右栏各自内部滚动, 右栏 header(标题/描述/操作按钮)常驻 -->
    <!-- 左栏: 分组导航 -->
    <template #nav>
      <!-- 平台配置标题 -->
      <div class="config-nav__title">{{ $t('system.platform.common.title') }}</div>
      <!-- 平台配置描述 -->
      <div class="config-nav__desc">{{ $t('system.platform.common.description') }}</div>

      <div class="config-tab-list">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="config-tab-item"
          :class="{ 'config-tab-item--active': activeKey === tab.key }"
          @click="activeKey = tab.key"
        >
          <div class="config-tab-item__label">{{ tab.label }}</div>
          <div class="config-tab-item__desc">{{ tab.description }}</div>
        </button>
      </div>
    </template>

    <!-- 右上操作区: 编辑/取消/保存按钮常驻 -->
    <template v-if="subForm" #actions>
      <!-- 非编辑状态: 显示编辑按钮 -->
      <template v-if="!subForm.isEditing">
        <a-button type="primary" @click="subForm.handleEdit()">{{ $t('common.edit') }}</a-button>
      </template>
      <!-- 编辑状态: 显示取消和保存按钮 -->
      <template v-else>
        <a-button @click="subForm.handleCancel()">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="subForm.saving" @click="subForm.handleSave()">
          {{ $t('common.save') }}
        </a-button>
      </template>
    </template>

    <UrlConfigForm v-if="activeKey === 'url'" ref="subForm" />
    <WebsiteConfigForm v-if="activeKey === 'website'" ref="subForm" />
    <OssConfigForm v-if="activeKey === 'oss'" ref="subForm" />
    <MailConfigForm v-if="activeKey === 'mail'" ref="subForm" />
    <SensitiveWordConfigForm v-if="activeKey === 'sensitive-word'" ref="subForm" />
  </PageShell>
</template>
