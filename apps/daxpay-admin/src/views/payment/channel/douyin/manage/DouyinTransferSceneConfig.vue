<script lang="ts" setup>
  import type { DouyinTransferSceneConfigParam } from '#/api/payment/channel/douyin/transfer-scene.api';

  import { computed, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    DOUYIN_TRANSFER_SCENES,
    DouyinTransferSceneApi,
    type DouyinTransferSceneConfig,
  } from '#/api/payment/channel/douyin/transfer-scene.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  defineOptions({ name: 'DouyinTransferSceneConfig' });

  const { message, confirm } = useMessage();
  const { hasPermission } = usePermission();

  const canEdit = computed(() => hasPermission(PermCodes.Channel.Merchant.MANAGE));

  const mchNo = ref('');
  const channelMchNo = ref('');
  const visible = ref(false);
  const loading = ref(false);
  const dataList = ref<DouyinTransferSceneConfig[]>([]);

  // 新增/编辑弹窗
  const modalVisible = ref(false);
  const modalLoading = ref(false);
  const formRef = ref();
  const form = ref<DouyinTransferSceneConfigParam>({} as DouyinTransferSceneConfigParam);
  const isEdit = ref(false);

  /** 可选场景(过滤已添加的, 编辑时保留当前) */
  const availableScenes = computed(() => {
    const usedCodes = new Set(
      dataList.value.filter((item) => !isEdit.value || item.id !== form.value.id).map((item) => item.sceneId),
    );
    return DOUYIN_TRANSFER_SCENES.filter((scene) => !usedCodes.has(scene.code));
  });

  /** 打开抽屉 */
  function show(no: string, mchChannelNo: string) {
    mchNo.value = no;
    channelMchNo.value = mchChannelNo;
    visible.value = true;
    loadData();
  }

  /** 加载列表 */
  function loadData() {
    if (!mchNo.value || !channelMchNo.value) return;
    loading.value = true;
    DouyinTransferSceneApi.list(mchNo.value, channelMchNo.value)
      .then(({ data }) => {
        dataList.value = data || [];
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 打开新增弹窗 */
  function handleAdd() {
    isEdit.value = false;
    form.value = {
      mchNo: mchNo.value,
      channelMchNo: channelMchNo.value,
      sceneId: '',
      isDefault: false,
      remark: '',
    };
    modalVisible.value = true;
  }

  /** 打开编辑弹窗 */
  function handleEdit(row: DouyinTransferSceneConfig) {
    isEdit.value = true;
    form.value = {
      id: row.id ?? undefined,
      mchNo: mchNo.value,
      channelMchNo: channelMchNo.value,
      sceneId: row.sceneId ?? '',
      isDefault: row.isDefault,
      remark: row.remark,
    };
    modalVisible.value = true;
  }

  /** 提交表单 */
  function handleSubmit() {
    formRef.value
      ?.validate()
      .then(() => {
        modalLoading.value = true;
        const api = isEdit.value ? DouyinTransferSceneApi.update(form.value) : DouyinTransferSceneApi.save(form.value);
        api
          .then(() => {
            message.success($t('common.saveSuccess'));
            modalVisible.value = false;
            loadData();
          })
          .finally(() => {
            modalLoading.value = false;
          });
      })
      .catch(() => {});
  }

  /** 删除 */
  function handleDelete(row: DouyinTransferSceneConfig) {
    // 确认删除转账场景
    confirm({
      content: $t('payment.channel.douyinManage.transferSceneDeleteConfirm'),
      onOk: () => {
        DouyinTransferSceneApi.delete(row.id as string).then(() => {
          message.success($t('common.deleteSuccess'));
          loadData();
        });
      },
    });
  }

  /** 设为默认 */
  function handleSetDefault(row: DouyinTransferSceneConfig) {
    DouyinTransferSceneApi.setDefault(mchNo.value, row.id as string).then(() => {
      message.success($t('common.saveSuccess'));
      loadData();
    });
  }

  defineExpose({ show });
</script>

<template>
  <a-drawer
    v-model:open="visible"
    :title="$t('payment.channel.douyinManage.transferSceneTitle')"
    size="large"
    :mask-closable="false"
    destroy-on-hidden
  >
    <a-spin :spinning="loading">
      <div class="mb-4 flex justify-end">
        <a-button v-if="canEdit" type="primary" @click="handleAdd">
          {{ $t('payment.channel.douyinManage.transferSceneAdd') }}
        </a-button>
      </div>

      <vxe-table :data="dataList" border :row-config="{ isHover: true }">
        <vxe-column field="sceneName" :title="$t('payment.channel.douyinManage.transferSceneName')" min-width="120" />
        <vxe-column field="sceneId" :title="$t('payment.channel.douyinManage.transferSceneId')" min-width="100" />
        <vxe-column field="remark" :title="$t('payment.channel.douyinManage.transferSceneRemark')" min-width="150" />
        <vxe-column field="isDefault" :title="$t('payment.channel.douyinManage.transferSceneDefault')" width="100">
          <template #default="{ row }">
            <a-tag v-if="row.isDefault" color="green">{{
              $t('payment.channel.douyinManage.transferSceneDefaultTag')
            }}</a-tag>
            <span v-else class="text-muted-foreground">-</span>
          </template>
        </vxe-column>
        <vxe-column fixed="right" :show-overflow="false" :title="$t('common.operation')" :width="200">
          <template #default="{ row }">
            <a-space :size="2">
              <template #separator>
                <a-divider type="vertical" />
              </template>
              <a-button v-if="canEdit && !row.isDefault" type="link" size="small" @click="handleSetDefault(row)">
                {{ $t('payment.channel.douyinManage.transferSceneSetDefault') }}
              </a-button>
              <a-button v-if="canEdit" type="link" size="small" @click="handleEdit(row)">
                {{ $t('common.edit') }}
              </a-button>
              <a-button v-if="canEdit" type="link" size="small" danger @click="handleDelete(row)">
                {{ $t('common.delete') }}
              </a-button>
            </a-space>
          </template>
        </vxe-column>
      </vxe-table>
    </a-spin>

    <a-modal
      v-model:open="modalVisible"
      :title="
        isEdit
          ? $t('payment.channel.douyinManage.transferSceneEdit')
          : $t('payment.channel.douyinManage.transferSceneAdd')
      "
      :confirm-loading="modalLoading"
      :mask-closable="false"
      destroy-on-hidden
      @ok="handleSubmit"
    >
      <a-form
        ref="formRef"
        :model="form"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        :validate-trigger="['blur', 'change']"
      >
        <a-form-item
          :label="$t('payment.channel.douyinManage.transferSceneName')"
          name="sceneId"
          :rules="[{ required: true, message: $t('payment.channel.douyinManage.transferSceneNameRequired') }]"
        >
          <a-select
            v-model:value="form.sceneId"
            :placeholder="$t('payment.channel.douyinManage.transferSceneNamePlaceholder')"
            :disabled="isEdit"
          >
            <a-select-option v-for="scene in availableScenes" :key="scene.code" :value="scene.code">
              {{ scene.name }}（{{ scene.code }}）
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="$t('payment.channel.douyinManage.transferSceneRemark')" name="remark">
          <a-textarea v-model:value="form.remark" :rows="3" :maxlength="200" show-count />
        </a-form-item>
        <a-form-item :label="$t('payment.channel.douyinManage.transferSceneDefault')" name="isDefault">
          <a-switch v-model:checked="form.isDefault" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-drawer>
</template>
