<script lang="ts" setup>
  import type { VirtualDeviceResult } from '#/api/payment/device/virtual.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import QRCode from 'qrcode';

  import { VirtualDeviceApi } from '#/api/payment/device/virtual.api';
  import { QrCode } from '#/components/qrcode';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * 激活二维码弹窗(简版激活协议: 扫码获取后端接口地址, 无激活码体系)
   *
   * 内容由后端 qr-content 端点生成(daxpay:activate:{serverBaseUrl}:{sn}), 前端只渲染:
   * APP 扫码即完成服务器配置+设备绑定, 无需手填地址; 设备号单因子准入, 已激活设备
   * 重新扫码激活会轮换密钥并踢下线旧设备。
   */
  defineOptions({ name: 'ActivationQrModal' });

  const { message } = useMessage();

  const visible = ref(false);
  const loading = ref(false);
  // 二维码内容字符串(daxpay:activate:{baseUrl}:{sn})
  const content = ref('');
  const device = ref<VirtualDeviceResult>({});

  const deviceNo = computed(() => device.value.deviceNo || '');

  /**
   * 打开弹窗(行操作传入台账行, 拉取二维码内容)
   */
  function show(row: VirtualDeviceResult) {
    if (!row.deviceNo) {
      message.warning($t('payment.device.virtual.qr.emptyDeviceNo'));
      return;
    }
    device.value = { ...row };
    content.value = '';
    visible.value = true;
    loadContent(row.deviceNo);
  }

  /**
   * 拉取二维码内容字符串
   */
  async function loadContent(deviceNo: string) {
    loading.value = true;
    try {
      const { data } = await VirtualDeviceApi.qrContent(deviceNo);
      content.value = data || '';
    } finally {
      loading.value = false;
    }
  }

  /**
   * 复制文本到剪贴板
   */
  async function copyText(value: string) {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      message.success($t('payment.device.virtual.qr.copied'));
    } catch {
      message.error($t('payment.device.virtual.qr.copyFailed'));
    }
  }

  /**
   * 下载二维码 PNG(512px, 留白边, 便于贴设备/打印)
   */
  async function downloadQr() {
    if (!content.value) {
      return;
    }
    try {
      const dataUrl = await QRCode.toDataURL(content.value, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `device-${deviceNo.value.replaceAll(/[^\w.-]/g, '_')}.png`;
      link.click();
    } catch {
      message.error($t('payment.device.virtual.qr.downloadFailed'));
    }
  }

  defineExpose({ show });
</script>

<template>
  <a-modal v-model:open="visible" :footer="null" :title="$t('payment.device.virtual.qr.title')" :width="520">
    <a-spin :spinning="loading">
      <div class="flex flex-col gap-4">
        <!-- 设备摘要: 编号/名称/商户/激活与启用状态 -->
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>
            {{ $t('payment.device.virtual.qr.deviceNoLabel') }}:
            <span class="font-mono">{{ deviceNo || '-' }}</span>
          </span>
          <span> {{ $t('payment.device.virtual.qr.nameLabel') }}: {{ device.name || '-' }} </span>
          <span> {{ $t('payment.device.virtual.qr.merchant') }}: {{ device.mchName || '-' }} </span>
          <a-tag :color="device.activated ? 'green' : 'default'">
            {{ device.activated ? $t('payment.device.virtual.activated') : $t('payment.device.virtual.notActivated') }}
          </a-tag>
          <a-tag v-if="device.enable === false" color="red">
            {{ $t('payment.device.virtual.disabledTag') }}
          </a-tag>
        </div>

        <!-- 状态提示: 已激活/停用/未绑定商户分别给出操作风险 -->
        <a-alert
          v-if="device.activated"
          type="warning"
          show-icon
          :message="$t('payment.device.virtual.qr.activatedWarning')"
        />
        <a-alert
          v-else-if="device.enable === false"
          type="error"
          show-icon
          :message="$t('payment.device.virtual.qr.disabledWarning')"
        />
        <a-alert
          v-else-if="!device.mchNo"
          type="info"
          show-icon
          :message="$t('payment.device.virtual.qr.unboundWarning')"
        />

        <!-- 二维码 + 说明文案 -->
        <div class="flex flex-col items-center gap-3">
          <div v-if="content" class="qr-card">
            <QrCode :value="content" :width="220" />
          </div>
          <!-- 码内容原文(等宽小字, 供人工核对与手填兜底) -->
          <div v-if="content" class="qr-content font-mono">{{ content }}</div>
          <span class="text-center text-xs text-muted-foreground">
            {{ $t('payment.device.virtual.qr.scanTip') }}
          </span>
          <div class="flex gap-2">
            <a-button :disabled="!deviceNo" @click="copyText(deviceNo)">
              {{ $t('payment.device.virtual.qr.copyNo') }}
            </a-button>
            <a-button :disabled="!content" @click="copyText(content)">
              {{ $t('payment.device.virtual.qr.copyContent') }}
            </a-button>
            <a-button :disabled="!content" @click="downloadQr">
              {{ $t('payment.device.virtual.qr.downloadPng') }}
            </a-button>
          </div>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<style scoped>
  .qr-card {
    padding: 12px;
    background: #fff;
    border: 1px solid var(--border-color, #e8e8e8);
    border-radius: 8px;
  }

  .qr-content {
    max-width: 100%;
    padding: 0 8px;
    color: var(--text-color-secondary);
    font-size: 12px;
    line-height: 1.5;
    text-align: center;
    word-break: break-all;
  }
</style>
