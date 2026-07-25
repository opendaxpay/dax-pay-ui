<script lang="ts" setup>
  import { App } from 'antdv-next';

  import { setAntdAppContext } from '../hooks/useMessage';
  import DeleteConfirmModal from './delete-confirm/DeleteConfirmModal.vue';

  setAntdAppContext(App.useApp());
</script>

<template>
  <slot />
  <DeleteConfirmModal />
</template>
