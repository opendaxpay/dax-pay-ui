<script lang="ts" setup>
  import type { MqttConfig } from '#/api/system/mqtt-config.api';

  import { onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { MqttConfigApi } from '#/api/system/mqtt-config.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  /**
   * 平台 MQTT 接入配置(设备端播报管道)
   *
   * 三字段: broker WSS 地址 + 静态设备账号/密码; 该地址随设备激活下发到 APP,
   * 配置错误设备将无法接收播报, 修改后需与 broker 侧账号保持一致。
   */
  defineOptions({ name: 'MqttConfigForm' });

  const { confirm, message } = useMessage();
  const { diffForm } = useFormEdit();

  const formRef = ref();
  const loading = ref(false);
  const saving = ref(false);
  // 是否处于编辑状态
  const isEditing = ref(false);
  // 记录原始值(仅用于检测变化)
  const originalValues = ref<MqttConfig>({});
  // 表单数据
  const formState = ref<MqttConfig>({});

  // 表单校验规则
  const formRules = {
    // 接入地址(须为含路径的完整 ws/wss 地址)
    brokerWssUrl: [
      { required: true, message: $t('system.platform.mqtt.inputBrokerWssUrl') },
      {
        pattern: /^wss?:\/\/\S+$/,
        message: $t('system.platform.mqtt.urlPatternWarning'),
      },
    ],
    // 接入账号
    mqttUsername: [{ required: true, message: $t('system.platform.mqtt.inputUsername') }],
    // 接入密码
    mqttPassword: [{ required: true, message: $t('system.platform.mqtt.inputPassword') }],
  };

  onMounted(() => {
    loadConfig();
  });

  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await MqttConfigApi.get();
      if (data) {
        formState.value = data;
        // 记录原始值, 用于后续比较
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
   * 取消编辑, 重新加载数据
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
    formRef.value
      ?.validate()
      .then(() => {
        confirm({
          title: $t('common.confirm'),
          content: $t('system.platform.mqtt.confirmSaveContent'),
          okText: $t('common.okText'),
          cancelText: $t('common.cancelText'),
          onOk: async () => {
            saving.value = true;
            try {
              const submitData: MqttConfig = {
                ...formState.value,
                ...diffForm(originalValues, formState),
              };
              await MqttConfigApi.update(submitData);
              message.success($t('common.saveSuccess'));
              isEditing.value = false;
              // 重新加载以获取最新数据
              await loadConfig();
            } finally {
              saving.value = false;
            }
          },
        });
      })
      .catch(() => {});
  }

  // 供外壳 PageShell 常驻 header 渲染编辑操作(标题/描述由外壳 tabs 数据提供)
  defineExpose({
    isEditing,
    saving,
    handleEdit,
    handleCancel,
    handleSave,
  });
</script>

<template>
  <a-spin :spinning="loading" class="w-full">
    <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical" class="module-form">
      <div class="config-section">
        <a-form-item name="brokerWssUrl">
          <div class="config-item config-item--block">
            <div class="config-item__main">
              <!-- MQTT 接入地址 -->
              <div class="config-item__label">{{ $t('system.platform.mqtt.brokerWssUrl') }}</div>
              <div class="config-item__desc">{{ $t('system.platform.mqtt.brokerWssUrlDesc') }}</div>
            </div>
            <a-input
              v-model:value="formState.brokerWssUrl"
              :disabled="!isEditing"
              :placeholder="$t('system.platform.mqtt.inputBrokerWssUrl')"
            />
          </div>
        </a-form-item>

        <a-form-item name="mqttUsername">
          <div class="config-item config-item--block">
            <div class="config-item__main">
              <!-- 接入账号 -->
              <div class="config-item__label">{{ $t('system.platform.mqtt.username') }}</div>
              <div class="config-item__desc">{{ $t('system.platform.mqtt.usernameDesc') }}</div>
            </div>
            <a-input
              v-model:value="formState.mqttUsername"
              :disabled="!isEditing"
              :placeholder="$t('system.platform.mqtt.inputUsername')"
            />
          </div>
        </a-form-item>

        <a-form-item name="mqttPassword">
          <div class="config-item config-item--block">
            <div class="config-item__main">
              <!-- 接入密码 -->
              <div class="config-item__label">{{ $t('system.platform.mqtt.password') }}</div>
              <div class="config-item__desc">{{ $t('system.platform.mqtt.passwordDesc') }}</div>
            </div>
            <a-input
              v-model:value="formState.mqttPassword"
              :disabled="!isEditing"
              :placeholder="$t('system.platform.mqtt.inputPassword')"
            />
          </div>
        </a-form-item>
      </div>
    </a-form>
  </a-spin>
</template>
