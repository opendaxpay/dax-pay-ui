<script lang="ts" setup>
  import type { UserPasswordResult } from '#/api/payment/merchant/merchant-user.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MerchantUserApi } from '#/api/payment/merchant/merchant-user.api';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();

  // 弹窗状态
  const visible = ref(false);
  // 提交加载状态
  const loading = ref(false);
  // 用户 ID 列表
  const userIds = ref<string[]>([]);
  // 重置结果(含初始密码明文), 为 null 时显示确认态, 否则显示结果态
  const results = ref<null | UserPasswordResult[]>(null);

  // 批量结果表格列定义
  const columns = computed(() => [
    // 账号
    { title: $t('common.account'), dataIndex: 'account', width: 150 },
    // 姓名
    { title: $t('common.name'), dataIndex: 'name', width: 100, ellipsis: true },
    // 新密码
    { title: $t('common.newPassword'), dataIndex: 'password' },
    // 操作
    { title: $t('common.operation'), key: 'operation', width: 70 },
  ]);

  /**
   * 显示弹窗
   */
  function show(ids: string[]) {
    userIds.value = ids;
    results.value = null;
    visible.value = true;
  }

  function handleClose() {
    visible.value = false;
    // 结果态关闭时通知父组件刷新列表(清空勾选等); 明文密码关闭后无法再次查看
    if (results.value) {
      emit('ok');
    }
  }

  /**
   * 确认重置: 不传密码, 由后端按密码策略生成随机密码并一次性返回明文
   */
  async function handleOk() {
    loading.value = true;
    try {
      // 单条返回对象, 批量返回数组, 统一为数组便于渲染
      let list: UserPasswordResult[];
      if (userIds.value.length === 1) {
        const { data } = await MerchantUserApi.restartPassword(userIds.value[0]!);
        list = [data!];
      } else {
        const { data } = await MerchantUserApi.restartPasswordBatch(userIds.value);
        list = data!;
      }
      results.value = list;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 复制指定文本到剪贴板
   */
  async function handleCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      message.success($t('common.copySuccess'));
    } catch {
      message.error($t('common.copyFail'));
    }
  }

  /**
   * 批量复制全部账号与初始密码, 每行"账号 密码"
   */
  function handleCopyAll() {
    const text = results.value!.map((item) => `${item.account} ${item.password}`).join('\n');
    handleCopy(text);
  }

  defineExpose({ show });
</script>

<template>
  <!-- 国际化：重置密码 -->
  <a-modal
    v-model:open="visible"
    :title="results ? $t('common.passwordGenerated') : $t('iam.user.action.resetPassword')"
    :width="results && results.length > 1 ? 640 : 500"
    :confirm-loading="loading"
    :destroy-on-hidden="true"
    :mask-closable="false"
    :ok-text="$t('iam.user.action.resetPassword')"
    @ok="handleOk"
    @cancel="handleClose"
  >
    <!-- 确认态: 警示后二次确认 -->
    <div v-if="!results" class="mb-2">
      <a-alert :message="$t('common.resetPasswordNotice')" show-icon type="warning" />
    </div>
    <!-- 结果态: 展示生成的初始密码 -->
    <template v-else>
      <div class="mb-4">
        <a-alert :message="$t('common.passwordGeneratedTip')" show-icon type="success" />
      </div>
      <!-- 单条: 账号与初始密码 -->
      <div v-if="results.length === 1" class="password-panel">
        <div class="password-row">
          <span class="password-label">{{ $t('common.account') }}</span>
          <span class="password-value">{{ results[0]!.account }}</span>
        </div>
        <div class="password-row">
          <span class="password-label">{{ $t('common.newPassword') }}</span>
          <span class="password-value password-mono">{{ results[0]!.password }}</span>
          <a-button type="link" size="small" @click="handleCopy(results[0]!.password!)">
            {{ $t('common.copy') }}
          </a-button>
        </div>
      </div>
      <!-- 批量: 每个用户独立的随机密码 -->
      <a-table
        v-else
        :columns="columns"
        :data-source="results"
        :pagination="false"
        :row-key="(record: UserPasswordResult) => record.userId!"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operation'">
            <a-button type="link" size="small" @click="handleCopy((record as UserPasswordResult).password!)">
              {{ $t('common.copy') }}
            </a-button>
          </template>
          <template v-else-if="column.dataIndex === 'password'">
            <span class="password-mono">{{ (record as UserPasswordResult).password }}</span>
          </template>
        </template>
      </a-table>
    </template>
    <!-- 结果态自定义底部: 批量时提供复制全部 -->
    <template v-if="results" #footer>
      <a-space>
        <a-button v-if="results.length > 1" type="primary" @click="handleCopyAll">
          {{ $t('common.copyAll') }}
        </a-button>
        <a-button @click="handleClose">{{ $t('common.close') }}</a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<style lang="less" scoped>
  .password-panel {
    padding: 12px 16px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 8px;
  }

  .password-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
  }

  .password-label {
    width: 64px;
    color: rgba(0, 0, 0, 0.45);
  }

  .password-value {
    font-weight: 500;
  }

  .password-mono {
    font-family: ui-monospace, sfmono-regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .dark .password-label {
    color: rgba(255, 255, 255, 0.45);
  }

  .dark .password-panel {
    border-color: rgba(255, 255, 255, 0.08);
  }
</style>
