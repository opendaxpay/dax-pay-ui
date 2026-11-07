<script lang="ts" setup>
  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    ChannelTerminalApi,
    type ChannelTerminalParam,
    type ChannelTerminalResult,
    TerminalDeviceApi,
    type TerminalDeviceResult,
    type TerminalExtraField,
  } from '#/api/payment/device/terminal.api';
  import { FormEditType } from '#/enums/formEditType';
  import { channelTerminalStatusColorMap } from '#/enums/payment/channelEnum';
  import { useFormEdit } from '#/hooks/useFormEdit';
  import { useMessage } from '#/hooks/useMessage';

  const emit = defineEmits(['ok']);

  const { message } = useMessage();
  const formRef = ref();
  const { visible, confirmLoading, title, initFormEditType, handleCancel, addable } = useFormEdit();

  // 通道商户上下文(新增时锁定)
  const context = ref<{ channelMchNo: string; mchNo: string; product: string }>({
    mchNo: '',
    channelMchNo: '',
    product: '',
  });
  const editReadonly = ref<{
    channelMchNo?: string;
    outTerminalNo?: string;
    status?: string;
    type?: string;
  }>({});

  // 通道差异化报备参数字段定义(按后端策略元数据渲染结构化表单, 不向用户暴露 JSON)
  const extraFields = ref<TerminalExtraField[]>([]);
  // 结构化报备参数的编辑态(键=字段定义 key)
  const extraForm = ref<Record<string, any>>({});
  // 原始 extra JSON(保留未在表单中声明的键, 保存时合并回写)
  const baseExtra = ref<Record<string, any>>({});

  // 系统终端下拉候选(新增必选)
  const terminalOptions = ref<TerminalDeviceResult[]>([]);
  // 编辑时已绑定的系统终端(只读展示)
  const boundSystemTerminals = ref<TerminalDeviceResult[]>([]);

  const formState = ref<ChannelTerminalParam>({
    name: '',
    type: 'common',
  });

  // 报送类型(前端 dict.json)
  const typeOptions = computed(() => [
    { label: $t('dict.terminal_type.common'), value: 'common' },
    { label: $t('dict.terminal_type.wechat'), value: 'wechat' },
    { label: $t('dict.terminal_type.alipay'), value: 'alipay' },
    { label: $t('dict.terminal_type.union'), value: 'union' },
  ]);

  /**
   * 状态文案
   */
  function statusLabel(status?: string) {
    if (!status) {
      return '-';
    }
    return $t(`dict.channel_terminal_status.${status}`);
  }

  // 系统终端下拉选项(仅启用终端)
  const systemTerminalSelectOptions = computed(() =>
    terminalOptions.value
      .filter((i) => i.enable !== false)
      .map((i) => ({ label: `${i.name || '-'} (${i.terminalNo})`, value: i.terminalNo })),
  );

  const formRules = computed(() => ({
    type: [{ required: true, message: $t('payment.device.terminal.validateType') }],
    name: [{ required: true, message: $t('payment.device.terminal.validateName') }],
    // 新增时必须选择系统终端(建档即绑定)
    systemTerminalNo: addable.value
      ? [{ required: true, message: $t('payment.device.terminal.validateSystemTerminal') }]
      : [],
  }));

  function resetForm() {
    formState.value = {
      name: '',
      type: 'common',
      mchNo: context.value.mchNo,
      channelMchNo: context.value.channelMchNo,
    };
    editReadonly.value = {};
    boundSystemTerminals.value = [];
    extraFields.value = [];
    extraForm.value = {};
    baseExtra.value = {};
    formRef.value?.resetFields();
  }

  /**
   * 加载通道报备参数字段定义(结构化表单渲染用)
   */
  async function loadExtraFields(product: string) {
    if (!product) {
      extraFields.value = [];
      return;
    }
    const { data } = await ChannelTerminalApi.extraFields(product);
    extraFields.value = data || [];
  }

  /**
   * 解析 extra JSON(非法/空返回空对象)
   */
  function parseExtraJson(extra?: string): Record<string, any> {
    if (!extra) {
      return {};
    }
    try {
      const parsed = JSON.parse(extra);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  /**
   * 组装结构化报备参数为 extra JSON(空值剔除; 未声明字段原样保留)
   */
  function buildExtraJson(): string | undefined {
    const merged: Record<string, any> = { ...baseExtra.value };
    for (const field of extraFields.value) {
      const value = extraForm.value[field.key];
      if (value === undefined || value === null || value === '') {
        delete merged[field.key];
      } else {
        merged[field.key] = value;
      }
    }
    return Object.keys(merged).length > 0 ? JSON.stringify(merged) : undefined;
  }

  /**
   * 加载商户下系统终端下拉候选
   */
  async function loadTerminalOptions(mchNo: string) {
    if (!mchNo) {
      terminalOptions.value = [];
      return;
    }
    const { data } = await TerminalDeviceApi.listByMchNo(mchNo);
    terminalOptions.value = data || [];
  }

  /**
   * 打开新增(通道商户上下文已锁定)
   */
  function showAdd(ctx: { channelMchNo: string; mchNo: string; product?: string }) {
    context.value = { channelMchNo: ctx.channelMchNo, mchNo: ctx.mchNo, product: ctx.product || '' };
    initFormEditType(FormEditType.Add);
    resetForm();
    visible.value = true;
    loadTerminalOptions(ctx.mchNo);
    loadExtraFields(context.value.product);
  }

  /**
   * 打开编辑
   */
  async function showEdit(record: ChannelTerminalResult) {
    context.value = {
      mchNo: record.mchNo || '',
      channelMchNo: record.channelMchNo || '',
      product: record.product || '',
    };
    initFormEditType(FormEditType.Edit);
    resetForm();
    confirmLoading.value = true;
    visible.value = true;
    try {
      const [detailRes] = await Promise.all([
        ChannelTerminalApi.get(record.id!),
        loadTerminalOptions(context.value.mchNo),
        loadExtraFields(context.value.product),
      ]);
      const row = detailRes.data || record;
      formState.value = {
        id: row.id!,
        mchNo: row.mchNo,
        channelMchNo: row.channelMchNo,
        type: row.type,
        name: row.name,
        extra: row.extra,
        remark: row.remark,
      };
      boundSystemTerminals.value = row.systemTerminals || [];
      // 解析已有 extra 填充结构化表单(未知键在 baseExtra 保留, 保存时合并回写)
      baseExtra.value = parseExtraJson(row.extra);
      extraForm.value = { ...baseExtra.value };
      // 登记状态/通道侧终端号由「手动调整」维护, 编辑态只读回显
      editReadonly.value = {
        channelMchNo: row.channelMchNo,
        type: row.type,
        status: row.status,
        outTerminalNo: row.outTerminalNo,
      };
    } finally {
      confirmLoading.value = false;
    }
  }

  /**
   * 保存
   */
  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    // 报备参数: 有通道字段定义时按结构化表单组装(不暴露 JSON);
    // 无字段定义的通道回退为 JSON 文本域, 填了必须是合法 JSON 对象
    if (extraFields.value.length > 0) {
      formState.value.extra = buildExtraJson();
    } else {
      const extraText = formState.value.extra?.trim();
      if (extraText) {
        try {
          const parsed = JSON.parse(extraText);
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            message.warning($t('payment.device.terminal.extraJsonObjectRequired'));
            return;
          }
        } catch {
          message.warning($t('payment.device.terminal.extraJsonInvalid'));
          return;
        }
      }
    }
    confirmLoading.value = true;
    try {
      await (addable.value
        ? // 新增: 选择系统终端建档即绑定, 登记状态初始为 init
          ChannelTerminalApi.add({
            ...formState.value,
            mchNo: context.value.mchNo,
            channelMchNo: context.value.channelMchNo,
            status: 'init',
          })
        : // 编辑仅维护基础信息(名称/报备参数/备注); 通道侧终端号与登记状态走「手动调整」
          ChannelTerminalApi.update({
            id: formState.value.id,
            name: formState.value.name,
            extra: formState.value.extra,
            remark: formState.value.remark,
          }));
      message.success($t('common.operationSuccess'));
      handleCancel();
      emit('ok');
    } finally {
      confirmLoading.value = false;
    }
  }

  defineExpose({ showAdd, showEdit });
