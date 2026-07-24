<script lang="ts" setup>
  import type { SocialLoginConfigParam, SocialLoginConfigResult } from '#/api/iam/social.api';

  import { computed, reactive, ref, watch } from 'vue';

  import { $t } from '@vben/locales';
  import { useClipboard } from '@vueuse/core';
  import { IconifyIcon } from '@vben-core/icons';

  import { SocialLoginConfigApi } from '#/api/iam/social.api';
  import { UrlConfigApi } from '#/api/system/url-config.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'SocialLoginConfigDrawer' });

  const props = defineProps<{
    configItem: null | SocialLoginConfigResult;
    visible: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', visible: boolean): void;
    (e: 'saved'): void;
    (e: 'jump', source: string): void;
  }>();

  const { message } = useMessage();
  const { diffForm } = useFormEdit();
  const { copy } = useClipboard();

  // 管理端/商户端访问地址(用于展示回调地址, 抽屉打开时从端点配置获取)
  const adminBaseUrl = ref('');
  const merchantBaseUrl = ref('');

  const modalTitle = ref('');
  const submitLoading = ref(false);
  // 是否为首次配置(未配置 → 已配置), 用于区分提交成功提示
  const isFirstConfig = ref(false);
  const formRef = ref();
  // 当前操作的平台(新增/编辑时锁定, 决定是否显示 agentId 字段)
  const currentSource = ref<string>('');
  // 是否平台级跳转型(凭据在独立页, 本抽屉仅启停)
  const isPlatformRedirect = ref(false);

  const formData = reactive<SocialLoginConfigParam>({
    id: undefined,
    source: '',
    clientId: '',
    clientSecret: '',
    extra: {},
    enabled: true,
  });

  // 跳转型仅校验 enabled; 标准型校验 clientId/clientSecret
  const formRules = computed(() => {
    if (isPlatformRedirect.value) {
      return {
        enabled: [{ required: true, message: $t('iam.social.form.enabledRequired') }],
      };
    }
    return {
      enabled: [{ required: true, message: $t('iam.social.form.enabledRequired') }],
      clientId: [{ required: true, message: $t('iam.social.form.clientId') }],
      clientSecret: [{ required: true, message: $t('iam.social.form.clientSecretRequired') }],
    };
  });

  // 原始脱敏数据(来自后端), 用于 diffForm 比对敏感字段是否被修改
  const originalForm = ref<SocialLoginConfigResult>({});

  /**
   * 是否显示企业微信 agentId 字段
   */
  const showAgentId = computed(() => currentSource.value === 'weCom');

  /**
   * 是否展示完整 OAuth 回调地址
   * 微信公众号仅配网页授权域名, 不展示; 支付宝开放平台与标准 OAuth 需完整 URL
   */
  const showCallbackUrls = computed(
    () => !(isPlatformRedirect.value && currentSource.value === 'weChat'),
  );

  /**
   * agentId 取值(从 formData.extra 读)
   */
  const agentIdValue = computed({
    get: () => formData.extra?.agentId ?? '',
    set: (val: string) => {
      formData.extra = { ...formData.extra, agentId: val };
    },
  });

  // 回调路径常量(与后端 SocialLoginService 路径约定一致)
  const LOGIN_CALLBACK_PATH = '/auth/oauth-callback';
  const BIND_CALLBACK_PATH = '/auth/social-bind-callback';

  /**
   * 打开抽屉时是否需要拉端点地址拼回调(与 showCallbackUrls 对齐)
   */
  function shouldLoadUrlConfig(item: SocialLoginConfigResult): boolean {
    return !item.platformRedirect || item.source === 'alipay';
  }

  /**
   * 拼完整回调 URL
   */
  function buildCallbackUrl(baseUrl: string, path: string): string {
    const base = (baseUrl || '').replace(/\/$/, '');
    const source = currentSource.value;
    return base && source ? `${base}${path}/${source}` : '';
  }

  /** 运营端登录/绑定回调 */
  const adminLoginCallbackUrl = computed(() => buildCallbackUrl(adminBaseUrl.value, LOGIN_CALLBACK_PATH));
  const adminBindCallbackUrl = computed(() => buildCallbackUrl(adminBaseUrl.value, BIND_CALLBACK_PATH));

  /** 商户端登录/绑定回调(商户社交同等能力必需) */
  const merchantLoginCallbackUrl = computed(() => buildCallbackUrl(merchantBaseUrl.value, LOGIN_CALLBACK_PATH));
  const merchantBindCallbackUrl = computed(() => buildCallbackUrl(merchantBaseUrl.value, BIND_CALLBACK_PATH));

  /**
   * 复制文本到剪贴板
   */
  async function handleCopy(text: string) {
    if (!text) return;
    await copy(text);
    message.success($t('iam.social.tip.copySuccess'));
  }

  /**
   * 跳转到平台级凭据配置页
   */
  function handleGotoCredential() {
    if (!currentSource.value) return;
    emit('jump', currentSource.value);
  }

  /**
   * 用 findBySource 结果填充标题与表单公共字段
   */
  function applyRecordBase(record: SocialLoginConfigResult) {
    currentSource.value = record.source || '';
    const sourceName = $t(`iam.social.platform.${currentSource.value}`);
    modalTitle.value = `${sourceName}${$t('iam.social.action.config')}`;
  }

  /**
   * 抽屉打开时根据 configItem 初始化表单
   */
  watch(
    () => props.visible,
    async (visible) => {
      if (!visible || !props.configItem) return;
      const item = props.configItem;
      isPlatformRedirect.value = !!item.platformRedirect;

      if (shouldLoadUrlConfig(item)) {
        UrlConfigApi.get().then((res) => {
          adminBaseUrl.value = res.data?.adminBaseUrl ?? '';
          merchantBaseUrl.value = res.data?.merchantBaseUrl ?? '';
        });
      } else {
        adminBaseUrl.value = '';
        merchantBaseUrl.value = '';
      }

      const record = (await SocialLoginConfigApi.findBySource(item.source!)).data;
      applyRecordBase(record);

      // 已有库行 / 跳转型占位: 回填记录; 标准平台首次配置: 清空凭据并默认启用
      const isExistingOrRedirect = !!(item.configured || item.id || item.platformRedirect);
      if (isExistingOrRedirect) {
        isFirstConfig.value = !record.configured;
        originalForm.value = { ...record };
        Object.assign(formData, {
          ...record,
          clientId: record.clientId ?? '',
          clientSecret: record.clientSecret ?? '',
          extra: { ...record.extra },
          // 跳转型未启用过时默认关; 标准型沿用库值, 缺省开
          enabled: item.platformRedirect ? !!record.enabled : (record.enabled ?? true),
        });
      } else {
        isFirstConfig.value = true;
        // 首次配置无原值, originalForm 置空以便 diffForm 正确识别用户输入的新值
        originalForm.value = {};
        Object.assign(formData, {
          ...record,
          clientId: '',
          clientSecret: '',
          extra: {},
          enabled: true,
        });
      }
    },
  );

  /**
   * 提交表单(新增/编辑)
   */
  async function handleSubmit() {
    submitLoading.value = true;
    try {
      await formRef.value?.validate();
      if (isPlatformRedirect.value) {
        // 跳转型统一走编辑接口: 非空占位过 NotBlank(真实凭据在平台配置页, 后端忽略这两字段)
        await SocialLoginConfigApi.update({
          source: formData.source,
          enabled: !!formData.enabled,
          clientId: '-',
          clientSecret: '-',
        });
      } else {
        // 敏感字段(clientSecret)用 diffForm 比对:
        // 未修改返回 undefined(JSON 序列化时字段被忽略, 后端 NOT_NULL 策略下不参与 UPDATE),
        // 修改则返回新值
        const sensitiveData = diffForm(originalForm.value, formData, 'clientSecret');
        const submitData: SocialLoginConfigParam = {
          ...formData,
          ...sensitiveData,
        };
        await SocialLoginConfigApi.update(submitData);
      }
      message.success($t(isFirstConfig.value ? 'iam.social.tip.configSuccess' : 'iam.social.tip.editSuccess'));
      emit('update:visible', false);
      emit('saved');
    } finally {
      submitLoading.value = false;
    }
  }
