<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

  import QRCode from 'qrcode';

  defineOptions({ name: 'QrCode' });

  const props = withDefaults(defineProps<Props>(), {
    width: 200,
    margin: 2,
  });

  interface Props {
    /** 二维码内容 */
    value: string;
    /** 二维码尺寸(px) */
    width?: number;
    /** 外边距(模块数) */
    margin?: number;
  }

  const canvasRef = ref<HTMLCanvasElement>();

  /** 渲染二维码到 canvas */
  async function render() {
    if (!canvasRef.value || !props.value) return;
    await QRCode.toCanvas(canvasRef.value, props.value, {
      width: props.width,
      margin: props.margin,
      errorCorrectionLevel: 'M',
    });
  }

  watch(
    () => [props.value, props.width, props.margin],
    () => render(),
    { immediate: false },
  );

  onMounted(render);

  onBeforeUnmount(() => {
    const canvas = canvasRef.value;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
</script>

<template>
  <canvas ref="canvasRef" class="qr-canvas block" />
</template>

<style scoped>
  .qr-canvas {
    border-radius: 4px;
  }
</style>
