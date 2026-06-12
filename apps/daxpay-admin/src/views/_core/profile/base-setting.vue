<script setup lang="ts">
  import type { BasicOption } from '@vben/types';

  import type { VbenFormSchema } from '#/adapter/form';

  import { computed, onMounted, ref } from 'vue';

  import { ProfileBaseSetting } from '@vben/common-ui';

  import { UserCommonApi } from '#/api/core/user.api';

  const profileBaseSettingRef = ref();

  const MOCK_ROLES_OPTIONS: BasicOption[] = [
    {
      label: '管理员',
      value: 'super',
    },
    {
      label: '用户',
      value: 'user',
    },
    {
      label: '测试',
      value: 'test',
    },
  ];

  const formSchema = computed((): VbenFormSchema[] => {
    return [
      {
        fieldName: 'name',
        component: 'Input',
        label: '姓名',
      },
      {
        fieldName: 'account',
        component: 'Input',
        label: '账号',
      },
      {
        fieldName: 'roles',
        component: 'Select',
        componentProps: {
          mode: 'tags',
          options: MOCK_ROLES_OPTIONS,
        },
        label: '角色',
      },
      {
        fieldName: 'introduction',
        component: 'Textarea',
        label: '个人简介',
      },
    ];
  });

  onMounted(async () => {
    const { data } = await UserCommonApi.getUserInfo();
    profileBaseSettingRef.value.getFormApi().setValues(data);
  });
</script>
<template>
  <ProfileBaseSetting ref="profileBaseSettingRef" :form-schema="formSchema" />
</template>
