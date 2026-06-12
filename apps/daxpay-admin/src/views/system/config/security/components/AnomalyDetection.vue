<script setup lang="ts">
  import type { AnomalyDetectionConfig } from '#/api/system/security.api';

  import { computed, onMounted, ref } from 'vue';

  import { SecurityApi } from '#/api/system/security.api';
  import { useMessage } from '#/hooks/useMessage';
  import { $t } from '#/locales';

  defineOptions({ name: 'AnomalyDetection' });

  const { confirm, message } = useMessage();

  const loading = ref(false);
  const formRef = ref();
  // 编辑状态
  const isEditing = ref(false);

  const formState = ref<AnomalyDetectionConfig>({} as AnomalyDetectionConfig);

  const summaryItems = computed(() => {
    return [
      // 启用状态
      formState.value.enabled
        ? $t('system.security.anomaly-detection.summary.enabled')
        : $t('system.security.anomaly-detection.summary.disabled'),
      // IP检测
      formState.value.detectAnomalousIp
        ? $t('system.security.anomaly-detection.summary.ipDetectionEnabled', {
            threshold: formState.value.ipRiskThreshold ?? 0,
          })
        : $t('system.security.anomaly-detection.summary.ipDetectionDisabled'),
      // 时间检测
      formState.value.detectAnomalousTime
        ? $t('system.security.anomaly-detection.summary.timeDetectionEnabled', {
            hours: formState.value.timeDeviationThreshold ?? 0,
          })
        : $t('system.security.anomaly-detection.summary.timeDetectionDisabled'),
      // 设备检测
      formState.value.detectAnomalousDevice
        ? $t('system.security.anomaly-detection.summary.deviceDetectionEnabled')
        : $t('system.security.anomaly-detection.summary.deviceDetectionDisabled'),
      // 拦截策略
      formState.value.blockOnAnomaly
        ? $t('system.security.anomaly-detection.summary.blockEnabled')
        : $t('system.security.anomaly-detection.summary.blockDisabled'),
    ];
  });

  /**
   * 加载异常登录检测配置
   */
  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await SecurityApi.getAnomalyDetectionConfig();
      formState.value = data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 进入编辑模式
   */
  function handleEdit() {
    isEditing.value = true;
  }

  /**
   * 取消编辑
   */
  function handleCancel() {
    loadConfig();
    isEditing.value = false;
  }

  /**
   * 保存异常登录检测配置
   */
  function handleSave() {
    confirm({
      // 确认保存
      title: $t('system.security.common.confirmSave'),
      // 确定要保存当前配置吗？
      content: $t('system.security.common.confirmSaveContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        await formRef.value?.validate();
        loading.value = true;
        try {
          await SecurityApi.updateAnomalyDetectionConfig(formState.value);
          // 保存成功提示
          message.success($t('common.saveSuccess'));
          await loadConfig();
          isEditing.value = false;
        } finally {
          loading.value = false;
        }
      },
    });
  }

  onMounted(() => {
    loadConfig();
  });
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
    <div class="security-module-page">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- 异常登录检测标题 -->
          <div class="module-overview__title">{{ $t('system.security.anomaly-detection.title') }}</div>
          <div class="module-actions">
            <a-space>
              <!-- 非编辑状态：显示编辑按钮 -->
              <template v-if="!isEditing">
                <a-button type="primary" @click="handleEdit">{{ $t('common.edit') }}</a-button>
              </template>
              <!-- 编辑状态：显示取消和确认按钮 -->
              <template v-else>
                <a-button @click="handleCancel">{{ $t('system.security.common.cancel') }}</a-button>
                <a-button type="primary" :loading="loading" @click="handleSave">{{
                  $t('system.security.common.confirm')
                }}</a-button>
              </template>
            </a-space>
          </div>
        </div>
        <!-- 异常登录检测描述 -->
        <div class="module-overview__desc">{{ $t('system.security.anomaly-detection.description') }}</div>
        <a-space wrap size="small" class="module-overview__tags">
          <a-tag v-for="item in summaryItems" :key="item">{{ item }}</a-tag>
        </a-space>
      </div>

      <a-form ref="formRef" :model="formState" layout="vertical" class="module-form">
        <div class="config-section">
          <!-- 基础设置 -->
          <div class="config-section__title">{{ $t('system.security.anomaly-detection.section.basic') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 启用异常登录检测标签 -->
              <div class="config-item__label">{{ $t('system.security.anomaly-detection.enabled.label') }}</div>
              <!-- 启用异常登录检测描述 -->
              <div class="config-item__desc">{{ $t('system.security.anomaly-detection.enabled.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.enabled" :disabled="!isEditing" />
          </div>
        </div>

        <div class="config-section">
          <!-- IP检测 -->
          <div class="config-section__title">{{ $t('system.security.anomaly-detection.section.ipDetection') }}</div>

          <div class="config-grid">
            <div class="config-item">
              <div class="config-item__main">
                <!-- 检测异常IP标签 -->
                <div class="config-item__label">{{
                  $t('system.security.anomaly-detection.detectAnomalousIp.label')
                }}</div>
                <!-- 检测异常IP描述 -->
                <div class="config-item__desc">{{
                  $t('system.security.anomaly-detection.detectAnomalousIp.desc')
                }}</div>
              </div>
              <a-switch v-model:checked="formState.detectAnomalousIp" :disabled="!isEditing" />
            </div>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- IP风险阈值标签 -->
                <div class="config-item__label">{{
                  $t('system.security.anomaly-detection.ipRiskThreshold.label')
                }}</div>
                <!-- IP风险阈值描述 -->
                <div class="config-item__desc">{{ $t('system.security.anomaly-detection.ipRiskThreshold.desc') }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入IP风险阈值 -->
                <a-input-number
                  v-model:value="formState.ipRiskThreshold"
                  :min="0"
                  :max="100"
                  :placeholder="$t('system.security.anomaly-detection.ipRiskThreshold.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：分 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.score') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="config-section">
          <!-- 时间检测 -->
          <div class="config-section__title">{{ $t('system.security.anomaly-detection.section.timeDetection') }}</div>

          <div class="config-grid">
            <div class="config-item">
              <div class="config-item__main">
                <!-- 检测异常登录时间标签 -->
                <div class="config-item__label">{{
                  $t('system.security.anomaly-detection.detectAnomalousTime.label')
                }}</div>
                <!-- 检测异常登录时间描述 -->
                <div class="config-item__desc">{{
                  $t('system.security.anomaly-detection.detectAnomalousTime.desc')
                }}</div>
              </div>
              <a-switch v-model:checked="formState.detectAnomalousTime" :disabled="!isEditing" />
            </div>

            <div class="config-item config-item--block">
              <div class="config-item__main">
                <!-- 登录时间偏离阈值标签 -->
                <div class="config-item__label">{{
                  $t('system.security.anomaly-detection.timeDeviationThreshold.label')
                }}</div>
                <!-- 登录时间偏离阈值描述 -->
                <div class="config-item__desc">{{
                  $t('system.security.anomaly-detection.timeDeviationThreshold.desc')
                }}</div>
              </div>
              <div class="number-field">
                <!-- 国际化：请输入时间偏离阈值 -->
                <a-input-number
                  v-model:value="formState.timeDeviationThreshold"
                  :min="1"
                  :max="24"
                  :placeholder="$t('system.security.anomaly-detection.timeDeviationThreshold.placeholder')"
                  :disabled="!isEditing"
                  style="width: 180px"
                />
                <!-- 单位：小时 -->
                <span class="number-field__suffix">{{ $t('system.security.common.unit.hour') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="config-section">
          <!-- 设备检测 -->
          <div class="config-section__title">{{ $t('system.security.anomaly-detection.section.deviceDetection') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 检测异常设备标签 -->
              <div class="config-item__label">{{
                $t('system.security.anomaly-detection.detectAnomalousDevice.label')
              }}</div>
              <!-- 检测异常设备描述 -->
              <div class="config-item__desc">{{
                $t('system.security.anomaly-detection.detectAnomalousDevice.desc')
              }}</div>
            </div>
            <a-switch v-model:checked="formState.detectAnomalousDevice" :disabled="!isEditing" />
          </div>
        </div>

        <div class="config-section">
          <!-- 拦截策略 -->
          <div class="config-section__title">{{ $t('system.security.anomaly-detection.section.blockStrategy') }}</div>

          <div class="config-item">
            <div class="config-item__main">
              <!-- 检测到异常登录时拦截标签 -->
              <div class="config-item__label">{{ $t('system.security.anomaly-detection.blockOnAnomaly.label') }}</div>
              <!-- 检测到异常登录时拦截描述 -->
              <div class="config-item__desc">{{ $t('system.security.anomaly-detection.blockOnAnomaly.desc') }}</div>
            </div>
            <a-switch v-model:checked="formState.blockOnAnomaly" :disabled="!isEditing" />
          </div>
        </div>
      </a-form>
    </div>
  </a-spin>
</template>

<style scoped>
  .security-module-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 4px;
  }

  .module-overview {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .module-overview__header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .module-overview__title {
    font-size: 18px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .module-overview__desc {
    font-size: 13px;
    line-height: 1.7;
    color: hsl(var(--muted-foreground));
  }

  .module-overview__tags {
    padding-top: 2px;
  }

  .module-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .config-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .config-section__title {
    font-size: 15px;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .config-item {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 12px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .config-item:hover {
    border-color: hsl(var(--primary) / 30%);
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  }

  .config-item--block {
    flex-direction: column;
    align-items: flex-start;
  }

  .config-item--full {
    grid-column: span 2;
  }

  .config-item__main {
    flex: 1;
    min-width: 0;
  }

  .config-item__label {
    font-size: 14px;
    font-weight: 500;
    color: hsl(var(--foreground));
  }

  .config-item__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: hsl(var(--muted-foreground));
  }

  .number-field {
    display: inline-flex;
    gap: 8px;
    align-items: center;
  }

  .number-field__suffix {
    flex: 0 0 auto;
    font-size: 13px;
    color: hsl(var(--muted-foreground));
  }

  .module-actions {
    flex-shrink: 0;
  }
</style>