</script>

<template>
  <a-drawer :open="visible" :title="modalTitle" size="large" @update:open="(v: boolean) => emit('update:visible', v)">
    <a-spin :spinning="submitLoading">
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item :label="$t('iam.social.form.enabled')" name="enabled">
          <a-switch v-model:checked="formData.enabled" :disabled="submitLoading" />
        </a-form-item>

        <!-- 平台级跳转型: 凭据在独立页维护, 此处仅提供跳转入口 -->
        <template v-if="isPlatformRedirect">
          <a-alert
            type="info"
            show-icon
            class="!mb-4"
            :message="$t(`iam.social.tip.platformCredentialHint.${currentSource}`)"
          />
          <a-button type="default" block class="!mb-4" @click="handleGotoCredential">
            <IconifyIcon icon="ant-design:arrow-right-outlined" class="mr-1" />
            {{ $t('iam.social.action.gotoCredential') }}
          </a-button>
        </template>

        <!-- 标准 OAuth 平台: clientId / clientSecret -->
        <template v-else>
          <a-form-item :label="$t('iam.social.form.clientId')" name="clientId" :tooltip="$t('iam.social.form.clientIdHelp')">
            <a-input
              v-model:value="formData.clientId"
              :placeholder="$t('iam.social.form.clientIdPlaceholder')"
              :disabled="submitLoading"
            />
          </a-form-item>
          <a-form-item
            :label="$t('iam.social.form.clientSecret')"
            name="clientSecret"
            :tooltip="$t('iam.social.form.clientSecretHelp')"
          >
            <a-input
              v-model:value="formData.clientSecret"
              :placeholder="$t('iam.social.form.clientSecretPlaceholder')"
              :disabled="submitLoading"
            />
          </a-form-item>
          <!-- 企业微信特有: agentId 存入 extra -->
          <a-form-item v-if="showAgentId" :label="$t('iam.social.form.agentId')">
            <a-input
              v-model:value="agentIdValue"
              :placeholder="$t('iam.social.form.agentIdPlaceholder')"
              :disabled="submitLoading"
            />
          </a-form-item>
        </template>
      </a-form>

      <!-- 回调地址: 标准 OAuth + 支付宝(开放平台需完整 URL); 微信公众号仅配授权域名故隐藏 -->
      <div v-if="showCallbackUrls" class="mt-2 rounded-lg bg-muted/40 p-4">
        <div class="mb-3 flex items-center gap-1.5">
          <span class="text-sm font-semibold">{{ $t('iam.social.form.callbackUrl') }}</span>
          <a-tooltip :title="$t('iam.social.form.callbackUrlHelp')">
            <IconifyIcon icon="ant-design:question-circle-outlined" class="text-muted-foreground" />
          </a-tooltip>
        </div>

        <!-- 运营端 -->
        <div class="mb-4">
          <div class="mb-2 text-xs font-medium text-foreground">
            {{ $t('iam.social.clientCode.admin') }}
          </div>
          <a-alert
            v-if="!adminLoginCallbackUrl"
            type="warning"
            :message="$t('iam.social.form.callbackUrlEmptyAdmin')"
            banner
            class="!mb-0"
          />
          <template v-else>
            <div class="mb-3">
              <div class="mb-1 text-xs text-muted-foreground">{{ $t('iam.social.form.loginCallback') }}</div>
              <a-input :value="adminLoginCallbackUrl" readonly>
                <template #suffix>
                  <a-button type="link" size="small" @click="handleCopy(adminLoginCallbackUrl)">
                    <IconifyIcon icon="ant-design:copy-outlined" />
                    {{ $t('iam.social.action.copy') }}
                  </a-button>
                </template>
              </a-input>
            </div>
            <div>
              <div class="mb-1 text-xs text-muted-foreground">{{ $t('iam.social.form.bindCallback') }}</div>
              <a-input :value="adminBindCallbackUrl" readonly>
                <template #suffix>
                  <a-button type="link" size="small" @click="handleCopy(adminBindCallbackUrl)">
                    <IconifyIcon icon="ant-design:copy-outlined" />
                    {{ $t('iam.social.action.copy') }}
                  </a-button>
                </template>
              </a-input>
            </div>
          </template>
        </div>

        <!-- 商户端(同等社交能力) -->
        <div>
          <div class="mb-2 text-xs font-medium text-foreground">
            {{ $t('iam.social.clientCode.merchant') }}
          </div>
          <a-alert
            v-if="!merchantLoginCallbackUrl"
            type="warning"
            :message="$t('iam.social.form.callbackUrlEmptyMerchant')"
            banner
            class="!mb-0"
          />
          <template v-else>
            <div class="mb-3">
              <div class="mb-1 text-xs text-muted-foreground">{{ $t('iam.social.form.loginCallback') }}</div>
              <a-input :value="merchantLoginCallbackUrl" readonly>
                <template #suffix>
                  <a-button type="link" size="small" @click="handleCopy(merchantLoginCallbackUrl)">
                    <IconifyIcon icon="ant-design:copy-outlined" />
                    {{ $t('iam.social.action.copy') }}
                  </a-button>
                </template>
              </a-input>
            </div>
            <div>
              <div class="mb-1 text-xs text-muted-foreground">{{ $t('iam.social.form.bindCallback') }}</div>
              <a-input :value="merchantBindCallbackUrl" readonly>
                <template #suffix>
                  <a-button type="link" size="small" @click="handleCopy(merchantBindCallbackUrl)">
                    <IconifyIcon icon="ant-design:copy-outlined" />
                    {{ $t('iam.social.action.copy') }}
                  </a-button>
                </template>
              </a-input>
            </div>
          </template>
        </div>
      </div>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button :disabled="submitLoading" @click="emit('update:visible', false)">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ $t('common.save') }}</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
