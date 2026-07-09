<script lang="ts" setup>
  import type { WechatConfigParam, WechatConfigResult } from '#/api/system/notify/wechat.api';

  import { onMounted, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { WechatConfigApi, WechatMessageApi } from '#/api/system/notify/wechat.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'WechatNotifyConfig' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  const submitLoading = ref(false);

  const formData = reactive<WechatConfigParam>({
    tradeTemplateId: '',
    operateTemplateId: '',
  });

  /**
   * 加载配置
   */
  function loadConfig() {
    loading.value = true;
    WechatConfigApi.find()
      .then((res) => {
        const data: WechatConfigResult = res.data || {};
        Object.assign(formData, {
          tradeTemplateId: data.tradeTemplateId ?? '',
          operateTemplateId: data.operateTemplateId ?? '',
        });
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /**
   * 提交保存
   */
  async function handleSubmit() {
    submitLoading.value = true;
    try {
      await WechatConfigApi.update({ ...formData });
      message.success($t('common.saveSuccess'));
      loadConfig();
    } finally {
      submitLoading.value = false;
    }
  }

  /**
   * 测试发送(给当前登录用户发一条, 验证三方平台凭据+绑定+模板链路)
   */
  function handleTestSend() {
    confirm({
      title: $t('system.notify.testSend'),
      content: $t('system.notify.confirmTestSend'),
      onOk: () => {
        WechatMessageApi.testSend().then((res) => {
          const result = res.data;
          if (result?.success) {
            message.success($t('system.notify.testSendSuccess'));
          } else {
            message.error($t('system.notify.testSendFail', { msg: result?.errorMsg || '' }));
          }
        });
      },
    });
  }

  onMounted(() => {
    loadConfig();
  });
</script>

<template>
  <div>
    <div class="mb-4 flex items-start justify-between gap-3">
      <a-alert class="flex-1" :message="$t('system.notify.wechatConfigDesc')" type="info" banner />
      <a-button
        v-if="hasPermission(PermCodes.System.WechatNotify.TEST)"
        :loading="submitLoading"
        @click="handleTestSend"
      >
        {{ $t('system.notify.testSend') }}
      </a-button>
    </div>

    <a-spin :spinning="loading">
      <a-form :model="formData" layout="vertical" class="max-w-2xl">
        <a-form-item :label="$t('system.notify.tradeTemplateId')" name="tradeTemplateId">
          <a-input
            v-model:value="formData.tradeTemplateId"
            :placeholder="$t('common.pleaseInput')"
            :disabled="submitLoading"
          />
        </a-form-item>
        <a-form-item :label="$t('system.notify.operateTemplateId')" name="operateTemplateId">
          <a-input
            v-model:value="formData.operateTemplateId"
            :placeholder="$t('common.pleaseInput')"
            :disabled="submitLoading"
          />
        </a-form-item>
      </a-form>
    </a-spin>

    <div class="mt-4">
      <a-space>
        <a-button :disabled="submitLoading" @click="loadConfig">{{ $t('common.reset') }}</a-button>
        <a-button
          v-if="hasPermission(PermCodes.System.WechatNotify.MANAGE)"
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          {{ $t('common.save') }}
        </a-button>
      </a-space>
    </div>
  </div>
</template>
