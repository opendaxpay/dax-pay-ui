<script lang="ts" setup>
  import type { ConfigSubForm } from '../config-sub-form';

  import { computed, ref } from 'vue';

  import { PageShell } from '@daxpay/ui-biz/components/page-shell';

  import { $t } from '#/locales';
  import SocialLoginConfigList from '#/views/iam/social/social-login-config.vue';

  import AlipayAuthConfigForm from './alipay/AlipayAuthConfigForm.vue';
  import DouyinH5AuthConfigForm from './douyin-h5/DouyinH5AuthConfigForm.vue';
  import SocialAutoLoginConfigForm from './SocialAutoLoginConfigForm.vue';
  import WechatMpAuthConfigForm from './wechat-mp/WechatMpAuthConfigForm.vue';

  defineOptions({ name: 'ThirdPlatform' });

  // 默认展示"三方平台登录配置"(基础配置优先)
  const activeKey = ref<string>('loginConfig');

  // 当前激活子表单实例(供常驻 header 渲染操作按钮与状态标签; 卡片墙列表不绑定)
  const subForm = ref<ConfigSubForm | null>(null);

  // 左侧 tab 清单
  const tabs = [
    {
      key: 'loginConfig',
      // 三方平台登录配置标题
      label: $t('system.thirdPlatform.loginConfig.title'),
      // 三方平台登录配置描述
      description: $t('system.thirdPlatform.loginConfig.description'),
    },
    {
      key: 'autoLogin',
      // 应用内自动登录标题
      label: $t('system.thirdPlatform.autoLogin.tabTitle'),
      // 应用内自动登录描述
      description: $t('system.thirdPlatform.autoLogin.tabDescription'),
    },
    {
      key: 'alipay',
      // 支付宝应用标题
      label: $t('system.thirdPlatform.alipay.tabTitle'),
      // 支付宝应用描述
      description: $t('system.thirdPlatform.alipay.tabDescription'),
    },
    {
      key: 'wechatMp',
      // 微信公众号标题
      label: $t('system.thirdPlatform.wechatMp.tabTitle'),
      // 微信公众号描述
      description: $t('system.thirdPlatform.wechatMp.tabDescription'),
    },
    {
      key: 'douyinH5',
      // 抖音 H5 应用标题
      label: $t('system.thirdPlatform.douyinH5.tabTitle'),
      // 抖音 H5 应用描述
      description: $t('system.thirdPlatform.douyinH5.tabDescription'),
    },
  ] as const;

  // 当前激活 tab(key 异常时回退首项), 标题/描述常驻右栏 header
  const activeTab = computed(() => {
    return tabs.find((tab) => tab.key === activeKey.value) ?? tabs[0]!;
  });

  /**
   * 跳转型平台卡片点击时, 切换到对应平台级配置 tab
   * 目前仅支付宝仍属于三方登录跳转型
   */
  function handleJump(source: string) {
    if (source === 'alipay') {
      activeKey.value = 'alipay';
    } else if (source === 'weChat') {
      // 微信公众号: 跳转到平台级凭据 Tab
      activeKey.value = 'wechatMp';
    }
  }
</script>

<template>
  <!-- 配置页外壳: 左右栏各自内部滚动, 右栏 header(标题/描述/操作按钮)常驻 -->
  <PageShell :title="activeTab.label" :description="activeTab.description" :tags="subForm?.summaryTags ?? []">
    <!-- 左栏: 分组导航 -->
    <template #nav>
      <!-- 三方平台管理标题 -->
      <div class="config-nav__title">{{ $t('system.thirdPlatform.common.title') }}</div>
      <!-- 三方平台管理描述 -->
      <div class="config-nav__desc">{{ $t('system.thirdPlatform.common.description') }}</div>

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

    <!-- 右上操作区: 编辑/取消/保存按钮常驻(卡片墙列表等未暴露编辑接口的内容页不渲染) -->
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

    <!-- 三方登录卡片墙(v-show 保持列表状态, 不暴露编辑接口) -->
    <SocialLoginConfigList v-show="activeKey === 'loginConfig'" @jump="handleJump" />
    <SocialAutoLoginConfigForm v-if="activeKey === 'autoLogin'" ref="subForm" />
    <AlipayAuthConfigForm v-if="activeKey === 'alipay'" ref="subForm" />
    <WechatMpAuthConfigForm v-if="activeKey === 'wechatMp'" ref="subForm" />
    <DouyinH5AuthConfigForm v-if="activeKey === 'douyinH5'" ref="subForm" />
  </PageShell>
</template>
