<script setup lang="ts">
  import PasswordChangeForm from './components/password-change-form.vue';

  defineOptions({ name: 'ProfilePasswordSetting' });
</script>

<template>
  <div class="max-w-lg">
    <!-- 个人设置场景改密成功后停留当前页 -->
    <PasswordChangeForm />
  </div>
</template>
