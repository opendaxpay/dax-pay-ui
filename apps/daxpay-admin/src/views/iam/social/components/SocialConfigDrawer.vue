<script lang="ts" setup>
  import { computed, reactive, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { SocialConfigApi } from '#/api/iam/social.api';
  import type { SocialConfigParam, SocialConfigResult } from '#/api/iam/social.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'SocialConfigDrawer' });

  const props = defineProps<{
    visible: boolean;
    configItem: SocialConfigResult | null;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', visible: boolean): void;
    (e: 'saved'): void;
  }>();

  const { message } = useMessage();
  const { diffForm } = useFormEdit();

  const modalTitle = ref('');
  const submitLoading = ref(false);
  // 是否为首次配置(未配置 → 已配置), 用于区分提交成功提示
  const isFirstConfig = ref(false);
  const formRef = ref();
  // 当前操作的平台(新增/编辑时锁定, 决定是否显示 agentId 字段)
  const currentSource = ref<string>('');
  const formData = reactive<SocialConfigParam>({
    id: undefined,
    source: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    extra: {},
    enabled: true,
  });

  // clientSecret 始终必填, 编辑时预填脱敏值, diffForm 判断是否修改
  const formRules = computed(() => ({
    enabled: [{ required: true, message: $t('iam.social.form.enabledRequired') }],
    clientId: [{ required: true, message: $t('iam.social.form.clientId') }],
    clientSecret: [{ required: true, message: $t('iam.social.form.clientSecretRequired') }],
    redirectUri: [{ required: true, message: $t('iam.social.form.redirectUri') }],
  }));

  // 原始脱敏数据(来自后端), 用于 diffForm 比对敏感字段是否被修改
  const originalForm = ref<SocialConfigResult>({});

  /**
   * 是否显示企业微信 agentId 字段
   */
  const showAgentId = computed(() => currentSource.value === 'weCom');

  /**
   * agentId 取值(从 formData.extra 读)
   */
  const agentIdValue = computed({
    get: () => formData.extra?.agentId ?? '',
    set: (val: string) => {
      formData.extra = { ...formData.extra, agentId: val };
    },
  });

  /**
   * 抽屉打开时根据 configItem 初始化表单
   */
  watch(
    () => props.visible,
    async (visible) => {
      if (!visible || !props.configItem) return;
      const item = props.configItem;
      if (item.configured || item.id) {
        // 编辑模式(已配置平台)
        currentSource.value = item.source || '';
        modalTitle.value = $t('iam.social.action.edit');
        isFirstConfig.value = false;
        // 保存原始脱敏数据用于 diffForm 比对, clientSecret 保留脱敏值回显到输入框
        // (脱敏值非真实密钥, 即使用户误提交也会因 diffForm 相等而被忽略)
        // diffForm 仅比对 clientSecret, originalForm 无需深拷贝 extra
        originalForm.value = { ...item };
        Object.assign(formData, {
          ...item,
          extra: { ...item.extra },
        });
      } else {
        // 配置模式(未配置平台), 先调 findBySource 初始化占位记录
        const record = (await SocialConfigApi.findBySource(item.source!)).data;
        currentSource.value = record.source || '';
        modalTitle.value = $t('iam.social.action.config');
        isFirstConfig.value = true;
        Object.assign(formData, {
          ...record,
          clientId: '',
          clientSecret: '',
          redirectUri: '',
          extra: {},
          enabled: true,
        });
        // 首次配置无原值, originalForm 置空以便 diffForm 正确识别用户输入的新值
        originalForm.value = {};
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
      // 敏感字段(clientSecret)用 diffForm 比对:
      // 未修改返回 undefined(JSON 序列化时字段被忽略, 后端 NOT_NULL 策略下不参与 UPDATE),
      // 修改则返回新值
      const sensitiveData = diffForm(originalForm.value, formData, 'clientSecret');
      const submitData: SocialConfigParam = {
        ...formData,
        ...sensitiveData,
      };
      await SocialConfigApi.update(submitData);
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
        <a-form-item :label="$t('iam.social.form.clientId')" name="clientId">
          <a-input v-model:value="formData.clientId" :placeholder="$t('iam.social.form.clientIdPlaceholder')" :disabled="submitLoading" />
        </a-form-item>
        <a-form-item :label="$t('iam.social.form.clientSecret')" name="clientSecret">
          <a-input
            v-model:value="formData.clientSecret"
            :placeholder="$t('iam.social.form.clientSecretPlaceholder')"
            :disabled="submitLoading"
          />
        </a-form-item>
        <a-form-item :label="$t('iam.social.form.redirectUri')" name="redirectUri">
          <a-input v-model:value="formData.redirectUri" :placeholder="$t('iam.social.form.redirectUriPlaceholder')" :disabled="submitLoading" />
        </a-form-item>
        <!-- 企业微信特有: agentId 存入 extra -->
        <a-form-item v-if="showAgentId" :label="$t('iam.social.form.agentId')">
          <a-input v-model:value="agentIdValue" :placeholder="$t('iam.social.form.agentIdPlaceholder')" :disabled="submitLoading" />
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button :disabled="submitLoading" @click="emit('update:visible', false)">{{ $t('common.cancel') }}</a-button>
        <a-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ $t('common.save') }}</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
