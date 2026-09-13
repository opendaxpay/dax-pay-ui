<script setup lang="ts">
  import type { ConfigSubForm } from '../config-sub-form';

  import { computed, ref } from 'vue';

  import { PageShell } from '@daxpay/ui-biz/components/page-shell';

  import { $t } from '#/locales';

  import IamReplayProtect from './components/IamReplayProtect.vue';
  import LoginSecurity from './components/LoginSecurity.vue';
  import PasswordPolicy from './components/PasswordPolicy.vue';
  import SessionManagement from './components/SessionManagement.vue';
  import TwoFactorAuth from './components/TwoFactorAuth.vue';
  import WebAuthnConfig from './components/WebAuthnConfig.vue';

  defineOptions({ name: 'SystemSecurityConfig' });

  const activeKey = ref<string>('passwordPolicy');

  // 当前激活子表单实例(供常驻 header 渲染操作按钮与状态标签)
  const subForm = ref<ConfigSubForm | null>(null);

  // 左侧导航: 访问安全(IAM域)
  const tabGroup = [
    {
      key: 'passwordPolicy',
      // 密码策略标题
      label: $t('system.security.password-policy.title'),
      // 密码策略描述
      description: $t('system.security.password-policy.description'),
    },
    {
      key: 'loginSecurity',
      // 登录安全标题
      label: $t('system.security.login-security.title'),
      // 登录安全描述
      description: $t('system.security.login-security.description'),
    },
    {
      key: 'sessionManagement',
      // 会话管理标题
      label: $t('system.security.session-management.title'),
      // 会话管理描述
      description: $t('system.security.session-management.description'),
    },
    {
      key: 'twoFactorAuth',
      // 双因素认证标题
      label: $t('system.security.two-factor-auth.title'),
      // 双因素认证描述
      description: $t('system.security.two-factor-auth.description'),
    },
    {
      key: 'webauthn',
      // 通行密钥标题
      label: $t('system.security.webauthn.title'),
      // 通行密钥描述
      description: $t('system.security.webauthn.description'),
    },
    {
      key: 'iamReplayProtect',
      // 防重放校验标题
      label: $t('system.security.iam-replay-protect.title'),
      // 防重放校验描述
      description: $t('system.security.iam-replay-protect.description'),
    },
  ] as const;

  // 当前激活 tab(key 异常时回退首项), 标题/描述常驻右栏 header
  const activeTab = computed(() => {
    return tabGroup.find((tab) => tab.key === activeKey.value) ?? tabGroup[0]!;
  });
</script>

<template>
  <!-- 配置页外壳: 左右栏各自内部滚动, 右栏 header(标题/描述/操作按钮)常驻 -->
  <PageShell :title="activeTab.label" :description="activeTab.description" :tags="subForm?.summaryTags ?? []">
    <!-- 左栏: 分组导航 -->
    <template #nav>
      <!-- 系统安全配置标题 -->
      <div class="config-nav__title">{{ $t('system.security.common.title') }}</div>
      <!-- 系统安全配置描述 -->
      <div class="config-nav__desc">{{ $t('system.security.common.description') }}</div>

      <div class="config-tab-list">
        <div class="config-tab-group">
          <!-- 访问安全组标题 -->
          <div class="config-tab-group__title">{{ $t('system.security.common.group.access') }}</div>
          <button
            v-for="tab in tabGroup"
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
      </div>
    </template>

    <!-- 右上操作区: 编辑/取消/确认按钮常驻 -->
    <template v-if="subForm" #actions>
      <!-- 非编辑状态: 显示编辑按钮 -->
      <template v-if="!subForm.isEditing">
        <a-button type="primary" @click="subForm.handleEdit()">{{ $t('common.edit') }}</a-button>
      </template>
      <!-- 编辑状态: 显示取消和确认按钮 -->
      <template v-else>
        <a-button @click="subForm.handleCancel()">{{ $t('system.security.common.cancel') }}</a-button>
        <a-button type="primary" :loading="subForm.saving" @click="subForm.handleSave()">
          {{ $t('system.security.common.confirm') }}
        </a-button>
      </template>
    </template>

    <PasswordPolicy v-if="activeKey === 'passwordPolicy'" ref="subForm" />
    <LoginSecurity v-else-if="activeKey === 'loginSecurity'" ref="subForm" />
    <SessionManagement v-else-if="activeKey === 'sessionManagement'" ref="subForm" />
    <TwoFactorAuth v-else-if="activeKey === 'twoFactorAuth'" ref="subForm" />
    <WebAuthnConfig v-else-if="activeKey === 'webauthn'" ref="subForm" />
    <IamReplayProtect v-else-if="activeKey === 'iamReplayProtect'" ref="subForm" />
  </PageShell>
</template>
