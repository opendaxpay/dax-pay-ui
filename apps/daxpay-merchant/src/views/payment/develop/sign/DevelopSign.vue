<script setup lang="ts">
  import type { FormInstance } from 'antdv-next';

  import { computed, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { DevelopSignApi } from '#/api/payment/develop/develop-sign.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'DevelopSign' });

  const { message } = useMessage();

  const activeKey = ref<'sign' | 'verify'>('sign');

  // ===== 签名生成 =====
  const signFormRef = ref<FormInstance>();
  const signForm = reactive({
    // 待签名参数 JSON
    param: '',
    // RSA 私钥
    privateKey: '',
  });
  const signLoading = ref(false);
  const signResult = reactive({
    // 待签名字符串
    signStr: '',
    // 签名值
    sign: '',
  });

  const signRules = computed<Record<string, any[]>>(() => ({
    param: [{ required: true, message: $t('payment.develop.sign.rule.signParam') }],
    privateKey: [{ required: true, message: $t('payment.develop.sign.rule.signPrivateKey') }],
  }));

  /** 生成签名(同时返回待签名字符串与签名值) */
  async function handleGenSign() {
    try {
      await signFormRef.value?.validate();
    } catch {
      // 校验未通过,字段错误已由表单自动展示
      return;
    }
    signLoading.value = true;
    try {
      const { data } = await DevelopSignApi.sign({
        json: signForm.param,
        privateKey: signForm.privateKey,
      });
      signResult.signStr = data?.signStr ?? '';
      signResult.sign = data?.sign ?? '';
      message.success($t('payment.develop.sign.msg.genSuccess'));
    } finally {
      signLoading.value = false;
    }
  }

  /** 重置签名表单 */
  function resetSignForm() {
    signFormRef.value?.resetFields();
    signResult.signStr = '';
    signResult.sign = '';
  }

  // ===== 签名验证 =====
  const verifyFormRef = ref<FormInstance>();
  const verifyForm = reactive({
    // 待验签 JSON(不含 sign 字段)
    param: '',
    // 签名值
    sign: '',
    // RSA 公钥
    publicKey: '',
  });
  const verifyLoading = ref(false);
  const verifyResult = ref<boolean | null>(null);

  const verifyRules = computed<Record<string, any[]>>(() => ({
    param: [{ required: true, message: $t('payment.develop.sign.rule.verifyParam') }],
    sign: [{ required: true, message: $t('payment.develop.sign.rule.verifySign') }],
    publicKey: [{ required: true, message: $t('payment.develop.sign.rule.verifyPublicKey') }],
  }));

  /** 验证签名 */
  async function handleVerifySign() {
    try {
      await verifyFormRef.value?.validate();
    } catch {
      // 校验未通过,字段错误已由表单自动展示
      return;
    }
    verifyLoading.value = true;
    try {
      const { data } = await DevelopSignApi.verify({
        json: verifyForm.param,
        sign: verifyForm.sign,
        publicKey: verifyForm.publicKey,
      });
      verifyResult.value = data === true;
      message.success(
        verifyResult.value ? $t('payment.develop.sign.msg.verifyPass') : $t('payment.develop.sign.msg.verifyNotPass'),
      );
    } finally {
      verifyLoading.value = false;
    }
  }

  /** 重置验签表单 */
  function resetVerifyForm() {
    verifyFormRef.value?.resetFields();
    verifyResult.value = null;
  }

  /** 复制到剪贴板 */
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      message.success($t('payment.develop.sign.msg.copySuccess'));
    } catch {
      message.error($t('payment.develop.sign.msg.copyFail'));
    }
  }
</script>

