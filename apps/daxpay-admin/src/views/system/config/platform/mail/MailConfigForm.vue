<script lang="ts" setup>
  import { onMounted, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type MailConfig,
    MailConfigApi,
  } from '#/api/system/mail-config.api';
  import { MailRecordApi } from '#/api/system/notify/mail-record.api';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';
  import { getRawSystemName } from '#/logics/init-website-config';

  const { confirm, message } = useMessage();
  const { diffForm } = useFormEdit();

  const formRef = ref();
  const loading = ref(false);
  const saving = ref(false);
  // 是否处于编辑状态
  const isEditing = ref(false);
  // 记录原始值，用于检测敏感字段是否被修改
  const originalValues = ref<MailConfig>({});
  // 表单数据
  const formState = ref<MailConfig>({});

  // 测试发送弹窗状态
  const testModal = reactive({
    visible: false,
    receiverEmail: '',
    // 发送按钮 loading
    sending: false,
  });

  // 加密方式选项
  const securityOptions = [
    { label: $t('system.platform.mail.security.ssl'), value: 'ssl' },
    { label: $t('system.platform.mail.security.starttls'), value: 'starttls' },
    { label: $t('system.platform.mail.security.none'), value: 'none' },
  ];

  // 表单校验规则
  const formRules = {
    // SMTP服务器地址
    host: [{ required: true, message: $t('system.platform.mail.inputHost') }],
    // SMTP服务器端口
    port: [{ required: true, message: $t('system.platform.mail.inputPort') }],
    // 发件邮箱账号
    username: [
      { required: true, message: $t('system.platform.mail.inputUsername') },
    ],
    // SMTP授权码
    password: [
      { required: true, message: $t('system.platform.mail.inputPassword') },
    ],
  };

  // 测试发送表单校验规则
  const testRules = {
    receiverEmail: [
      { required: true, message: $t('system.notify.mail.inputTestEmail') },
      { type: 'email', message: $t('system.notify.mail.emailInvalid') },
    ],
  };

  onMounted(() => {
    loadConfig();
  });

  async function loadConfig() {
    loading.value = true;
    try {
      const { data } = await MailConfigApi.get();
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
        content: $t('system.platform.mail.confirmSaveContent'),
        okText: $t('common.okText'),
        onOk: async () => {
          saving.value = true;
          try {
            // 使用diffForm处理敏感字段，未修改的字段返回undefined
            const sensitiveData = diffForm(
              originalValues,
              formState,
              'password',
            );
            const submitData: MailConfig = {
              ...formState.value,
              ...sensitiveData,
            };
            await MailConfigApi.update(submitData);
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
   * 打开测试发送弹窗
   */
  function handleOpenTest() {
    testModal.receiverEmail = '';
    testModal.visible = true;
  }

  /**
   * 发送测试邮件(使用库中已保存的配置, 未保存的修改不生效)
   */
  function handleTestSend() {
    testModal.sending = true;
    MailRecordApi.testSend({
      receiverEmail: testModal.receiverEmail,
    })
      .then(() => {
        message.success($t('system.platform.mail.testSendSuccess'));
        testModal.visible = false;
      })
      .finally(() => {
        testModal.sending = false;
      });
  }
</script>

<template>
  <div class="mail-config-page">
    <a-spin :spinning="loading" class="w-full">
      <div class="module-overview">
        <div class="module-overview__header">
          <!-- 邮件配置标题 -->
          <div class="module-overview__title">
            {{ $t('system.platform.mail.title') }}
          </div>
          <div class="module-actions">
            <a-space>
              <!-- 测试发送: 使用已保存配置, 编辑/只读均可 -->
              <a-button :loading="testModal.sending" @click="handleOpenTest">
                {{ $t('system.platform.mail.testSend') }}
              </a-button>
              <!-- 非编辑状态：显示编辑按钮 -->
              <template v-if="!isEditing">
                <a-button type="primary" @click="handleEdit">
                  {{ $t('common.edit') }}
                </a-button>
              </template>
              <!-- 编辑状态：显示取消和确认按钮 -->
              <template v-else>
                <a-button @click="handleCancel">
                  {{ $t('common.cancel') }}
                </a-button>
                <a-button type="primary" :loading="saving" @click="handleSave">
                  {{ $t('common.save') }}
                </a-button>
              </template>
            </a-space>
          </div>
        </div>
        <!-- 邮件配置描述 -->
        <div class="module-overview__desc">
          {{ $t('system.platform.mail.description') }}
        </div>
      </div>

      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        layout="vertical"
        class="module-form"
      >
        <!-- 通道开关 -->
        <div class="config-section">
          <div class="config-section__title">
            {{ $t('system.platform.mail.section.channel') }}
          </div>
          <div class="config-item">
            <div class="config-item__main">
              <!-- 通道开关 -->
              <div class="config-item__label">
                {{ $t('system.platform.mail.enabled') }}
              </div>
              <div class="config-item__desc">
                {{ $t('system.platform.mail.enabledDesc') }}
              </div>
            </div>
            <a-switch v-model:checked="formState.enabled" :disabled="!isEditing" />
          </div>
        </div>

        <!-- 服务器配置 -->
        <div class="config-section">
          <div class="config-section__title">
            {{ $t('system.platform.mail.section.server') }}
          </div>

          <div class="config-grid">
            <a-form-item name="host">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 服务器地址 -->
                  <div class="config-item__label">
                    {{ $t('system.platform.mail.host') }}
                  </div>
                  <div class="config-item__desc">
                    {{ $t('system.platform.mail.hostDesc') }}
                  </div>
                </div>
                <!-- 国际化：请输入SMTP服务器地址 -->
                <a-input
                  v-model:value="formState.host"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.mail.inputHost')"
                />
              </div>
            </a-form-item>

            <a-form-item name="port">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 服务器端口 -->
                  <div class="config-item__label">
                    {{ $t('system.platform.mail.port') }}
                  </div>
                  <div class="config-item__desc">
                    {{ $t('system.platform.mail.portDesc') }}
                  </div>
                </div>
                <div class="number-field">
                  <!-- 国际化：请输入SMTP服务器端口 -->
                  <a-input-number
                    v-model:value="formState.port"
                    :disabled="!isEditing"
                    :placeholder="$t('system.platform.mail.inputPort')"
                    :min="1"
                    :max="65_535"
                    :precision="0"
                    style="width: 180px"
                  />
                </div>
              </div>
            </a-form-item>
          </div>

          <a-form-item name="securityType">
            <div class="config-item">
              <div class="config-item__main">
                <!-- 传输加密方式 -->
                <div class="config-item__label">
                  {{ $t('system.platform.mail.securityType') }}
                </div>
                <div class="config-item__desc">
                  {{ $t('system.platform.mail.securityTypeDesc') }}
                </div>
              </div>
              <!-- 加密方式单选(实心填充) -->
              <a-radio-group
                v-model:value="formState.securityType"
                :disabled="!isEditing"
                button-style="solid"
              >
                <a-radio-button
                  v-for="opt in securityOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </a-radio-button>
              </a-radio-group>
            </div>
          </a-form-item>

          <a-form-item name="timeout">
            <div class="config-item">
              <div class="config-item__main">
                <!-- 超时时间 -->
                <div class="config-item__label">
                  {{ $t('system.platform.mail.timeout') }}
                </div>
                <div class="config-item__desc">
                  {{ $t('system.platform.mail.timeoutDesc') }}
                </div>
              </div>
              <div class="number-field">
                <a-input-number
                  v-model:value="formState.timeout"
                  :disabled="!isEditing"
                  :min="1"
                  :max="120"
                  :precision="0"
                  style="width: 180px"
                />
                <!-- 单位：秒 -->
                <span class="number-field__suffix">
                  {{ $t('system.platform.mail.unit.seconds') }}
                </span>
              </div>
            </div>
          </a-form-item>
        </div>

        <!-- 发件身份配置 -->
        <div class="config-section">
          <div class="config-section__title">
            {{ $t('system.platform.mail.section.sender') }}
          </div>

          <div class="config-grid">
            <a-form-item name="username">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 发件邮箱账号 -->
                  <div class="config-item__label">
                    {{ $t('system.platform.mail.username') }}
                  </div>
                  <div class="config-item__desc">
                    {{ $t('system.platform.mail.usernameDesc') }}
                  </div>
                </div>
                <!-- 国际化：请输入发件邮箱账号 -->
                <a-input
                  v-model:value="formState.username"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.mail.inputUsername')"
                />
              </div>
            </a-form-item>

            <a-form-item name="password">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- SMTP授权码 -->
                  <div class="config-item__label">
                    {{ $t('system.platform.mail.password') }}
                  </div>
                  <div class="config-item__desc">
                    {{ $t('system.platform.mail.passwordDesc') }}
                  </div>
                </div>
                <!-- 国际化：请输入SMTP授权码 -->
                <a-input-password
                  v-model:value="formState.password"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.mail.inputPassword')"
                />
              </div>
            </a-form-item>
          </div>

          <div class="config-grid">
            <a-form-item name="from">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 发件地址 -->
                  <div class="config-item__label">
                    {{ $t('system.platform.mail.from') }}
                  </div>
                  <div class="config-item__desc">
                    {{ $t('system.platform.mail.fromDesc') }}
                  </div>
                </div>
                <!-- 国际化：请输入发件地址 -->
                <a-input
                  v-model:value="formState.from"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.mail.inputFrom')"
                />
              </div>
            </a-form-item>

            <a-form-item name="nickname">
              <div class="config-item config-item--block">
                <div class="config-item__main">
                  <!-- 发件人显示名 -->
                  <div class="config-item__label">
                    {{ $t('system.platform.mail.nickname') }}
                  </div>
                  <div class="config-item__desc">
                    <!-- 示例品牌名走站点配置, 词条 {name} 插值 -->
                    {{ $t('system.platform.mail.nicknameDesc', { name: getRawSystemName() }) }}
                  </div>
                </div>
                <!-- 国际化：请输入发件人显示名 -->
                <a-input
                  v-model:value="formState.nickname"
                  :disabled="!isEditing"
                  :placeholder="$t('system.platform.mail.inputNickname')"
                />
              </div>
            </a-form-item>
          </div>
        </div>
      </a-form>
    </a-spin>

    <!-- 测试发送弹窗 -->
    <a-modal
      v-model:open="testModal.visible"
      :title="$t('system.platform.mail.testSend')"
      :confirm-loading="testModal.sending"
      :ok-text="$t('system.platform.mail.testSend')"
      :cancel-text="$t('common.cancel')"
      @ok="handleTestSend"
    >
      <a-form :model="testModal" :rules="testRules" layout="vertical">
        <a-form-item
          name="receiverEmail"
          :label="$t('system.notify.mail.testEmail')"
          :extra="$t('system.notify.mail.testEmailExtra')"
        >
          <a-input
            v-model:value="testModal.receiverEmail"
            :placeholder="$t('system.notify.mail.inputTestEmail')"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
  .mail-config-page {
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

  .module-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 12px;
  }

  .module-form :deep(.ant-form-item) {
    margin-bottom: 0;
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
