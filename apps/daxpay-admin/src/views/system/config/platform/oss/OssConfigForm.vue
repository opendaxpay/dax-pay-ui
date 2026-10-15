<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { IconifyIcon } from '@vben-core/icons';
  import { $t } from '@vben/locales';

  import {
    type ConnectivityCheckResult,
    type OssConfig,
    OssConfigApi,
  } from '#/api/system/oss-config.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const { confirm, message } = useMessage();
  const { diffForm } = useFormEdit();

  const formRef = ref();
  const loading = ref(false);
  const saving = ref(false);
  // 测试连接中
  const checking = ref(false);
  // 是否处于编辑状态
  const isEditing = ref(false);
  // 记录原始值，用于检测敏感字段是否被修改
  const originalValues = ref<OssConfig>({});
  // 表单数据
  const formState = ref<OssConfig>({});
  // 连接测试结果弹窗
  const checkResultOpen = ref(false);
  // 最近一次连接测试结果(含公开桶/私有桶分步明细)
  const checkResult = ref<ConnectivityCheckResult>();
  // 表单是否与已保存配置存在差异(影响"测试连接"结果的含义, 见 handleCheck)
  const isConfigChanged = computed(() => {
    const diff = diffForm(originalValues.value, formState.value, ...Object.keys(formState.value));
    return Object.values(diff).some((value) => value !== undefined);
  });

  // 表单校验规则
  const formRules = {
    // 服务端点
    endpoint: [{ required: true, message: $t('system.platform.oss.inputEndpoint') }],
    // 公有桶名称
    publicBucket: [{ required: true, message: $t('system.platform.oss.inputPublicBucket') }],
    // 私有桶名称
    privateBucket: [{ required: true, message: $t('system.platform.oss.inputPrivateBucket') }],
    // 路径样式访问
    pathStyleAccess: [{ required: true, message: $t('system.platform.oss.inputPathStyleAccess') }],
    // 访问密钥
    accessKey: [{ required: true, message: $t('system.platform.oss.inputAccessKey') }],
    // 私有密钥
    secretKey: [{ required: true, message: $t('system.platform.oss.inputSecretKey') }],
    // 公开访问域名: 非必填, 但填写时必须带协议前缀——无协议的地址经 302 跳转会被当作相对路径, 公开文件无法访问
    publicBaseUrl: [
      {
        validator: (_rule: any, value: string) => {
          if (value && !/^https?:\/\//.test(value.trim())) {
            return Promise.reject(new Error($t('system.platform.oss.publicBaseUrlSchemeInvalid')));
          }
          return Promise.resolve();
        },
      },
    ],
  };

  // 公开访问 URL 拼接预览(随上方配置实时变化, 与后端 getPublicUrl 拼接规则一致):
  // 域名(去尾部斜杠) + [桶名(带桶名方式)] + 基础路径(去首尾斜杠) + 上传日期(yyyy/MM/dd) + 文件名(UUID.扩展名)
  const publicUrlPreview = computed(() => {
    const baseUrl = (formState.value.publicBaseUrl ?? '').trim().replace(/\/+$/, '');
    if (!baseUrl) {
      return '';
    }
    const segments: string[] = [];
    if (formState.value.publicUrlMode === 'withBucket') {
      const bucket = (formState.value.publicBucket ?? '').trim();
      if (bucket) {
        segments.push(bucket);
      }
    }
    const basePath = (formState.value.basePath ?? '').trim().replace(/^\/+|\/+$/g, '');
    if (basePath) {
      segments.push(basePath);
    }
    const now = new Date();
    const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    segments.push(datePath, 'a1b2c3d4e5f64789abcdef1234567890.jpg');
    return `${baseUrl}/${segments.join('/')}`;
  });

  // 域名是否缺少协议前缀(302 跳转按相对路径解析, 公开文件将无法访问)
  const publicBaseUrlMissingScheme = computed(() => {
    const baseUrl = (formState.value.publicBaseUrl ?? '').trim();
    return !!baseUrl && !/^https?:\/\//.test(baseUrl);
  });

  onMounted(() => {
    loadConfig();
  });

  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await OssConfigApi.get();
      if (data) {
        // 拼接方式为新增字段, 旧配置无值时按缺省"桶级域名"展示
        formState.value = { publicUrlMode: 'bucketLevel', ...data };
        // 记录原始值，用于后续比较
        originalValues.value = { ...formState.value };
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * 进入编辑模式
   */
  function handleEdit() {
    isEditing.value = true;
    formRef.value?.clearValidate();
  }

  /**
   * 取消编辑，重新加载数据
   */
  function handleCancel() {
    confirm({
      title: $t('common.confirm'),
      content: $t('common.confirmCancelContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        isEditing.value = false;
        await loadConfig();
        formRef.value?.clearValidate();
      },
    });
  }

  /**
   * 保存配置
   */
  function handleSave() {
    formRef.value?.validate().then(() => {
      confirm({
        cancelText: $t('common.cancelText'),
        content: $t('system.platform.oss.confirmSaveContent'),
        okText: $t('common.okText'),
        onOk: async () => {
          saving.value = true;
          try {
            // 使用diffForm处理敏感字段，未修改的字段返回undefined
            const sensitiveData = diffForm(originalValues, formState, 'accessKey', 'secretKey');
            const submitData: OssConfig = {
              ...formState.value,
              ...sensitiveData,
            };
            await OssConfigApi.update(submitData);
            message.success($t('common.saveSuccess'));
            isEditing.value = false;
            // 重新加载以获取最新数据
            await loadConfig();
          } finally {
            saving.value = false;
          }
        },
        title: $t('common.confirm'),
      });
    }).catch(() => {});
  }

  /**
   * 测试 OSS 连通性
   *
   * 密钥未改时不传 accessKey/secretKey, 后端用库中真实密钥合并探测.
   * 新版后端返回公开桶/私有桶各自独立的分步明细, 弹窗展示整体情况(一桶失败不影响另一桶呈现);
   * 无明细的响应(如配置不完整)退回 toast 提示.
   */
  async function handleCheck() {
    checking.value = true;
    // 立即弹出测试窗口, 请求期间展示全窗 loading, 结果返回后原地替换
    checkResult.value = undefined;
    checkResultOpen.value = true;
    try {
      const sensitiveData = diffForm(originalValues, formState, 'accessKey', 'secretKey');
      const payload: OssConfig = {
        endpoint: formState.value.endpoint,
        region: formState.value.region,
        publicBucket: formState.value.publicBucket,
        privateBucket: formState.value.privateBucket,
        publicBaseUrl: formState.value.publicBaseUrl,
        publicUrlMode: formState.value.publicUrlMode,
        pathStyleAccess: formState.value.pathStyleAccess,
        basePath: formState.value.basePath,
        ...sensitiveData,
      };
      const { data } = await OssConfigApi.check(payload);
      if (data?.publicBucketDetail || data?.privateBucketDetail) {
        checkResult.value = data;
        return;
      }
      // 无分步明细的响应(如配置不完整): 关闭窗口退回 toast 提示
      checkResultOpen.value = false;
      if (data?.success) {
        const latency = data.latencyMs != null ? ` (${data.latencyMs}ms)` : '';
        message.success(`${data.message || $t('system.platform.oss.checkSuccess')}${latency}`);
        // 存储读写正常但公开访问域名取不到文件, 单独给出警告(不影响测试结论)
        if (data.warning) {
          message.warning(data.warning);
        }
        // 测试使用表单当前值, 未保存时实际上传仍按库中旧配置执行
        if (isConfigChanged.value) {
          message.warning($t('system.platform.oss.checkUsesFormValue'));
        }
      } else {
        message.error(data?.message || $t('system.platform.oss.checkFailed'));
      }
    } finally {
      checking.value = false;
    }
  }

  // 弹窗中分桶展示的检查明细(公开桶/私有桶各一块)
  const checkBuckets = computed(() => {
    if (!checkResult.value) {
      return [];
    }
    return [
      {
        label: $t('system.platform.oss.publicBucket'),
        detail: checkResult.value.publicBucketDetail,
      },
      {
        label: $t('system.platform.oss.privateBucket'),
        detail: checkResult.value.privateBucketDetail,
      },
    ];
  });

  /**
   * 检查步骤标识对应的展示名称
   */
  function stepLabel(step?: string) {
    const labelMap: Record<string, string> = {
      connect: $t('system.platform.oss.checkStep.connect'),
      publicAccess: $t('system.platform.oss.checkStep.publicAccess'),
      read: $t('system.platform.oss.checkStep.read'),
      write: $t('system.platform.oss.checkStep.write'),
    };
    return labelMap[step ?? ''] ?? step ?? '';
  }

  /**
   * 步骤状态对应的图标
   */
  function stepIcon(status?: string) {
    const iconMap: Record<string, string> = {
      failed: 'ant-design:close-circle-filled',
      skipped: 'ant-design:minus-circle-filled',
      success: 'ant-design:check-circle-filled',
      warning: 'ant-design:exclamation-circle-filled',
    };
    return iconMap[status ?? ''] ?? 'ant-design:minus-circle-filled';
  }

  /**
   * 步骤状态图标的颜色
   */
  function stepIconClass(status?: string) {
    const classMap: Record<string, string> = {
      failed: 'text-red-500',
      skipped: 'text-gray-400',
      success: 'text-green-600',
      warning: 'text-orange-500',
    };
    return classMap[status ?? ''] ?? 'text-gray-400';
  }

  /**
   * 步骤状态的展示文案
   */
  function statusText(status?: string) {
    const textMap: Record<string, string> = {
      failed: $t('system.platform.oss.checkStatus.failed'),
      skipped: $t('system.platform.oss.checkStatus.skipped'),
      success: $t('system.platform.oss.checkStatus.success'),
      warning: $t('system.platform.oss.checkStatus.warning'),
    };
    return textMap[status ?? ''] ?? '';
  }

  /**
   * 步骤失败/警告说明的展示颜色
   */
  function stepMessageClass(status?: string) {
    return status === 'warning' ? 'text-orange-500' : 'text-red-500';
  }

  // 测试连接按钮文案(响应式, 随语言切换更新)
  const checkText = computed(() => $t('system.platform.oss.check'));

  // 供外壳 PageShell 常驻 header 渲染编辑与测试连接操作(标题/描述由外壳 tabs 数据提供)
  defineExpose({
    isEditing,
    saving,
    // 测试连接: 编辑/只读均可, 常驻 header 操作区
    checking,
    checkText,
    handleCheck,
    handleEdit,
    handleCancel,
    handleSave,
  });
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
    <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical" class="module-form">
        <!-- 基础配置 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.platform.oss.section.basic') }}</div>

          <div class="config-grid">
            <a-form-item name="endpoint">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 服务端点 -->
                  <div class="config-item__label">
                    {{ $t('system.platform.oss.endpoint') }}
                    <!-- 悬浮提示: 完整服务级地址说明 -->
                    <a-tooltip :title="$t('system.platform.oss.endpointTip')">
                      <IconifyIcon icon="ant-design:question-circle-outlined" class="ml-1 cursor-help text-muted-foreground" />
                    </a-tooltip>
                  </div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.endpointDesc') }}</div>
                </div>
                <!-- 国际化：请输入服务端点 -->
                <a-input
                  v-model:value="formState.endpoint"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.oss.inputEndpoint')"
                />
              </div>
            </a-form-item>

            <a-form-item name="region">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 存储区域 -->
                  <div class="config-item__label">
                    {{ $t('system.platform.oss.region') }}
                    <!-- 悬浮提示: 区域参数非必填场景说明 -->
                    <a-tooltip :title="$t('system.platform.oss.regionTip')">
                      <IconifyIcon icon="ant-design:question-circle-outlined" class="ml-1 cursor-help text-muted-foreground" />
                    </a-tooltip>
                  </div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.regionDesc') }}</div>
                </div>
                <!-- 国际化：请输入存储区域 -->
                <a-input
                  v-model:value="formState.region"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.oss.inputRegion')"
                />
              </div>
            </a-form-item>
          </div>

          <div class="config-grid">
            <a-form-item name="accessKey">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 访问密钥 -->
                  <div class="config-item__label">{{ $t('system.platform.oss.accessKey') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.accessKeyDesc') }}</div>
                </div>
                <!-- 国际化：请输入访问密钥 -->
                <a-input
                  v-model:value="formState.accessKey"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.oss.inputAccessKey')"
                />
              </div>
            </a-form-item>

            <a-form-item name="secretKey">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 私有密钥 -->
                  <div class="config-item__label">{{ $t('system.platform.oss.secretKey') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.secretKeyDesc') }}</div>
                </div>
                <!-- 国际化：请输入私有密钥 -->
                <a-input
                  v-model:value="formState.secretKey"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.oss.inputSecretKey')"
                />
              </div>
            </a-form-item>
          </div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 路径样式访问 -->
              <div class="config-item__label">{{ $t('system.platform.oss.pathStyleAccess') }}</div>
              <div class="config-item__desc">{{ $t('system.platform.oss.pathStyleAccessDesc') }}</div>
            </div>
            <a-switch v-model:checked="formState.pathStyleAccess" :disabled="!isEditing" />
          </div>
        </div>

        <!-- 存储桶配置 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.platform.oss.section.bucket') }}</div>

          <div class="config-grid">
            <a-form-item name="publicBucket">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 公开存储桶 -->
                  <div class="config-item__label">{{ $t('system.platform.oss.publicBucket') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.publicBucketDesc') }}</div>
                </div>
                <!-- 国际化：请输入公开存储桶名称 -->
                <a-input
                  v-model:value="formState.publicBucket"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.oss.inputPublicBucket')"
                />
              </div>
            </a-form-item>

            <a-form-item name="privateBucket">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 私有存储桶 -->
                  <div class="config-item__label">{{ $t('system.platform.oss.privateBucket') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.privateBucketDesc') }}</div>
                </div>
                <!-- 国际化：请输入私有存储桶名称 -->
                <a-input
                  v-model:value="formState.privateBucket"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.oss.inputPrivateBucket')"
                />
              </div>
            </a-form-item>
          </div>

          <div class="config-grid">
            <a-form-item name="publicBaseUrl">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 公开访问域名 -->
                  <div class="config-item__label">
                    {{ $t('system.platform.oss.publicBaseUrl') }}
                    <!-- 悬浮提示: 协议前缀要求 -->
                    <a-tooltip :title="$t('system.platform.oss.publicBaseUrlTip')">
                      <IconifyIcon icon="ant-design:question-circle-outlined" class="ml-1 cursor-help text-muted-foreground" />
                    </a-tooltip>
                  </div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.publicBaseUrlDesc') }}</div>
                </div>
                <!-- 国际化：请输入公开访问域名 -->
                <a-input
                  v-model:value="formState.publicBaseUrl"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.oss.inputPublicBaseUrl')"
                />
              </div>
            </a-form-item>

            <a-form-item name="publicUrlMode">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- URL 拼接方式 -->
                  <div class="config-item__label">
                    {{ $t('system.platform.oss.publicUrlMode') }}
                    <!-- 悬浮提示: 两种拼接方式的规则与示例 -->
                    <a-tooltip :title="$t('system.platform.oss.publicUrlModeTip')">
                      <IconifyIcon
                        icon="ant-design:question-circle-outlined"
                        class="ml-1 cursor-help text-muted-foreground"
                      />
                    </a-tooltip>
                  </div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.publicUrlModeDesc') }}</div>
                </div>
                <!-- 国际化：桶级域名 / 带桶名 -->
                <a-radio-group
                  v-model:value="formState.publicUrlMode"
                  button-style="solid"
                  :disabled="!isEditing"
                >
                  <a-radio-button value="bucketLevel">
                    {{ $t('system.platform.oss.modeBucketLevel') }}
                  </a-radio-button>
                  <a-radio-button value="withBucket">
                    {{ $t('system.platform.oss.modeWithBucket') }}
                  </a-radio-button>
                </a-radio-group>
              </div>
            </a-form-item>

            <a-form-item name="basePath">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 基础存储路径 -->
                  <div class="config-item__label">{{ $t('system.platform.oss.basePath') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.basePathDesc') }}</div>
                </div>
                <!-- 国际化：请输入基础存储路径 -->
                <a-input
                  v-model:value="formState.basePath"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.oss.inputBasePath')"
                />
              </div>
            </a-form-item>

            <!-- 公开访问 URL 拼接预览: 随上方配置实时变化, 与基础存储路径同列补位; 只读态同样展示, 可直接暴露存量配置的拼接问题 -->
            <div class="config-item config-item--block">
              <div class="config-item__main">
                <div class="config-item__label">
                  {{ $t('system.platform.oss.urlPreviewTitle') }}
                  <!-- 悬浮提示: 拼接构成的完整说明 -->
                  <a-tooltip :title="$t('system.platform.oss.urlPreviewTip')">
                    <IconifyIcon icon="ant-design:question-circle-outlined" class="ml-1 cursor-help text-muted-foreground" />
                  </a-tooltip>
                </div>
                <div class="config-item__desc">{{ $t('system.platform.oss.urlPreviewDesc') }}</div>
                <div v-if="publicUrlPreview" class="url-preview__code">{{ publicUrlPreview }}</div>
                <div v-else class="config-item__desc">{{ $t('system.platform.oss.urlPreviewEmpty') }}</div>
                <div v-if="publicBaseUrlMissingScheme" class="url-preview__warn">
                  {{ $t('system.platform.oss.urlPreviewMissingScheme') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 预签名配置 -->
        <div class="config-section">
          <div class="config-section__title">{{ $t('system.platform.oss.section.presign') }}</div>

          <div class="config-grid">
            <a-form-item name="uploadExpireMinutes">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 上传预签名URL有效期 -->
                  <div class="config-item__label">{{ $t('system.platform.oss.uploadExpireMinutes') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.uploadExpireMinutesDesc') }}</div>
                </div>
                <div class="number-field">
                  <!-- 国际化：请输入上传预签名URL有效期（分钟） -->
                  <a-input-number
                    v-model:value="formState.uploadExpireMinutes"
                    :disabled="!isEditing"
                    :placeholder="$t('system.platform.oss.inputUploadExpireMinutes')"
                    :min="1"
                    :precision="0"
                    style="width: 180px"
                  />
                  <!-- 单位：分钟 -->
                  <span class="number-field__suffix">{{ $t('system.platform.oss.unit.minutes') }}</span>
                </div>
              </div>
            </a-form-item>

            <a-form-item name="downloadExpireHours">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 下载或查看预签名URL有效期 -->
                  <div class="config-item__label">{{ $t('system.platform.oss.downloadExpireHours') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.downloadExpireHoursDesc') }}</div>
                </div>
                <div class="number-field">
                  <!-- 国际化：请输入下载或查看预签名URL有效期（小时） -->
                  <a-input-number
                    v-model:value="formState.downloadExpireHours"
                    :disabled="!isEditing"
                    :placeholder="$t('system.platform.oss.inputDownloadExpireHours')"
                    :min="1"
                    :precision="0"
                    style="width: 180px"
                  />
                  <!-- 单位：小时 -->
                  <span class="number-field__suffix">{{ $t('system.platform.oss.unit.hours') }}</span>
                </div>
              </div>
            </a-form-item>
          </div>
        </div>
      </a-form>
  </a-spin>

  <!-- 连接测试弹窗: 点击即弹出, 请求期间全窗 loading, 结果返回后原地替换 -->
  <a-modal
    v-model:open="checkResultOpen"
    :footer="null"
    :title="$t('system.platform.oss.checkResultTitle')"
    :width="600"
  >
    <!-- 请求进行中: 探测含真实上传/读取, 通常需要数秒 -->
    <div v-if="checking" class="flex flex-col items-center gap-3 py-10">
      <a-spin size="large" />
      <div class="text-sm text-gray-500">{{ $t('system.platform.oss.checkInProgress') }}</div>
    </div>
    <div v-else-if="checkResult" class="flex flex-col gap-4">
      <!-- 总体结果与耗时 -->
      <a-alert :type="checkResult.success ? 'success' : 'error'" show-icon>
        <template #message>
          <span>{{ checkResult.message }}</span>
          <span v-if="checkResult.latencyMs != null" class="ml-2 text-xs opacity-70">
            {{ $t('system.platform.oss.checkLatency', { ms: checkResult.latencyMs }) }}
          </span>
        </template>
      </a-alert>

      <!-- 分桶明细 -->
      <div
        v-for="bucket in checkBuckets"
        :key="bucket.label"
        class="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
      >
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ bucket.label }}</span>
            <span class="text-xs text-gray-400">{{ bucket.detail?.bucketName }}</span>
          </div>
          <!-- 该桶读写闭环结论(公开访问不可达属警告, 不影响本结论) -->
          <a-tag :color="bucket.detail?.success ? 'success' : 'error'">
            {{ bucket.detail?.success
              ? $t('system.platform.oss.checkStatus.success')
              : $t('system.platform.oss.checkStatus.failed') }}
          </a-tag>
        </div>
        <div class="flex flex-col gap-1.5">
          <div
            v-for="step in bucket.detail?.steps"
            :key="step.step"
            class="flex flex-col"
          >
            <!-- 步骤名与状态固定一行不换行, 避免被长说明挤压成逐字断行 -->
            <div class="flex items-center gap-2 text-sm">
              <IconifyIcon
                :icon="stepIcon(step.status)"
                :class="stepIconClass(step.status)"
                class="shrink-0"
              />
              <span class="whitespace-nowrap">{{ stepLabel(step.step) }}</span>
              <span :class="stepIconClass(step.status)" class="text-xs whitespace-nowrap">
                {{ statusText(step.status) }}
              </span>
            </div>
            <!-- 失败或警告说明独立成行, 左侧缩进与步骤名文字对齐 -->
            <div
              v-if="step.message"
              :class="stepMessageClass(step.status)"
              class="pl-6 text-xs leading-relaxed"
            >
              {{ step.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- 测试使用表单当前值, 未保存时实际上传仍按库中旧配置执行 -->
      <a-alert
        v-if="isConfigChanged"
        :message="$t('system.platform.oss.checkUsesFormValue')"
        show-icon
        type="warning"
      />
    </div>
  </a-modal>
</template>

<style scoped>
  /* 同行卡片等高: a-form-item 多层包裹, 用 flex 链把 grid 行高传到内层卡片
     (如 基础存储路径|拼接预览 一行, 不加则矮卡底边悬空);
     用 flex 而非 height:100% 锁死——校验错误文案出现时卡片在本格内压缩腾位, 不溢出重叠到下一行 */
  .config-grid :deep(.ant-form-item),
  .config-grid :deep(.ant-form-item-row),
  .config-grid :deep(.ant-form-item-control) {
    display: flex;
    flex-direction: column;
  }

  .config-grid :deep(.ant-form-item-row),
  .config-grid :deep(.ant-form-item-control-input) {
    flex: 1;
  }

  .config-grid :deep(.ant-form-item-control-input-content),
  .config-grid :deep(.ant-form-item .config-item) {
    height: 100%;
  }

  /* 拼接预览地址: 等宽字体整串展示, 超长换行不断溢出 */
  .url-preview__code {
    margin-top: 6px;
    padding: 6px 10px;
    font-size: 12px;
    line-height: 1.6;
    word-break: break-all;
    background: hsl(var(--accent) / 60%);
    border-radius: 6px;
  }

  .url-preview__warn {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--warning, 24 95% 53%));
  }
</style>

