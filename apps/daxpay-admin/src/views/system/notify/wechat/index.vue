<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import WechatNotifyConfig from './WechatNotifyConfig.vue';
  import WechatNotifyRecord from './WechatNotifyRecord.vue';

  defineOptions({ name: 'WechatNotify' });

  const activeKey = ref<string>('config');
</script>

<template>
  <div class="m-3">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <span class="text-lg font-bold text-foreground">
          {{ $t('system.notify.wechatConfigTitle') }}
        </span>
      </template>

      <a-tabs v-model:active-key="activeKey" type="card">
        <a-tab-pane key="config" :tab="$t('system.notify.wechatTabConfig')">
          <WechatNotifyConfig />
        </a-tab-pane>
        <a-tab-pane key="record" :tab="$t('system.notify.wechatTabRecord')">
          <WechatNotifyRecord v-if="activeKey === 'record'" />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>
