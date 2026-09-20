<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';

  import { IconifyIcon } from '@vben-core/icons';
  import { $t } from '@vben/locales';

  import { type OssConfig, OssConfigApi } from '#/api/system/oss-config.api';
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
  };

  onMounted(() => {
    loadConfig();
  });

  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await OssConfigApi.get();
      if (data) {
        formState.value = data;
        // 记录原始值，用于后续比较
        originalValues.value = { ...data };
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
   */
  async function handleCheck() {
    checking.value = true;
    try {
      const sensitiveData = diffForm(originalValues, formState, 'accessKey', 'secretKey');
      const payload: OssConfig = {
        endpoint: formState.value.endpoint,
        region: formState.value.region,
        publicBucket: formState.value.publicBucket,
        privateBucket: formState.value.privateBucket,
        publicBaseUrl: formState.value.publicBaseUrl,
        privateBaseUrl: formState.value.privateBaseUrl,
        pathStyleAccess: formState.value.pathStyleAccess,
        basePath: formState.value.basePath,
        ...sensitiveData,
      };
      const { data } = await OssConfigApi.check(payload);
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
                  <div class="config-item__label">{{ $t('system.platform.oss.publicBaseUrl') }}</div>
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

            <a-form-item name="privateBaseUrl">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 私有访问域名 -->
                  <div class="config-item__label">{{ $t('system.platform.oss.privateBaseUrl') }}</div>
                  <div class="config-item__desc">{{ $t('system.platform.oss.privateBaseUrlDesc') }}</div>
                </div>
                <!-- 国际化：请输入私有访问域名 -->
                <a-input
                  v-model:value="formState.privateBaseUrl"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.oss.inputPrivateBaseUrl')"
                />
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
</template>

