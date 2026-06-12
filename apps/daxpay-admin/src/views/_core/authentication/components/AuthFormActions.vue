<script lang="ts" setup>
  import { useRouter } from 'vue-router';

  defineOptions({ name: 'AuthFormActions' });

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    submitText: '提交',
    showBack: false,
    backText: '返回',
    backPath: '/auth/login',
  });

  const emit = defineEmits<{
    submit: [];
  }>();

  interface Props {
    loading?: boolean;
    submitText?: string;
    showBack?: boolean;
    backText?: string;
    backPath?: string;
  }

  const router = useRouter();

  function handleSubmit() {
    emit('submit');
  }

  function handleBack() {
    router.push(props.backPath);
  }
</script>

<template>
  <div class="mt-6 space-y-3">
    <a-button type="primary" html-type="submit" block :loading="loading" @click="handleSubmit">
      {{ submitText }}
    </a-button>
    <a-button v-if="showBack" block @click="handleBack">
      {{ backText }}
    </a-button>
  </div>
</template>
