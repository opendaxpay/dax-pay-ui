<script lang="ts" setup>
  import { AgreementContentView } from './components';

  defineOptions({ name: 'AgreementTerms' });
</script>

<template>
  <!-- 国际化：用户协议 -->
  <AgreementContentView type="USER_AGREEMENT" />
</template>
