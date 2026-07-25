<script lang="ts" setup>
  import { App } from 'antdv-next';

  import DeleteConfirmModal from './delete-confirm/DeleteConfirmModal.vue';
  import { setAntdAppContext } from '../hooks/useMessage';

  setAntdAppContext(App.useApp());
</script>

<template>
  <slot />
  <DeleteConfirmModal />
</template>
