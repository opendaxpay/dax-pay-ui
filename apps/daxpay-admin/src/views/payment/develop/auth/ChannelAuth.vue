<script setup lang="ts">
  import type { AuthResult, AuthUrlResult } from '#/api/payment/develop/developAuth.api';

  import { onBeforeUnmount, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useIntervalFn } from '@vueuse/core';

  import { DevelopAuthApi } from '#/api/payment/develop/developAuth.api';
  import { QrCode } from '#/components/qrcode';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'ChannelAuth' });

  /** 认证状态 */
  const AuthStatus = {
    WAITING: 'waiting',
    SUCCESS: 'success',
    NOT_EXIST: 'not_exist',
  } as const;

  const { message } = useMessage();

  const loading = ref(false);
  const authUrl = ref<AuthUrlResult>({});
  const authResult = ref<AuthResult>({});

  // 轮询查询认证结果
  const { pause, resume } = useIntervalFn(
    async () => {
      const queryCode = authUrl.value.queryCode;
      if (!queryCode) {
        pause();
        return;
      }
      try {
        const { data } = await DevelopAuthApi.queryAuthResult(queryCode);
        authResult.value = data ?? {};
        if (data?.status === AuthStatus.SUCCESS) {
          message.success($t('payment.develop.auth.msg.success'));
          pause();
        } else if (data?.status === AuthStatus.NOT_EXIST) {
          message.error($t('payment.develop.auth.msg.notExist'));
          pause();
        }
      } catch {
        pause();
      }
    },
    3000,
    { immediate: false },
  );

  onBeforeUnmount(() => {
    pause();
  });

  /** 生成授权链接并开始轮询 */
  async function handleGenerate() {
    pause();
    authResult.value = {};
    authUrl.value = {};
    loading.value = true;
    try {
      const { data } = await DevelopAuthApi.generateAuthUrl();
      authUrl.value = data ?? {};
      if (data?.queryCode) {
        resume();
      }
    } finally {
      loading.value = false;
    }
  }

  /** 复制文本 */
  async function copy(value?: string) {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      message.success($t('payment.develop.auth.msg.copySuccess'));
    } catch {
      message.error($t('payment.develop.auth.msg.copyFail'));
    }
  }

  /** 是否已有结果字段可展示 */
  function hasResult(result: AuthResult) {
    return !!(result.openId || result.userId || result.accessToken);
  }
</script>

<template>
  <div class="channel-auth-debug p-4">
    <a-card variant="borderless" class="shadow-sm" :title="$t('payment.develop.auth.title')">
      <template #extra>
        <a-tag color="blue">OAuth2.0</a-tag>
        <a-tag color="processing">{{ $t('payment.develop.auth.tag.alipay') }}</a-tag>
      </template>

      <a-row :gutter="32">
        <!-- 左侧：操作区 -->
        <a-col :xs="24" :lg="10">
          <a-alert
            :message="$t('payment.develop.auth.guide.title')"
            :description="$t('payment.develop.auth.guide.desc')"
            type="info"
            show-icon
            class="mb-6"
          />

          <a-button type="primary" block size="large" :loading="loading" @click="handleGenerate">
            <template #icon>
              <IconifyIcon icon="lucide:link" />
            </template>
            {{ $t('payment.develop.auth.btn.generate') }}
          </a-button>

          <div v-if="authUrl.authUrl" class="mt-4 rounded border border-dashed p-3 text-xs break-all text-gray-500">
            {{ authUrl.authUrl }}
          </div>
        </a-col>

        <!-- 右侧：二维码与结果 -->
        <a-col :xs="24" :lg="14">
          <div
            class="display-section flex h-full flex-col items-center justify-start rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6"
          >
            <div v-if="authUrl.authUrl" class="text-center">
              <div class="inline-block rounded-lg bg-white p-4 shadow-md">
                <QrCode :value="authUrl.authUrl" :width="230" :margin="0" />
              </div>
              <p class="mt-4 flex items-center justify-center text-gray-500">
                <IconifyIcon icon="lucide:scan-line" class="mr-2" />
                {{ $t('payment.develop.auth.qr.tip') }}
              </p>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-20 text-gray-400">
              <IconifyIcon icon="lucide:qr-code" class="opacity-20" :style="{ fontSize: '80px' }" />
              <p class="mt-4">{{ $t('payment.develop.auth.qr.empty') }}</p>
            </div>

            <div v-if="hasResult(authResult)" class="mt-8 w-full">
              <a-divider orientation="left">{{ $t('payment.develop.auth.result.divider') }}</a-divider>

              <div class="space-y-4">
                <div v-if="authResult.openId" class="result-card rounded border bg-white p-4 shadow-sm">
                  <div class="mb-1 flex items-center justify-between">
                    <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">
                      {{ $t('payment.develop.auth.result.openId') }}
                    </span>
                    <a-button type="link" size="small" @click="copy(authResult.openId)">
                      {{ $t('payment.develop.auth.btn.copy') }}
                    </a-button>
                  </div>
                  <div class="font-mono text-sm break-all text-blue-600">{{ authResult.openId }}</div>
                </div>

                <div v-if="authResult.userId" class="result-card rounded border bg-white p-4 shadow-sm">
                  <div class="mb-1 flex items-center justify-between">
                    <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">
                      {{ $t('payment.develop.auth.result.userId') }}
                    </span>
                    <a-button type="link" size="small" @click="copy(authResult.userId)">
                      {{ $t('payment.develop.auth.btn.copy') }}
                    </a-button>
                  </div>
                  <div class="font-mono text-sm break-all text-blue-600">{{ authResult.userId }}</div>
                </div>

                <div v-if="authResult.accessToken" class="result-card rounded border bg-white p-4 shadow-sm">
                  <div class="mb-1 flex items-center justify-between">
                    <span class="text-xs font-bold tracking-wider text-gray-400 uppercase">
                      {{ $t('payment.develop.auth.result.accessToken') }}
                    </span>
                    <a-button type="link" size="small" @click="copy(authResult.accessToken)">
                      {{ $t('payment.develop.auth.btn.copy') }}
                    </a-button>
                  </div>
                  <div class="font-mono text-sm break-all text-blue-600">{{ authResult.accessToken }}</div>
                </div>
              </div>
            </div>
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<style scoped>
  .channel-auth-debug {
    min-height: calc(100vh - 80px);
    background-color: #f0f2f5;
  }

  .display-section {
    min-height: 500px;
  }

  .font-mono {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  }

  .result-card {
    transition: border-color 0.2s;
  }

  .result-card:hover {
    border-color: #1677ff;
  }
</style>
