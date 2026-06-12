<script lang="ts" setup>
  defineOptions({ name: 'RouteQueryMissingState' });

  defineProps<{
    /** 空状态描述（已国际化） */
    description: string;
    /** 返回按钮文案（已国际化） */
    backText: string;
  }>();

  const emits = defineEmits<{
    back: [];
  }>();
</script>

<template>
  <div class="m-4 flex items-center justify-center" style="min-height: 400px">
    <a-empty :description="description">
      <a-button type="primary" @click="emits('back')">
        {{ backText }}
      </a-button>
    </a-empty>
  </div>
</template>
