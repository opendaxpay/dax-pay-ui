<script lang="ts" setup>
  import AuthPageHeader from './AuthPageHeader.vue';

  defineOptions({ name: 'AuthPageCard' });

  withDefaults(defineProps<Props>(), {
    title: '',
    subtitle: '',
  });

  interface Props {
    title?: string;
    subtitle?: string;
  }
</script>

<template>
  <a-card class="w-full max-w-md overflow-hidden rounded-lg shadow-lg" variant="borderless">
    <AuthPageHeader :title="title" :subtitle="subtitle" />
    <slot />
  </a-card>
</template>
