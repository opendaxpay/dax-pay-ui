<script lang="ts" setup>
  import { ref } from 'vue';

  import { $t } from '@vben/locales';
  import { formatDateTime } from '@vben/utils';

  import { SensitiveWordHitApi, type SensitiveWordHitVo } from '#/api/system/sensitive-word-hit.api';

  const open = ref(false);
  const loading = ref(false);
  const detail = ref<SensitiveWordHitVo>({});

  /** 场景 code → 文案，未知回退原文 */
  function sceneLabel(c?: string) {
    if (!c) return '-';
    const key = `system.sensitiveWord.hit.scene.${c}`;
    const t = $t(key);
    return t === key ? c : t;
  }

  /** 来源 code → 文案，未知回退原文 */
  function sourceLabel(c?: string) {
    if (!c) return '-';
    const key = `system.sensitiveWord.hit.source.${c}`;
    const t = $t(key);
    return t === key ? c : t;
  }

  async function show(record: SensitiveWordHitVo) {
    open.value = true;
    loading.value = true;
    detail.value = { ...record };
    try {
      if (record.id) {
        const { data } = await SensitiveWordHitApi.getById(record.id);
        if (data) {
          detail.value = data;
        }
      }
    } finally {
      loading.value = false;
    }
  }

  function handleClose() {
    open.value = false;
    detail.value = {};
  }

  defineExpose({ show });
</script>

<template>
  <a-modal
    :open="open"
    :title="$t('system.sensitiveWord.hit.view')"
    :footer="null"
    :width="640"
    destroy-on-hidden
    @cancel="handleClose"
  >
    <a-spin :spinning="loading">
      <a-descriptions :column="2" size="small" bordered>
        <!-- 命中词 -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.hitWord')">
          {{ detail.hitWord || '-' }}
        </a-descriptions-item>
        <!-- 场景 -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.scene')">
          {{ sceneLabel(detail.scene) }}
        </a-descriptions-item>
        <!-- 来源 -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.source')">
          {{ sourceLabel(detail.source) }}
        </a-descriptions-item>
        <!-- 命中时间 -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.createTime')">
          {{ formatDateTime(detail.createTime) || '-' }}
        </a-descriptions-item>
        <!-- 原文摘要 -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.contentPreview')" :span="2">
          {{ detail.contentPreview || '-' }}
        </a-descriptions-item>
        <!-- 商户号 -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.mchNo')">
          {{ detail.mchNo || '-' }}
        </a-descriptions-item>
        <!-- 应用号 -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.appId')">
          {{ detail.appId || '-' }}
        </a-descriptions-item>
        <!-- 操作人 -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.operatorId')">
          {{ detail.operatorId || '-' }}
        </a-descriptions-item>
        <!-- 客户端 IP -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.clientIp')">
          {{ detail.clientIp || '-' }}
        </a-descriptions-item>
        <!-- 请求路径 -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.requestPath')" :span="2">
          {{ detail.requestPath || '-' }}
        </a-descriptions-item>
        <!-- 备注 -->
        <a-descriptions-item :label="$t('system.sensitiveWord.hit.field.remark')" :span="2">
          {{ detail.remark || '-' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-modal>
</template>