<template>
  <div class="develop-sign-debug p-4">
    <a-card variant="borderless" class="sign-card shadow-sm" :title="$t('payment.develop.sign.title')">
      <template #extra>
        <a-tag color="blue">RSA2</a-tag>
      </template>
      <a-tabs v-model:active-key="activeKey">
        <!-- 签名生成 -->
        <a-tab-pane key="sign">
          <template #tab>
            <span class="inline-flex items-center gap-1.5">
              <IconifyIcon icon="ant-design:edit-outlined" />
              {{ $t('payment.develop.sign.tabSign') }}
            </span>
          </template>

          <div class="py-4">
            <a-form ref="signFormRef" :model="signForm" :rules="signRules" layout="vertical">
              <a-row :gutter="24">
                <a-col :span="12">
                  <a-form-item :label="$t('payment.develop.sign.field.signParam')" name="param">
                    <a-textarea
                      v-model:value="signForm.param"
                      :rows="10"
                      :placeholder="$t('payment.develop.sign.placeholder.signParam')"
                      class="code-textarea"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item :label="$t('payment.develop.sign.field.signPrivateKey')" name="privateKey">
                    <a-textarea
                      v-model:value="signForm.privateKey"
                      :rows="10"
                      :placeholder="$t('payment.develop.sign.placeholder.signPrivateKey')"
                      class="code-textarea"
                    />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-form-item class="!mb-0">
                <a-space>
                  <a-button type="primary" :loading="signLoading" @click="handleGenSign">
                    <template #icon>
                      <IconifyIcon icon="ant-design:key-outlined" />
                    </template>
                    {{ $t('payment.develop.sign.btn.genSign') }}
                  </a-button>
                  <a-button @click="resetSignForm">
                    <template #icon>
                      <IconifyIcon icon="ant-design:reload-outlined" />
                    </template>
                    {{ $t('payment.develop.sign.btn.reset') }}
                  </a-button>
                </a-space>
              </a-form-item>
            </a-form>

            <!-- 签名结果 -->
            <div v-if="signResult.signStr || signResult.sign" class="result-container mt-6">
              <a-divider orientation="left">
                {{ $t('payment.develop.sign.result.divider') }}
              </a-divider>

              <div v-if="signResult.signStr" class="result-item mb-4 rounded bg-gray-50 p-4">
                <div class="mb-2 flex items-center justify-between">
                  <h4 class="m-0 text-sm font-medium">{{ $t('payment.develop.sign.field.signStr') }}</h4>
                  <a-button size="small" type="link" @click="copyToClipboard(signResult.signStr)">
                    <template #icon>
                      <IconifyIcon icon="ant-design:copy-outlined" />
                    </template>
                    {{ $t('payment.develop.sign.btn.copy') }}
                  </a-button>
                </div>
                <div class="code-box rounded border bg-white p-3">{{ signResult.signStr }}</div>
              </div>

              <div v-if="signResult.sign" class="result-item rounded bg-gray-50 p-4">
                <div class="mb-2 flex items-center justify-between">
                  <h4 class="m-0 text-sm font-medium">{{ $t('payment.develop.sign.field.signValue') }}</h4>
                  <a-button size="small" type="link" @click="copyToClipboard(signResult.sign)">
                    <template #icon>
                      <IconifyIcon icon="ant-design:copy-outlined" />
                    </template>
                    {{ $t('payment.develop.sign.btn.copy') }}
                  </a-button>
                </div>
                <div class="code-box break-all rounded border bg-white p-3">{{ signResult.sign }}</div>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 签名验证 -->
        <a-tab-pane key="verify">
          <template #tab>
            <span class="inline-flex items-center gap-1.5">
              <IconifyIcon icon="ant-design:safety-certificate-outlined" />
              {{ $t('payment.develop.sign.tabVerify') }}
            </span>
          </template>

          <div class="py-4">
            <a-row :gutter="24">
              <a-col :span="16">
                <a-form ref="verifyFormRef" :model="verifyForm" :rules="verifyRules" layout="vertical">
                  <a-form-item :label="$t('payment.develop.sign.field.verifyParam')" name="param">
                    <a-textarea
                      v-model:value="verifyForm.param"
                      :rows="5"
                      :placeholder="$t('payment.develop.sign.placeholder.verifyParam')"
                      class="code-textarea"
                    />
                  </a-form-item>
                  <a-form-item :label="$t('payment.develop.sign.field.verifySign')" name="sign">
                    <a-textarea
                      v-model:value="verifyForm.sign"
                      :rows="2"
                      :placeholder="$t('payment.develop.sign.placeholder.verifySign')"
                      class="code-textarea"
                    />
                  </a-form-item>
                  <a-form-item :label="$t('payment.develop.sign.field.verifyPublicKey')" name="publicKey">
                    <a-textarea
                      v-model:value="verifyForm.publicKey"
                      :rows="4"
                      :placeholder="$t('payment.develop.sign.placeholder.verifyPublicKey')"
                      class="code-textarea"
                    />
                  </a-form-item>
                  <a-form-item>
                    <a-space>
                      <a-button type="primary" :loading="verifyLoading" @click="handleVerifySign">
                        <template #icon>
                          <IconifyIcon icon="ant-design:check-circle-outlined" />
                        </template>
                        {{ $t('payment.develop.sign.btn.verify') }}
                      </a-button>
                      <a-button @click="resetVerifyForm">
                        <template #icon>
                          <IconifyIcon icon="ant-design:reload-outlined" />
                        </template>
                        {{ $t('payment.develop.sign.btn.reset') }}
                      </a-button>
                    </a-space>
                  </a-form-item>
                </a-form>
              </a-col>

              <!-- 验签结果区 -->
              <a-col :span="8">
                <div
                  class="verify-result-container flex h-full items-center justify-center border-l border-gray-100 pl-6"
                >
                  <div v-if="verifyResult !== null" class="w-full">
                    <a-result
                      :status="verifyResult ? 'success' : 'error'"
                      :title="
                        verifyResult
                          ? $t('payment.develop.sign.result.verifySuccess')
                          : $t('payment.develop.sign.result.verifyFail')
                      "
                    >
                      <template #subTitle>
                        {{
                          verifyResult
                            ? $t('payment.develop.sign.result.verifySuccessSub')
                            : $t('payment.develop.sign.result.verifyFailSub')
                        }}
                      </template>
                    </a-result>
                  </div>
                  <div v-else class="text-center text-gray-400">
                    <IconifyIcon icon="ant-design:safety-certificate-outlined" style="font-size: 64px; opacity: 0.2" />
                    <p class="mt-4">{{ $t('payment.develop.sign.result.verifyEmpty') }}</p>
                  </div>
                </div>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<style scoped lang="less">
  .develop-sign-debug {
    min-height: calc(100vh - 80px);
    background-color: #f0f2f5;

    .code-textarea {
      width: 100%;
      padding: 8px 11px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 13px;
      line-height: 1.6;
      background-color: #fafafa;
      border-radius: 4px;
      transition: all 0.3s;

      &:focus {
        background-color: #fff;
      }
    }

    .code-box {
      max-height: 200px;
      overflow-y: auto;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .result-container {
      background: #fff;
      border-radius: 8px;
    }

    :deep(.ant-tabs-nav) {
      margin-bottom: 0;
    }

    :deep(.ant-form-item-label) > label {
      font-weight: 500;
    }

    .sign-card {
      :deep(.ant-card-body) {
        padding-top: 8px;
      }

      :deep(.ant-card-head-title) {
        font-size: 18px;
        font-weight: 600;
      }
    }
  }
</style>
