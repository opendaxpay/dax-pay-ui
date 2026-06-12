<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import {
    type InputParamDefParam,
    type InputParamDefResult,
    type InputParamSetResult,
    InputParamDefApi,
    InputParamSetApi,
  } from '#/api/risk/model.api';
  import { FormEditType } from '#/enums/formEditType';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useValidate } from '#/hooks/useValidate';
  import { BQuery, type QueryField } from '#/components/query';

  import InputParamSetEdit from './InputParamSetEdit.vue';
  const { message, confirm } = useMessage();
  const { hasPermission } = usePermission();

  const { existsByServer, useDebounceValidator } = useValidate();

  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();
  const inputParamSetEdit = ref();

  const loading = ref(false);
  const tableData = ref<InputParamSetResult[]>([]);

  // 分页配置
  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  // 查询表单
  const queryForm = ref<Record<string, any>>({});

  // 查询字段定义
  const queryFields = computed<QueryField[]>(() => [
    // 编码
    {
      type: 'string',
      field: 'code',
      name: $t('risk.inputParamSet.base.field.code'),
    },
    // 名称
    {
      type: 'string',
      field: 'name',
      name: $t('risk.inputParamSet.base.field.name'),
    },
  ]);

  // 抽屉状态
  const drawerVisible = ref(false);
  const drawerSetId = ref<string>('');
  const drawerSetCode = ref<string>('');
  const drawerSetName = ref<string>('');

  // 抽屉内参数定义表格
  const defXTable = ref<VxeTableInstance>();
  const defXToolbar = ref<VxeToolbarInstance>();
  const defLoading = ref(false);
  const defTableData = ref<InputParamDefResult[]>([]);

  // 参数定义编辑弹窗
  const editVisible = ref(false);
  const editLoading = ref(false);
  const isEdit = ref(false);
  const formRef = ref();
  const formState = ref<InputParamDefParam>({});

  const formRules = computed(() => ({
    code: [
      { required: true, message: $t('risk.inputParamDef.form.add.codePlaceholder') },
      { validator: useDebounceValidator(formRef, 'code', validateCode, 500) },
    ],
    name: [{ required: true, message: $t('risk.inputParamDef.form.add.namePlaceholder') }],
    paramType: [{ required: true, message: $t('risk.inputParamDef.form.add.paramTypePlaceholder') }],
  }));

  /** 编码判重校验 */
  async function validateCode() {
    const { code, id } = formState.value;
    return existsByServer(
      code,
      id,
      isEdit.value ? FormEditType.Edit : FormEditType.Add,
      InputParamDefApi.existsByCode,
      InputParamDefApi.existsByCodeNotId,
      $t('risk.inputParamDef.form.add.codeDuplicate'),
    );
  }

  // 参数类型选项
  const paramTypeOptions = computed(() => [
    { label: $t('risk.inputParamDef.base.paramType.string'), value: 'STRING' },
    { label: $t('risk.inputParamDef.base.paramType.number'), value: 'NUMBER' },
    { label: $t('risk.inputParamDef.base.paramType.boolean'), value: 'BOOLEAN' },
  ]);

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    loadList();
  });

  /** 加载集合列表 */
  function loadList() {
    loading.value = true;
    InputParamSetApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res: any) => {
        tableData.value = res.data.records || [];
        pageConfig.value.total = Number(res.data.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /** 新增集合 */
  function handleAdd() {
    inputParamSetEdit.value?.show();
  }

  /** 编辑集合 */
  function handleEdit(row: InputParamSetResult) {
    inputParamSetEdit.value?.showEdit(row.id);
  }

  /** 删除集合 */
  function handleDelete(row: InputParamSetResult) {
    confirm({
      content: $t('risk.inputParamSet.base.action.confirmDelete'),
      onOk: () => {
        InputParamSetApi.delete(row.id!).then(() => {
          message.success($t('common.success'));
          loadList();
        });
      },
    });
  }

  /** 重置查询 */
  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    loadList();
  }

  /** 分页切换 */
  function handlePageChange({ currentPage, pageSize }: any) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    loadList();
  }

  /** 管理参数 - 打开抽屉 */
  function handleManageParams(row: InputParamSetResult) {
    drawerSetId.value = String(row.id);
    drawerSetCode.value = row.code || '';
    drawerSetName.value = row.name || '';
    drawerVisible.value = true;
    setTimeout(() => {
      defXTable.value?.connectToolbar(defXToolbar.value as VxeToolbarInstance);
      loadDefList();
    });
  }

  /** 加载参数定义列表 */
  function loadDefList() {
    defLoading.value = true;
    InputParamDefApi.listBySetId(drawerSetId.value)
      .then((res: any) => {
        defTableData.value = res.data || [];
        defLoading.value = false;
      })
      .catch(() => {
        defLoading.value = false;
      });
  }

  /** 重置参数编辑表单 */
  function resetDefForm() {
    formState.value = {
      setId: drawerSetId.value,
      paramType: 'STRING',
    };
    formRef.value?.resetFields();
  }

  /** 新增参数 */
  function handleDefAdd() {
    isEdit.value = false;
    editVisible.value = true;
    resetDefForm();
  }

  /** 编辑参数 */
  async function handleDefEdit(row: InputParamDefResult) {
    isEdit.value = true;
    editVisible.value = true;
    resetDefForm();
    const res = await InputParamDefApi.findById(row.id!);
    const data = res.data;
    formState.value = {
      id: data.id,
      setId: drawerSetId.value,
      code: data.code || '',
      name: data.name || '',
      description: data.description || '',
      paramType: data.paramType || 'STRING',
    };
  }

  /** 删除参数 */
  function handleDefDelete(row: InputParamDefResult) {
    confirm({
      content: $t('risk.inputParamDef.base.action.confirmDelete'),
      onOk: () => {
        InputParamDefApi.delete(row.id!).then(() => {
          message.success($t('common.success'));
          loadDefList();
        });
      },
    });
  }

  /** 参数编辑确认 */
  async function handleDefEditOk() {
    await formRef.value?.validate();
    editLoading.value = true;
    try {
      if (isEdit.value) {
        await InputParamDefApi.update(formState.value);
      } else {
        await InputParamDefApi.add(formState.value);
      }
      message.success($t('common.success'));
      editVisible.value = false;
      loadDefList();
    } finally {
      editLoading.value = false;
    }
  }

  /** 参数编辑取消 */
  function handleDefEditCancel() {
    editVisible.value = false;
  }
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="loadList" @reset="resetQuery" />
    </a-card>
    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: loadList }">
          <template #buttons>
            <a-space>
              <!-- 参数集合列表 - 新增按钮 -->
              <a-button v-if="hasPermission(PermCodes.Risk.InputParamSet.ADD)" type="primary" @click="handleAdd">{{
                $t('common.add')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <!-- 编码 -->
          <vxe-column field="code" :title="$t('risk.inputParamSet.base.field.code')" :min-width="200" />
          <!-- 名称 -->
          <vxe-column field="name" :title="$t('risk.inputParamSet.base.field.name')" :min-width="200" />
          <!-- 描述 -->
          <vxe-column field="description" :title="$t('risk.inputParamSet.base.field.description')" :min-width="200" />
          <!-- 操作 -->
          <vxe-column fixed="right" width="200" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <!-- 编辑 -->
                <a-button type="link" size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</a-button>
                <!-- 删除 -->
                <a-button type="link" size="small" danger @click="handleDelete(row)">{{
                  $t('common.delete')
                }}</a-button>
                <!-- 管理参数 -->
                <a-button type="link" size="small" @click="handleManageParams(row)">{{
                  $t('risk.inputParamSet.base.action.manageParams')
                }}</a-button>
              </a-space>
            </template>
          </vxe-column>
        </vxe-table>
        <vxe-pager
          size="medium"
          :loading="loading"
          :current-page="pageConfig.currentPage"
          :page-size="pageConfig.pageSize"
          :total="pageConfig.total"
          @page-change="handlePageChange"
        />
      </a-card>
    </div>

    <InputParamSetEdit ref="inputParamSetEdit" @ok="loadList" />

    <!-- 参数管理抽屉 -->
    <a-drawer
      v-model:open="drawerVisible"
      :title="$t('risk.inputParamDef.base.manageTitle') + ' (' + drawerSetName + ')'"
      size="80%"
      :destroy-on-hidden="true"
      :mask-closable="false"
    >
      <a-card>
        <vxe-toolbar ref="defXToolbar" custom refresh :refresh-options="{ queryMethod: loadDefList }">
          <template #buttons>
            <a-space>
              <a-button v-if="hasPermission(PermCodes.Risk.InputParamSet.ADD)" type="primary" @click="handleDefAdd">{{
                $t('common.add')
              }}</a-button>
            </a-space>
          </template>
        </vxe-toolbar>
        <vxe-table ref="defXTable" :row-config="{ keyField: 'id' }" :data="defTableData" :loading="defLoading">
          <!-- 编码 -->
          <vxe-column field="code" :title="$t('risk.inputParamDef.base.field.code')" :min-width="200" />
          <!-- 名称 -->
          <vxe-column field="name" :title="$t('risk.inputParamDef.base.field.name')" :min-width="200" />
          <!-- 参数类型 -->
          <vxe-column
            field="paramType"
            :title="$t('risk.inputParamDef.base.field.paramType')"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.paramType === 'STRING'" color="blue">{{
                $t('risk.inputParamDef.base.paramType.string')
              }}</a-tag>
              <a-tag v-else-if="row.paramType === 'NUMBER'" color="orange">{{
                $t('risk.inputParamDef.base.paramType.number')
              }}</a-tag>
              <a-tag v-else-if="row.paramType === 'BOOLEAN'" color="green">{{
                $t('risk.inputParamDef.base.paramType.boolean')
              }}</a-tag>
            </template>
          </vxe-column>
          <!-- 描述 -->
          <vxe-column field="description" :title="$t('risk.inputParamDef.base.field.description')" :min-width="200" />
          <!-- 操作 -->
          <vxe-column fixed="right" width="120" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <!-- 编辑按钮 -->
                <a-button type="link" size="small" @click="handleDefEdit(row)">{{ $t('common.edit') }}</a-button>
                <!-- 删除按钮 -->
                <a-button type="link" size="small" danger @click="handleDefDelete(row)">{{
                  $t('common.delete')
                }}</a-button>
              </a-space>
            </template>
          </vxe-column>
        </vxe-table>
      </a-card>

      <!-- 参数定义编辑弹窗 -->
      <a-modal
        v-model:open="editVisible"
        :title="isEdit ? $t('risk.inputParamDef.form.edit.title') : $t('risk.inputParamDef.form.add.title')"
        :width="500"
        :confirm-loading="editLoading"
        :mask-closable="false"
        :focusable="{ trap: false }"
        @ok="handleDefEditOk"
        @cancel="handleDefEditCancel"
      >
        <a-form
          ref="formRef"
          :model="formState"
          :rules="formRules"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 16 }"
          class="mt-4 form-compact"
        >
          <!-- 参数编码 -->
          <a-form-item :label="$t('risk.inputParamDef.base.field.code')" name="code" validate-first>
            <a-input v-model:value="formState.code" :placeholder="$t('risk.inputParamDef.form.add.codePlaceholder')" />
          </a-form-item>
          <!-- 参数名称 -->
          <a-form-item :label="$t('risk.inputParamDef.base.field.name')" name="name">
            <a-input v-model:value="formState.name" :placeholder="$t('risk.inputParamDef.form.add.namePlaceholder')" />
          </a-form-item>
          <!-- 参数类型 -->
          <a-form-item :label="$t('risk.inputParamDef.base.field.paramType')" name="paramType">
            <a-select
              v-model:value="formState.paramType"
              :options="paramTypeOptions"
              :placeholder="$t('risk.inputParamDef.form.add.paramTypePlaceholder')"
            />
          </a-form-item>
          <!-- 参数描述 -->
          <a-form-item :label="$t('risk.inputParamDef.base.field.description')" name="description">
            <a-input
              v-model:value="formState.description"
              :placeholder="$t('risk.inputParamDef.form.add.descriptionPlaceholder')"
            />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-drawer>
  </div>
</template>
