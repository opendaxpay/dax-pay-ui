<script lang="ts" setup>
  import { Splitter, SplitterPanel } from 'antdv-next';

  const props = withDefaults(
    defineProps<{
      defaultLeftPercent?: number;
      maxLeftPercent?: number;
      minLeftPercent?: number;
      orientation?: 'horizontal' | 'vertical';
    }>(),
    {
      defaultLeftPercent: 38,
      minLeftPercent: 22,
      maxLeftPercent: 55,
      orientation: 'horizontal',
    },
  );

  const leftDefaultSize = `${props.defaultLeftPercent}%`;
  const leftMinSize = `${props.minLeftPercent}%`;
  const leftMaxSize = `${props.maxLeftPercent}%`;
</script>

<template>
  <!-- 水平双栏分隔 -->
  <Splitter class="split-pane" :orientation="orientation">
    <SplitterPanel :default-size="leftDefaultSize" :max="leftMaxSize" :min="leftMinSize">
      <div class="split-pane__body">
        <slot name="left" />
      </div>
    </SplitterPanel>
    <SplitterPanel>
      <div class="split-pane__body">
        <slot name="right" />
      </div>
    </SplitterPanel>
  </Splitter>
</template>

<style scoped>
  .split-pane {
    height: 100%;
    min-height: 0;
  }

  .split-pane__body {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
  }
</style>
