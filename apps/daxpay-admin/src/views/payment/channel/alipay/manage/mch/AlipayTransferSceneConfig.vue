<script lang="ts" setup>
  import type {
    AlipayTransferSceneConfig,
    AlipayTransferSceneConfigParam,
  } from '#/api/payment/channel/alipay/transfer-scene.api';

  import { nextTick, reactive, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { ALIPAY_TRANSFER_SCENES, AlipayTransferSceneApi } from '#/api/payment/channel/alipay/transfer-scene.api';
  import { useMessage } from '#/hooks/useMessage';

  defineOptions({ name: 'AlipayTransferSceneConfig' });

  const { confirm, message } = useMessage();

  // 列表抽屉显隐
  const listVisible = ref(false);
  // 表单 Modal 显隐
  const formVisible = ref(false);

  const mchNo = ref('');
  const channelMchNo = ref('');
  const loading = ref(false);
  const dataList = ref<AlipayTransferSceneConfig[]>([]);
  // 表单
  const formRef = ref();
  const saving = ref(false);
  const isEdit = ref(false);
  const form = reactive<AlipayTransferSceneConfigParam>(createEmptyForm());

  // 表单校验规则
  const rules = {
    sceneName: [
      {
        required: true,
        message: $t('common.pleaseSelect'),
        trigger: 'change',
      },
    ],
  };

  /** 空表单 */
  function createEmptyForm(): AlipayTransferSceneConfigParam {
    return {
      id: undefined,
      mchNo: '',
      channelMchNo: '',
      sceneName: '',
      isDefault: false,
      remark: '',
    };
  }

  /** 打开列表(由商户管理页卡片点击调用) */
  function open(no: string, cMchNo: string) {
    mchNo.value = no;
    channelMchNo.value = cMchNo;
    listVisible.value = true;
    loadData();
  }

  /** 加载场景列表 */
  async function loadData() {
    loading.value = true;
    try {
      const { data } = await AlipayTransferSceneApi.list(mchNo.value, channelMchNo.value);
      dataList.value = data ?? [];
    } finally {
      loading.value = false;
    }
  }

  /** 打开新增表单 */
  function handleAdd() {
    isEdit.value = false;
    Object.assign(form, createEmptyForm());
    form.mchNo = mchNo.value;
    form.channelMchNo = channelMchNo.value;
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
  }

  /** 打开编辑表单 */
  function handleEdit(row: AlipayTransferSceneConfig) {
    isEdit.value = true;
    Object.assign(form, createEmptyForm());
    form.id = row.id ?? undefined;
    form.mchNo = mchNo.value;
    form.channelMchNo = channelMchNo.value;
    form.sceneName = row.sceneName ?? '';
    form.isDefault = row.isDefault ?? false;
    form.remark = row.remark ?? '';
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
  }

  /** 提交新增/编辑 */
  function handleSubmit() {
    formRef.value?.validate().then(async () => {
      saving.value = true;
      try {
        await (isEdit.value ? AlipayTransferSceneApi.update(form) : AlipayTransferSceneApi.save(form));
        message.success($t('common.saveSuccess'));
        formVisible.value = false;
        await loadData();
      } finally {
        saving.value = false;
      }
    });
  }

  /** 设为默认 */
  function handleSetDefault(row: AlipayTransferSceneConfig) {
    const id = row.id;
    if (!id) return;
    // 设默认确认
    confirm({
      content: $t('payment.merchant.channelMerchant.transferSceneSetDefaultConfirm'),
      onOk: async () => {
        await AlipayTransferSceneApi.setDefault(mchNo.value, id);
        message.success($t('common.saveSuccess'));
        await loadData();
      },
    });
  }

  /** 删除 */
  function handleDelete(row: AlipayTransferSceneConfig) {
    const id = row.id;
    if (!id) return;
    // 删除确认
    confirm({
      content: $t('common.confirmDelete'),
      onOk: async () => {
        await AlipayTransferSceneApi.delete(id);
        message.success($t('common.deleteSuccess'));
        await loadData();
      },
    });
  }

  defineExpose({ open });
</script>

<template>
  <!-- 列表抽屉 -->
  <a-drawer
    v-model:open="listVisible"
    :title="$t('payment.merchant.channelMerchant.transferSceneManage')"
    :size="960"
    destroy-on-hidden
  >
    <div class="mb-3">
      <a-alert type="info" :show-icon="true" :message="$t('payment.merchant.channelMerchant.transferSceneTip')" />
    </div>
    <div class="mb-3">
      <a-button type="primary" @click="handleAdd">
        {{ $t('common.add') }}
      </a-button>
    </div>
    <vxe-table :data="dataList" :loading="loading" border>
      <vxe-column field="sceneName" :title="$t('payment.merchant.channelMerchant.transferSceneName')" min-width="120" />
      <vxe-column field="isDefault" :title="$t('common.isDefault')" width="90" align="center">
        <template #default="{ row }">
          <a-tag v-if="row.isDefault" color="green">
            {{ $t('common.yes') }}
          </a-tag>
        </template>
      </vxe-column>
      <vxe-column field="remark" :title="$t('common.remark')" min-width="120" show-overflow />
      <vxe-column fixed="right" :width="220" :title="$t('common.operation')" :show-overflow="false">
        <template #default="{ row }">
          <a-space :size="2">
            <template #separator>
              <a-divider type="vertical" />
            </template>
            <a-button v-if="!row.isDefault" type="link" size="small" @click="handleSetDefault(row)">
              {{ $t('common.setDefault') }}
            </a-button>
            <a-button type="link" size="small" @click="handleEdit(row)">
              {{ $t('common.edit') }}
            </a-button>
            <a-button type="link" size="small" danger @click="handleDelete(row)">
              {{ $t('common.delete') }}
            </a-button>
          </a-space>
        </template>
      </vxe-column>
    </vxe-table>
  </a-drawer>

  <!-- 表单 Modal -->
  <a-modal
    v-model:open="formVisible"
    :title="isEdit ? $t('common.edit') : $t('common.add')"
    :confirm-loading="saving"
    :ok-text="$t('common.save')"
    :cancel-text="$t('common.cancelText')"
    :width="640"
    destroy-on-hidden
    @ok="handleSubmit"
  >
    <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 17 }">
      <!-- 转账场景名称 -->
      <a-form-item :label="$t('payment.merchant.channelMerchant.transferSceneName')" name="sceneName">
        <a-select
          v-model:value="form.sceneName"
          :options="ALIPAY_TRANSFER_SCENES"
          :placeholder="$t('common.pleaseSelect')"
        />
      </a-form-item>
      <!-- 备注 -->
      <a-form-item :label="$t('common.remark')" name="remark">
        <a-input v-model:value="form.remark" :maxlength="200" allow-clear />
      </a-form-item>
      <!-- 是否默认 -->
      <a-form-item :label="$t('common.isDefault')" name="isDefault">
        <a-switch v-model:checked="form.isDefault" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