</script>

<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :confirm-loading="confirmLoading"
    :destroy-on-hidden="true"
    :width="640"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <!-- 通道商户号只读展示 -->
      <a-form-item :label="$t('payment.device.terminal.field.channelMchNo')">
        <a-input :value="addable ? context.channelMchNo : editReadonly.channelMchNo" disabled />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.systemTerminal')" name="systemTerminalNo">
        <template v-if="addable">
          <!-- 新增必选(建档即绑定) -->
          <a-select
            v-model:value="formState.systemTerminalNo"
            :options="systemTerminalSelectOptions"
            :placeholder="$t('payment.device.terminal.pleaseSelectTerminal')"
            show-search
            option-filter-prop="label"
            allow-clear
          />
        </template>
        <template v-else>
          <!-- 编辑态只读展示, 不提供改绑 -->
          <template v-if="boundSystemTerminals.length > 0">
            <a-tag v-for="term in boundSystemTerminals" :key="term.terminalNo">
              {{ term.name || '-' }} ({{ term.terminalNo }})
            </a-tag>
          </template>
          <span v-else>-</span>
          <div class="text-xs text-muted-foreground">{{ $t('payment.device.terminal.bindReadOnlyTip') }}</div>
        </template>
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.type')" name="type">
        <a-select
          v-model:value="formState.type"
          :options="typeOptions"
          :disabled="!addable"
          :placeholder="$t('common.pleaseSelect')"
        />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.name')" name="name">
        <a-input v-model:value="formState.name" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
      <!-- 编辑态只读回显登记状态与通道侧终端号(由「手动调整」维护) -->
      <a-form-item v-if="!addable" :label="$t('payment.device.terminal.field.status')">
        <a-tag :color="channelTerminalStatusColorMap[editReadonly.status || ''] || 'default'">
          {{ statusLabel(editReadonly.status) }}
        </a-tag>
      </a-form-item>
      <a-form-item v-if="!addable" :label="$t('payment.device.terminal.field.outTerminalNo')">
        <span>{{ editReadonly.outTerminalNo || '-' }}</span>
      </a-form-item>
      <!-- 通道差异化报备参数: 有字段定义时按结构化表单展示(标签为通道协议字段名, 随策略下发), 否则回退 JSON 文本域 -->
      <template v-if="extraFields.length > 0">
        <a-form-item v-for="field in extraFields" :key="field.key" :label="field.label">
          <a-input
            v-if="field.type !== 'textarea'"
            v-model:value="extraForm[field.key]"
            :placeholder="field.placeholder || $t('common.pleaseInput')"
            allow-clear
          />
          <a-textarea
            v-else
            v-model:value="extraForm[field.key]"
            :rows="2"
            :placeholder="field.placeholder || $t('common.pleaseInput')"
          />
          <div v-if="field.desc" class="text-xs text-muted-foreground">{{ field.desc }}</div>
        </a-form-item>
      </template>
      <a-form-item v-else :label="$t('payment.device.terminal.field.extra')" name="extra">
        <a-textarea
          v-model:value="formState.extra"
          :rows="3"
          :placeholder="$t('payment.device.terminal.extraPlaceholder')"
        />
      </a-form-item>
      <a-form-item :label="$t('payment.device.terminal.field.remark')" name="remark">
        <a-textarea v-model:value="formState.remark" :rows="3" :placeholder="$t('common.pleaseInput')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
