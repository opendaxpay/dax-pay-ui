<script lang="ts" setup>
  import { onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  defineOptions({ name: 'WechatIsvMchAppManage' });

  const route = useRoute();
  const router = useRouter();

  // 旧页：重定向到微信应用 Hub（商户 Tab），尽量保留 mchNo
  onMounted(() => {
    const mchNo = typeof route.query.mchNo === 'string' ? route.query.mchNo : undefined;
    router.replace({
      path: '/payment/wx/app',
      query: {
        tab: 'merchant',
        ...(mchNo ? { mchNo } : {}),
      },
    });
  });
</script>

<template>
  <div />
</template>
