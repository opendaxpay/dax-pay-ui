<script lang="ts" setup>
  import { ref } from 'vue';

  import { Page } from '@vben/common-ui';
  import { $t } from '@vben/locales';

  import { useMessage } from '#/hooks/useMessage';

  type NotificationType = 'error' | 'info' | 'success' | 'warning';

  const { confirm, message, notification } = useMessage();

  // 日期选择器值
  const selectedDate = ref<string>('');
  const selectedTime = ref<string>('');
  const selectedDateTime = ref<string>('');

  function info() {
    message.info('How many roads must a man walk down');
  }

  function error() {
    message.error({
      content: 'Once upon a time you dressed so fine',
      duration: 2.5,
    });
  }

  function warning() {
    message.warning('How many roads must a man walk down');
  }

  function success() {
    message.success('Cause you walked hand in hand With another man in my place');
  }

  function notify(type: NotificationType) {
    notification[type]({
      duration: 2.5,
      // 国际化：提示消息
      title: $t('demos.antd.notificationTitle'),
      type,
    });
  }

  function showConfirm() {
    confirm({
      // 国际化：确认操作
      title: $t('demos.antd.confirmTitle'),
      // 国际化：这是一个通过 useMessage 调起的确认框示例。
      content: $t('demos.antd.confirmContent'),
      okText: $t('common.okText'),
      cancelText: $t('common.cancelText'),
      onOk: async () => {
        // 国际化：已确认
        message.success($t('demos.antd.confirmed'));
      },
    });
  }
</script>

<template>
  <!-- 国际化：支持多语言，主题功能集成切换等 -->
  <Page :description="$t('demos.antd.description')" :title="$t('demos.antd.title')">
    <!-- 国际化：时间输入组件 -->
    <a-card class="mb-5" :title="$t('demos.antd.inputDemo')">
      <a-form layout="inline">
        <a-form-item :label="$t('demos.antd.datePicker')">
          <a-date-picker
            v-model:value="selectedDate"
            :placeholder="$t('demos.antd.datePicker')"
            value-format="YYYY-MM-DD"
          />
        </a-form-item>
        <a-form-item :label="$t('demos.antd.timePicker')">
          <a-time-picker
            v-model:value="selectedTime"
            :placeholder="$t('demos.antd.timePicker')"
            value-format="HH:mm:ss"
          />
        </a-form-item>
        <a-form-item :label="$t('demos.antd.dateTimePicker')">
          <a-date-picker
            v-model:value="selectedDateTime"
            :placeholder="$t('demos.antd.dateTimePicker')"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </a-form-item>
      </a-form>
    </a-card>
    <!-- 国际化：Message -->
    <a-card class="mb-5" :title="$t('demos.antd.message')">
      <a-space>
        <!-- 国际化：信息 -->
        <a-button @click="info"> {{ $t('demos.antd.info') }} </a-button>
        <!-- 国际化：错误 -->
        <a-button danger @click="error"> {{ $t('demos.antd.error') }} </a-button>
        <!-- 国际化：警告 -->
        <a-button @click="warning"> {{ $t('demos.antd.warning') }} </a-button>
        <!-- 国际化：成功 -->
        <a-button @click="success"> {{ $t('demos.antd.success') }} </a-button>
      </a-space>
    </a-card>

    <!-- 国际化：Notification -->
    <a-card class="mb-5" :title="$t('demos.antd.notification')">
      <a-space>
        <!-- 国际化：信息 -->
        <a-button @click="notify('info')"> {{ $t('demos.antd.info') }} </a-button>
        <!-- 国际化：错误 -->
        <a-button danger @click="notify('error')"> {{ $t('demos.antd.error') }} </a-button>
        <!-- 国际化：警告 -->
        <a-button @click="notify('warning')"> {{ $t('demos.antd.warning') }} </a-button>
        <!-- 国际化：成功 -->
        <a-button @click="notify('success')"> {{ $t('demos.antd.success') }} </a-button>
      </a-space>
    </a-card>

    <!-- 国际化：Dialog -->
    <a-card class="mb-5" :title="$t('demos.antd.dialog')">
      <a-space>
        <!-- 国际化：打开确认框 -->
        <a-button type="primary" @click="showConfirm"> {{ $t('demos.antd.openConfirm') }} </a-button>
      </a-space>
    </a-card>
  </Page>
</template>
