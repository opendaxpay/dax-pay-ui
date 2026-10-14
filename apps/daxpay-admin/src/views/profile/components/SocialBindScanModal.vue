<script lang="ts" setup>
  import { ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { useIntervalFn } from '@vueuse/core';

  import { SocialApi } from '#/api/iam/social.api';
  import { QrCode } from '#/components/qrcode';
  import { CLIENT_CODE } from '#/constants/client';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'SocialBindScanModal' });

  const props = defineProps<{
    /** 弹窗打开状态 */
    open: boolean;
    /** 平台显示名(弹窗标题) */
    platformName: string;
    /** 平台编码(公众号) */
    source: string;
  }>();

  const emit = defineEmits<{
    /** 绑定成功(父组件刷新绑定列表) */
    success: [];
    /** 关闭弹窗 */
    'update:open': [value: boolean];
  }>();

  const { message } = useMessage();

  /** 二维码生成中 */
  const generating = ref(false);
  /** 二维码内容(H5 发起页地址) */
  const qrUrl = ref('');
  /** 扫码绑定票据(轮询凭证) */
  const ticket = ref('');
  /** 票据已过期(等待用户刷新二维码) */
  const expired = ref(false);

  /** 轮询扫码绑定结果(对齐分账接收方扫码授权的轮询范式) */
  const { pause: pausePolling, resume: resumePolling } = useIntervalFn(
    async () => {
      if (!ticket.value) {
        pausePolling();
        return;
      }
      try {
        const { data } = await SocialApi.bindScanStatus(ticket.value);
        if (data?.status === 'success') {
          pausePolling();
          message.success($t('profile.socialBindSuccess'));
          emit('success');
          handleClose();
        } else if (data?.status === 'not_exist') {
          // 票据过期(5 分钟无人完成授权), 展示刷新入口
          pausePolling();
          expired.value = true;
        }
      } catch {
        // 网络抖动静默重试, 过期由 not_exist 状态兜底
      }
    },
    3000,
    { immediate: false },
  );

  /** 生成扫码绑定二维码(打开弹窗与刷新共用) */
  async function generate() {
    pausePolling();
    generating.value = true;
    expired.value = false;
    try {
      const { data } = await SocialApi.bindScanCreate(props.source, CLIENT_CODE);
      if (data?.qrUrl && data?.ticket) {
        qrUrl.value = data.qrUrl;
        ticket.value = data.ticket;
        resumePolling();
      }
    } catch {
      // 生成失败由全局拦截器提示, 直接关闭弹窗避免空白
      handleClose();
    } finally {
      generating.value = false;
    }
  }

  /** 关闭弹窗并停止轮询 */
  function handleClose() {
    pausePolling();
    qrUrl.value = '';
    ticket.value = '';
    expired.value = false;
    emit('update:open', false);
  }

  watch(
    () => props.open,
    (open) => {
      if (open && props.source) {
        generate();
      }
    },
  );
</script>

<template>
  <a-modal
    :open="open"
    :title="$t('profile.socialScanTitle', { name: platformName })"
    :footer="null"
    :mask-closable="false"
    centered
    width="440"
    @cancel="handleClose"
  >
    <div v-if="generating" class="flex w-full justify-center py-12">
      <a-spin :tip="$t('profile.socialScanGenerating')" />
    </div>
    <div v-else-if="qrUrl" class="flex flex-col items-center gap-2 py-2">
      <div class="qr-wrap">
        <QrCode :value="qrUrl" :width="220" :margin="0" />
        <!-- 过期遮罩: 重新生成二维码 -->
        <div v-if="expired" class="qr-mask">
          <div class="flex flex-col items-center gap-2">
            <span class="text-sm text-gray-500">{{ $t('profile.socialScanExpired') }}</span>
            <a-button type="primary" size="small" @click="generate">
              {{ $t('profile.socialScanRefresh') }}
            </a-button>
          </div>
        </div>
      </div>
      <p class="m-0 text-sm text-gray-500">{{ $t('profile.socialScanTip') }}</p>
    </div>
  </a-modal>
</template>

<style scoped>
  .qr-wrap {
    position: relative;
    line-height: 0;
  }

  .qr-mask {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(255 255 255 / 90%);
    border-radius: 4px;
  }
</style>
