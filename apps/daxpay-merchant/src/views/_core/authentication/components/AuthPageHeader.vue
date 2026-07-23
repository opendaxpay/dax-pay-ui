<script lang="ts" setup>
  defineOptions({ name: 'AuthPageHeader' });

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
  <div class="mb-6 text-center">
    <h2 v-if="title" class="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
      {{ title }}
    </h2>
    <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400">
      {{ subtitle }}
    </p>
  </div>
</template>
