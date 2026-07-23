<script lang="ts" setup>
  import { useRouter } from 'vue-router';

  defineOptions({ name: 'AuthPageFooterActions' });

  const props = withDefaults(defineProps<Props>(), {
    questionText: '',
    actionText: '',
    actionPath: '',
  });

  interface Props {
    questionText?: string;
    actionText?: string;
    actionPath?: string;
  }

  const router = useRouter();

  function handleAction() {
    if (props.actionPath) {
      router.push(props.actionPath);
    }
  }
</script>

<template>
  <div v-if="questionText && actionText" class="mt-4 text-center text-sm">
    <span class="text-gray-500 dark:text-gray-400">{{ questionText }}</span>
    <a class="ml-1 cursor-pointer text-blue-600 hover:text-blue-500 dark:text-blue-400" @click="handleAction">
      {{ actionText }}
    </a>
  </div>
</template>
