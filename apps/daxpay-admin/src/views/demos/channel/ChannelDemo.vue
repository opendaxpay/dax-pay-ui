<script lang="ts" setup>
  import type { ChannelDemoPayResult } from '#/api/demo/channel-demo.api';

  import { computed, ref } from 'vue';

  import { Page } from '@vben/common-ui';
  import { $t } from '@vben/locales';

  import { ChannelDemoApi } from '#/api/demo/channel-demo.api';
  import { useMessage } from '#/hooks/useMessage';

  const { message } = useMessage();

  // 表单数据
  const bizOrderNo = ref<string>('');
  const amount = ref<number>(0.01);
  const subject = ref<string>('Demo 测试订单');
  const method = ref<string>('alipay_qr');

  // 响应结果
  const result = ref<null | ChannelDemoPayResult>(null);
  // 加载状态
  const loading = ref(false);

  // 支付方式选项
  const methodOptions = computed(() => [
    { value: 'alipay_qr', label: $t('demos.channel.methodOptions.alipay_qr') },
    { value: 'alipay_wap', label: $t('demos.channel.methodOptions.alipay_wap') },
    { value: 'alipay_page', label: $t('demos.channel.methodOptions.alipay_page') },
    { value: 'alipay_app', label: $t('demos.channel.methodOptions.alipay_app') },
  ]);

  // traceId 是否一致
  const traceMatched = computed(() => {
    if (!result.value) return false;
    return (
      result.value.mainAppTraceId &&
      result.value.mainAppTraceId === result.value.subAppTraceId
    );
  });

  /**
   * 发起支付请求
   */
  async function handlePay() {
    if (!subject.value) {
      // 国际化：请输入支付标题
      message.warning($t('demos.channel.messages.subjectRequired'));
      return;
    }

    loading.value = true;
    try {
      // 留空则自动生成订单号
      const orderNo =
        bizOrderNo.value || `DEMO${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const { data } = await ChannelDemoApi.pay({
        bizOrderNo: orderNo,
        amount: amount.value,
        subject: subject.value,
        method: method.value,
      });
      result.value = data;
      // 国际化：请求成功
      message.success($t('demos.channel.messages.success'));
    } catch {
      // 国际化：请求失败
      message.error($t('demos.channel.messages.failed'));
    } finally {
      loading.value = false;
    }
  }
</script>

<template>
  <Page :description="$t('demos.channel.description')" :title="$t('demos.channel.title')">
    <!-- 请求表单 -->
    <a-card class="mb-4" :title="$t('demos.channel.title')">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <!-- 商户订单号 -->
          <a-col :span="12">
            <a-form-item :label="$t('demos.channel.form.bizOrderNo')">
              <a-input
                v-model:value="bizOrderNo"
                allow-clear
                :placeholder="$t('demos.channel.form.bizOrderNoPlaceholder')"
              />
            </a-form-item>
          </a-col>

          <!-- 支付金额 -->
          <a-col :span="12">
            <a-form-item :label="$t('demos.channel.form.amount')">
              <a-input-number
                v-model:value="amount"
                :min="0.01"
                :precision="2"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>

          <!-- 支付标题 -->
          <a-col :span="12">
            <a-form-item :label="$t('demos.channel.form.subject')">
              <a-input
                v-model:value="subject"
                allow-clear
                :placeholder="$t('demos.channel.form.subjectPlaceholder')"
              />
            </a-form-item>
          </a-col>

          <!-- 支付方式 -->
          <a-col :span="12">
            <a-form-item :label="$t('demos.channel.form.method')">
              <a-select v-model:value="method" :options="methodOptions" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-button :loading="loading" type="primary" @click="handlePay">
          {{ $t('demos.channel.form.submit') }}
        </a-button>
      </a-form>
    </a-card>

    <!-- 响应结果 -->
    <a-card>
      <template #title>
        <div class="flex items-center gap-2">
          <span>{{ $t('demos.channel.result.title') }}</span>
          <!-- traceId 匹配状态 -->
          <a-tag v-if="result" :color="traceMatched ? 'success' : 'error'">
            {{ traceMatched
              ? $t('demos.channel.result.traceMatch')
              : $t('demos.channel.result.traceMismatch') }}
          </a-tag>
        </div>
      </template>

      <!-- 空状态 -->
      <a-empty v-if="!result" :description="$t('demos.channel.result.empty')" />

      <!-- 结果描述列表 -->
      <a-descriptions v-else bordered :column="1" size="small">
        <a-descriptions-item :label="$t('demos.channel.result.bizOrderNo')">
          {{ result.bizOrderNo }}
        </a-descriptions-item>
        <a-descriptions-item :label="$t('demos.channel.result.outOrderNo')">
          {{ result.outOrderNo }}
        </a-descriptions-item>
        <a-descriptions-item :label="$t('demos.channel.result.payBodyType')">
          <a-tag color="blue">{{ result.payBodyType }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item :label="$t('demos.channel.result.payBody')">
          <a-typography-text :copyable="{ tooltip: true }" class="text-sm" style="max-width: 600px">
            {{ result.payBody }}
          </a-typography-text>
        </a-descriptions-item>
        <a-descriptions-item :label="$t('demos.channel.result.mainAppTraceId')">
          <a-typography-text code copyable>
            {{ result.mainAppTraceId || '-' }}
          </a-typography-text>
        </a-descriptions-item>
        <a-descriptions-item :label="$t('demos.channel.result.subAppTraceId')">
          <a-typography-text code copyable>
            {{ result.subAppTraceId || '-' }}
          </a-typography-text>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </Page>
</template>
