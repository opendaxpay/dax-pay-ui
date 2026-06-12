<script lang="ts" setup>
  import type { UploadProps } from 'antdv-next';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { useMessage } from '#/hooks/useMessage';
  import { useUpload } from '#/hooks/useUpload';

  const props = withDefaults(
    defineProps<{
      accessType?: 'private' | 'public';
      disabled?: boolean;
      maxSize?: number;
      modelValue?: string;
      showable?: boolean;
    }>(),
    {
      accessType: 'public',
      disabled: false,
      maxSize: 1024,
      modelValue: undefined,
      showable: false,
    },
  );

  const emit = defineEmits<{
    change: [value?: string];
    'update:modelValue': [value?: string];
  }>();

  const { message } = useMessage();
  const { uploadImage, getFileAccessUrl } = useUpload();

  const preview = ref(false);
  const loading = ref(false);

  const imageUrl = computed(() => {
    return props.modelValue ? getFileAccessUrl(props.modelValue) : undefined;
  });

  function setOpen(value: boolean): void {
    preview.value = value;
  }

  /**
   * 格式化文件大小
   */
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 上传前处理
   */
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (file.size / 1024 > props.maxSize) {
      // 国际化：文件过大提示
      message.error(
        $t('components.upload.fileTooLarge', {
          name: file.name,
          size: formatFileSize(file.size),
          maxSize: formatFileSize(props.maxSize * 1024),
        }),
      );
      return false;
    }
    return true;
  };

  /**
   * 自定义上传
   */
  async function customUpload(options: any) {
    const { file, onSuccess, onError } = options;
    loading.value = true;

    try {
      const result = await uploadImage(file, props.accessType);
      emit('update:modelValue', result.filename);
      emit('change', result.filename);
      // 国际化：上传成功提示
      message.success($t('components.upload.uploadSuccess', { name: file.name }));
      onSuccess?.(result);
    } catch (error: any) {
      // 国际化：上传失败提示
      message.error($t('components.upload.uploadFailed', { name: file.name }));
      onError?.(error);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 删除图片
   */
  function handleDelete() {
    emit('update:modelValue', undefined);
    emit('change', undefined);
  }
</script>

<template>
  <div class="b-upload-image">
    <a-upload
      v-if="!modelValue"
      accept="image/*"
      :before-upload="beforeUpload"
      :custom-request="customUpload"
      :disabled="disabled || showable"
      :show-upload-list="false"
      list-type="picture-card"
      name="file"
    >
      <div v-if="loading" class="upload-loading">
        <a-spin />
      </div>
      <div v-else class="upload-trigger">
        <IconifyIcon class="upload-icon" icon="ant-design:plus-outlined" />
        <!-- 国际化：上传图片按钮文字 -->
        <div class="upload-text">{{ $t('components.upload.uploadImage') }}</div>
      </div>
    </a-upload>
    <div v-else class="img-wrapper">
      <a-image :height="100" :preview="{ onOpenChange: setOpen, open: preview }" :src="imageUrl" :width="100" />
      <div v-if="!showable && !disabled" class="img-mask">
        <IconifyIcon class="mask-icon" icon="ant-design:eye-outlined" @click="() => setOpen(true)" />
        <IconifyIcon class="mask-icon" icon="ant-design:delete-outlined" @click="handleDelete" />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
  .b-upload-image {
    .upload-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .upload-trigger {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .upload-icon {
      font-size: 24px;
      color: #999;
      margin-bottom: 8px;
    }

    .upload-text {
      font-size: 14px;
      color: #666;
    }

    .img-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 102px;
      height: 102px;
      margin-bottom: 8px;
      margin-inline-end: 8px;
      overflow: hidden;
      text-align: center;
      vertical-align: top;
      cursor: pointer;
      background-color: rgb(0 0 0 / 2%);
      border: 1px dashed rgb(217 217 217 / 0%);
      border-radius: 8px;
      transition: border-color 0.3s;
    }

    .img-mask {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 100px;
      gap: 16px;
      color: #fff;
      cursor: pointer;
      background: rgb(0 0 0 / 50%);
      opacity: 0;
      transition: opacity 0.3s;

      &:hover {
        opacity: 1;
      }
    }

    .mask-icon {
      font-size: 18px;
      cursor: pointer;

      &:hover {
        color: #1890ff;
      }
    }
  }
</style>
