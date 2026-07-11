<script lang="ts" setup>
import type { BreadcrumbStyleType } from '@vben/types';

import type { IBreadcrumb } from '@vben-core/shadcn-ui';

import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { $t } from '@vben/locales';

import { VbenBreadcrumbView } from '@vben-core/shadcn-ui';

interface Props {
  hideWhenOnlyOne?: boolean;
  showHome?: boolean;
  showIcon?: boolean;
  type?: BreadcrumbStyleType;
}

const props = withDefaults(defineProps<Props>(), {
  showHome: false,
  showIcon: false,
  type: 'normal',
});

const route = useRoute();
const router = useRouter();

const breadcrumbs = computed((): IBreadcrumb[] => {
  const matched = route.matched;

  const resultBreadcrumb: IBreadcrumb[] = [];

  // 优先使用叶子路由自定义面包屑链（子页面路由提升后补全完整层级）
  const leaf = matched[matched.length - 1];
  if (leaf?.meta?.customBreadcrumb?.length) {
    for (const item of leaf.meta.customBreadcrumb) {
      if (!item.path) {
        continue;
      }
      resultBreadcrumb.push({
        icon: item.icon as any,
        path: item.path || route.path,
        title: item.title ? $t(item.title) : '',
      });
    }
    if (props.showHome) {
      resultBreadcrumb.unshift({
        icon: 'mdi:home-outline',
        isHome: true,
        path: '/',
      });
    }
    if (props.hideWhenOnlyOne && resultBreadcrumb.length === 1) {
      return [];
    }
    return resultBreadcrumb;
  }

  for (const match of matched) {
    const { meta, path } = match;
    const { hideChildrenInMenu, hideInBreadcrumb, icon, name, title } =
      meta || {};
    if (hideInBreadcrumb || hideChildrenInMenu || !path) {
      continue;
    }

    resultBreadcrumb.push({
      icon,
      path: path || route.path,
      title: title ? $t((title || name) as string) : '',
    });
  }
  if (props.showHome) {
    resultBreadcrumb.unshift({
      icon: 'mdi:home-outline',
      isHome: true,
      path: '/',
    });
  }
  if (props.hideWhenOnlyOne && resultBreadcrumb.length === 1) {
    return [];
  }

  return resultBreadcrumb;
});

function handleSelect(path: string) {
  router.push(path);
}
</script>
<template>
  <VbenBreadcrumbView
    :breadcrumbs="breadcrumbs"
    :show-icon="showIcon"
    :style-type="type"
    class="ml-2"
    @select="handleSelect"
  />
</template>
