<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { type PlatformFile, PlatformFileApi } from '#/api/system/platform-file.api';
  import { useApiPrefix } from '#/hooks/useApiPrefix';

  const data = ref<Partial<PlatformFile>>({});
  const visible = ref(false);
  const confirmLoading = ref(false);
  const apiPrefix = useApiPrefix();

  /**
   * 显示详情
   */
  function show(id: string) {
    visible.value = true;
    confirmLoading.value = true;
    PlatformFileApi.findById(id).then(({ data: res }) => {
      data.value = res || {};
      confirmLoading.value = false;
    });
  }

  /**
   * 格式化文件大小
   */
  function formatSize(size: number): string {
    if (!size) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  /**
   * 预览文件
   */
  function handlePreview() {
    if (data.value.filename) {
      window.open(`${apiPrefix}/file/platform/access/${data.value.filename}`, '_blank');
    }
  }

  /**
   * 下载文件
   */
  function handleDownload() {
    if (data.value.filename) {
      window.open(`${apiPrefix}/file/platform/download/${data.value.filename}`, '_blank');
    }
  }

  defineExpose({ show, init: show });
</script>

<template>
  <!-- 国际化：平台文件详情 -->
  <a-modal
    v-bind="$attrs"
    :loading="confirmLoading"
    :width="700"
    :title="$t('system.file.platform.detailTitle')"
    :open="visible"
    @cancel="visible = false"
  >
    <a-spin :spinning="confirmLoading">
      <a-descriptions :column="2" size="small" bordered>
        <!-- 文件名称 -->
        <a-descriptions-item :label="$t('system.file.platform.field.filename')">
          {{ data.filename }}
        </a-descriptions-item>
        <!-- 原始文件名 -->
        <a-descriptions-item :label="$t('system.file.platform.field.originalFilename')">
          {{ data.originalFilename }}
        </a-descriptions-item>
        <!-- 文件大小 -->
        <a-descriptions-item :label="$t('system.file.platform.field.size')">
          {{ formatSize(data.size!) }}
        </a-descriptions-item>
        <!-- 扩展名 -->
        <a-descriptions-item :label="$t('system.file.platform.field.ext')">
          {{ data.ext }}
        </a-descriptions-item>
        <!-- MIME类型 -->
        <a-descriptions-item :label="$t('system.file.platform.field.contentType')" :span="2">
          {{ data.contentType }}
        </a-descriptions-item>
        <!-- 文件访问地址 -->
        <a-descriptions-item :label="$t('system.file.platform.field.url')" :span="2">
          <a v-if="data.url" :href="data.url" target="_blank">{{ data.url }}</a>
        </a-descriptions-item>
        <!-- 基础存储路径 -->
        <a-descriptions-item :label="$t('system.file.platform.field.basePath')">
          {{ data.basePath }}
        </a-descriptions-item>
        <!-- 存储路径 -->
        <a-descriptions-item :label="$t('system.file.platform.field.path')">
          {{ data.path }}
        </a-descriptions-item>
        <!-- 访问类型 -->
        <a-descriptions-item :label="$t('system.file.platform.field.accessType')">
          <a-tag v-if="data.accessType === 'public'" color="green">{{
            $t('system.file.platform.accessType.public')
          }}</a-tag>
          <a-tag v-else color="orange">{{ $t('system.file.platform.accessType.private') }}</a-tag>
        </a-descriptions-item>
        <!-- 业务分类 -->
        <a-descriptions-item :label="$t('system.file.platform.field.bizType')">
          {{ data.bizType || '-' }}
        </a-descriptions-item>
        <!-- 备注 -->
        <a-descriptions-item :label="$t('system.file.platform.field.remark')" :span="2">
          {{ data.remark }}
        </a-descriptions-item>
        <!-- 创建时间 -->
        <a-descriptions-item :label="$t('system.file.platform.field.createTime')">
          {{ data.createTime }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button @click="visible = false">{{ $t('common.close') }}</a-button>
        <!-- 国际化：预览 -->
        <a-button @click="handlePreview">{{ $t('system.file.platform.action.preview') }}</a-button>
        <!-- 国际化：下载 -->
        <a-button type="primary" @click="handleDownload">{{ $t('system.file.platform.action.download') }}</a-button>
      </a-space>
    </template>
  </a-modal>
</template>
