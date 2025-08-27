<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <a-tabs v-model:activeKey="activeKey" tabPosition="left" style="min-height: 550px">
        <a-tab-pane key="1" tab="公共配置">
          <platform-basic-config />
        </a-tab-pane>
        <a-tab-pane key="2" tab="地址配置">
          <platform-url-config />
        </a-tab-pane>
        <a-tab-pane key="3" tab="站点配置">
          <platform-website-config />
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import PlatformUrlConfig from './PlatformUrlConfig.vue'
  import PlatformBasicConfig from './PlatformBasicConfig.vue'
  import PlatformWebsiteConfig from './PlatformWebsiteConfig.vue'

  const activeKey = ref('1')
</script>

<style scoped lang="less"></style>
