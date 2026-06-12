<script lang="ts" setup>
  import type { UploadFile } from 'antdv-next';

  import { ref } from 'vue';

  import { $t } from '@vben/locales';

  import { BUploadImage } from '#/components/b-upload-image';
  import { useMessage } from '#/hooks/useMessage';
  import { uploadPlatformFile } from '#/utils/platform-file-upload';

  const { message, confirm } = useMessage();

  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  const publicFileList = ref<UploadFile[]>([]);
  const privateFileList = ref<UploadFile[]>([]);
  const publicFiles = ref<{ accessUrl: string; filename: string }[]>([]);
  const privateFiles = ref<{ accessUrl: string; filename: string }[]>([]);

  // BUploadImage 组件示例
  const publicImage = ref<string>();
  const privateImage = ref<string>();

  /**
   * 校验文件
   */
  function validateFile(file: File): boolean {
    if (file.size > MAX_FILE_SIZE) {
      // 国际化：文件大小超出限制，最大10MB
      message.error($t('demos.file-upload.fileTooLarge'));
      return false;
    }
    return true;
  }

  /**
   * 公开桶上传
   */
  async function handlePublicUpload(options: Record<string, any>) {
    const file = options.file as File;
    if (!validateFile(file)) {
      options.onError?.(new Error('Validation failed'));
      return;
    }

    // 国际化：上传中...
    const hideLoading = message.loading($t('demos.file-upload.uploading'), 0);

    const { filename } = await uploadPlatformFile(file, {
      accessType: 'public',
    });

    const accessUrl = `/api/file/platform/access/${filename}`;
    publicFiles.value.push({ filename, accessUrl });

    const uploadFile: UploadFile = {
      uid: filename,
      name: file.name,
      status: 'done',
      url: accessUrl,
    };
    publicFileList.value = [...publicFileList.value, uploadFile];

    hideLoading();
    // 国际化：上传成功
    message.success($t('demos.file-upload.uploadSuccess'));
    options.onSuccess?.({}, file);
  }

  /**
   * 私有桶上传
   */
  async function handlePrivateUpload(options: Record<string, any>) {
    const file = options.file as File;
    if (!validateFile(file)) {
      options.onError?.(new Error('Validation failed'));
      return;
    }

    // 国际化：上传中...
    const hideLoading = message.loading($t('demos.file-upload.uploading'), 0);

    const { filename } = await uploadPlatformFile(file, {
      accessType: 'private',
    });

    const accessUrl = `/api/file/platform/access/${filename}`;
    privateFiles.value.push({ filename, accessUrl });

    const uploadFile: UploadFile = {
      uid: filename,
      name: file.name,
      status: 'done',
      url: accessUrl,
    };
    privateFileList.value = [...privateFileList.value, uploadFile];

    hideLoading();
    // 国际化：上传成功
    message.success($t('demos.file-upload.uploadSuccess'));
    options.onSuccess?.({}, file);
  }

  /**
   * 删除公开桶文件
   */
  async function handleRemovePublic(file: UploadFile) {
    const filename = file.uid;
    confirm({
      // 国际化：确定要删除该文件吗？
      title: $t('demos.file-upload.deleteConfirm'),
      onOk: async () => {
        publicFiles.value = publicFiles.value.filter((f) => f.filename !== filename);
        publicFileList.value = publicFileList.value.filter((f) => f.uid !== file.uid);
        // 国际化：删除成功
        message.success($t('demos.file-upload.deleteSuccess'));
      },
    });
    return false;
  }

  /**
   * 删除私有桶文件
   */
  async function handleRemovePrivate(file: UploadFile) {
    const filename = file.uid;
    confirm({
      // 国际化：确定要删除该文件吗？
      title: $t('demos.file-upload.deleteConfirm'),
      onOk: async () => {
        privateFiles.value = privateFiles.value.filter((f) => f.filename !== filename);
        privateFileList.value = privateFileList.value.filter((f) => f.uid !== file.uid);
        // 国际化：删除成功
        message.success($t('demos.file-upload.deleteSuccess'));
      },
    });
    return false;
  }
</script>

<template>
  <div class="p-4">
    <!-- 国际化：文件上传演示 -->
    <a-card :title="$t('demos.file-upload.title')" class="mb-4">
      <!-- 国际化：演示预签名方式上传文件到平台存储 -->
      <p class="text-gray-500">{{ $t('demos.file-upload.description') }}</p>
    </a-card>

    <a-row :gutter="16">
      <a-col :span="12">
        <!-- 国际化：公开桶上传 -->
        <a-card :title="$t('demos.file-upload.publicBucket.title')" class="h-full">
          <p class="mb-4 text-gray-500 text-sm">
            <!-- 国际化：文件可通过公开URL直接访问，适合图片、静态资源等 -->
            {{ $t('demos.file-upload.publicBucket.description') }}
          </p>
          <a-upload
            v-model:file-list="publicFileList"
            :custom-request="handlePublicUpload"
            :remove="handleRemovePublic"
          >
            <!-- 国际化：上传 -->
            <a-button>{{ $t('demos.file-upload.upload') }}</a-button>
          </a-upload>

          <div v-if="publicFiles.length > 0" class="mt-4">
            <!-- 国际化：访问地址 -->
            <a-divider>{{ $t('demos.file-upload.accessUrl') }}</a-divider>
            <div class="space-y-1">
              <div
                v-for="item in publicFiles"
                :key="item.filename"
                class="flex items-start py-1.5 border-b border-gray-100 last:border-b-0"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ item.filename }}</div>
                  <div class="text-gray-400 text-xs truncate mt-0.5">{{ item.accessUrl }}</div>
                </div>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>

      <a-col :span="12">
        <!-- 国际化：加密桶上传 -->
        <a-card :title="$t('demos.file-upload.loginBucket.title')" class="h-full">
          <p class="mb-4 text-gray-500 text-sm">
            <!-- 国际化：文件需要预签名URL才能访问，适合敏感文件、合同等 -->
            {{ $t('demos.file-upload.loginBucket.description') }}
          </p>
          <a-upload
            v-model:file-list="privateFileList"
            :custom-request="handlePrivateUpload"
            :remove="handleRemovePrivate"
          >
            <!-- 国际化：上传 -->
            <a-button>{{ $t('demos.file-upload.upload') }}</a-button>
          </a-upload>

          <div v-if="privateFiles.length > 0" class="mt-4">
            <!-- 国际化：访问地址 -->
            <a-divider>{{ $t('demos.file-upload.accessUrl') }}</a-divider>
            <div class="space-y-1">
              <div
                v-for="item in privateFiles"
                :key="item.filename"
                class="flex items-start py-1.5 border-b border-gray-100 last:border-b-0"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ item.filename }}</div>
                  <div class="text-gray-400 text-xs truncate mt-0.5">{{ item.accessUrl }}</div>
                </div>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="图片上传组件示例 (BUploadImage)" class="mt-4">
      <a-row :gutter="16">
        <a-col :span="12">
          <div class="mb-2 font-medium">公有文件上传</div>
          <BUploadImage v-model="publicImage" access-type="public" />
        </a-col>
        <a-col :span="12">
          <div class="mb-2 font-medium">私有文件上传</div>
          <BUploadImage v-model="privateImage" access-type="private" />
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>
