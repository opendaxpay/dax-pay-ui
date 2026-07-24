<script lang="ts" setup>
  import { onMounted } from 'vue';
  import { useRouter } from 'vue-router';

  defineOptions({ name: 'WechatIsvAppManage' });

  const router = useRouter();

  // 旧页：重定向到微信应用 Hub（平台 Tab）
  onMounted(() => {
    router.replace({ path: '/payment/wx/app', query: { tab: 'platform' } });
  });
</script>

<template>
  <div />
</template>
