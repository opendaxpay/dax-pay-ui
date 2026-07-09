<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    PlatformWxDomainVerifyApi,
    type PlatformWxDomainVerifyQuery,
    type PlatformWxDomainVerifyVo,
  } from '#/api/payment/config/wx-domain-verify.api';
  import { BQuery, type QueryField } from '#/components/query';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import PlatformWxDomainVerifyEdit from './PlatformWxDomainVerifyEdit.vue';

  defineOptions({ name: 'PlatformWxDomainVerifyList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);
  // 上传中状态
  const uploading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  // 查询条件
  const queryForm = ref<PlatformWxDomainVerifyQuery>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<PlatformWxDomainVerifyVo[]>([]);

  // 编辑弹窗
  const editRef = ref();

  // 查询字段（全局视图：可按归属 / 商户号筛选）
  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'fileName',
      name: $t('payment.wxVerify.field.fileName'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'string',
      field: 'verifyCode',
      name: $t('payment.wxVerify.field.verifyCode'),
      placeholder: $t('common.pleaseInput'),
    },
    {
      type: 'list',
      field: 'platform',
      name: $t('payment.wxVerify.field.belong'),
      placeholder: $t('common.pleaseSelect'),
      selectList: [
        { label: $t('payment.wxVerify.belong.platform'), value: true },
        { label: $t('payment.wxVerify.belong.merchant'), value: false },
      ],
    },
    {
      type: 'string',
      field: 'mchNo',
      name: $t('payment.wxVerify.field.mchNo'),
      placeholder: $t('common.pleaseInput'),
    },
  ]);

  /**
   * 分页查询平台级验证文件列表
   */
  function queryPage() {
    loading.value = true;
    return PlatformWxDomainVerifyApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      ...queryForm.value,
    })
      .then((res) => {
        tableData.value = res.data?.records || [];
        pageConfig.value.total = Number(res.data?.total) || 0;
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  function resetQuery() {
    queryForm.value = {};
    pageConfig.value.currentPage = 1;
    queryPage();
  }

  function handlePageChange({ currentPage, pageSize }: { currentPage: number; pageSize: number }) {
    pageConfig.value.currentPage = currentPage;
    pageConfig.value.pageSize = pageSize;
    queryPage();
  }

  /**
   * a-upload 选择文件回调（单选），读取文件内容后 JSON 提交上传
   */
  async function handleBeforeUpload(file: File) {
    uploading.value = true;
    try {
      const fileContent = await file.text();
      await PlatformWxDomainVerifyApi.upload({ fileName: file.name, fileContent });
      message.success($t('payment.wxVerify.uploadSuccess'));
      queryPage();
    } catch {
      // 错误消息已由全局响应拦截器统一提示
    } finally {
      uploading.value = false;
    }
    // 返回 false 阻止 a-upload 自动上传
    return false;
  }

  /**
   * 编辑
   */
  function handleEdit(row: PlatformWxDomainVerifyVo) {
    editRef.value?.showEdit(row);
  }

  /**
   * 查看
   */
  function handleView(row: PlatformWxDomainVerifyVo) {
    editRef.value?.showView(row);
  }

  /**
   * 删除验证文件（危险操作，二次确认）
   */
  function handleDelete(row: PlatformWxDomainVerifyVo) {
    confirm({
      // 国际化：确认
      title: $t('common.confirm'),
      content: $t('payment.wxVerify.confirmDelete'),
      okText: $t('common.delete'),
      cancelText: $t('common.cancel'),
      onOk() {
        return PlatformWxDomainVerifyApi.delete(row.id!).then(() => {
          message.success($t('common.deleteSuccess'));
          queryPage();
        });
      },
    });
  }

  onMounted(() => {
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });
</script>

<template>
  <div class="m-3 p-3 bg-background rounded-lg list-page-compact">
    <a-card>
      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
    </a-card>

    <div class="mt-4">
      <a-card>
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-upload
              :show-upload-list="false"
              accept=".txt"
              :before-upload="handleBeforeUpload"
            >
              <a-button
                v-if="hasPermission(PermCodes.Payment.Config.WxDomainVerify.MANAGE)"
                type="primary"
                :loading="uploading"
              >
                <template #icon>
                  <IconifyIcon icon="ant-design:upload-outlined" />
                </template>
                <!-- 国际化：上传验证文件 -->
                {{ $t('payment.wxVerify.upload') }}
              </a-button>
            </a-upload>
          </template>
        </vxe-toolbar>
        <vxe-table ref="xTable" :row-config="{ keyField: 'id' }" :data="tableData" :loading="loading">
          <vxe-column type="seq" :title="$t('common.seq')" width="60" align="center" />
          <!-- 国际化：文件名 -->
          <vxe-column field="fileName" :title="$t('payment.wxVerify.field.fileName')" :min-width="220">
            <template #default="{ row }">
              <a
                v-if="hasPermission(PermCodes.Payment.Config.WxDomainVerify.VIEW)"
                href="javascript:"
                class="vben-link"
                @click="handleView(row)"
                >{{ row.fileName }}</a
              >
              <span v-else>{{ row.fileName }}</span>
            </template>
          </vxe-column>
          <!-- 国际化：归属 -->
          <vxe-column
            field="platform"
            :title="$t('payment.wxVerify.field.belong')"
            :width="100"
            align="center"
          >
            <template #default="{ row }">
              <a-tag v-if="row.platform" color="blue">
                {{ $t('payment.wxVerify.belong.platform') }}
              </a-tag>
              <a-tag v-else color="green">
                {{ $t('payment.wxVerify.belong.merchant') }}
              </a-tag>
            </template>
          </vxe-column>
          <!-- 国际化：商户号 -->
          <vxe-column
            field="mchNo"
            :title="$t('payment.wxVerify.field.mchNo')"
            :min-width="140"
            show-overflow
          >
            <template #default="{ row }">
              {{ row.platform ? '-' : row.mchNo }}
            </template>
          </vxe-column>
          <!-- 国际化：验证码 -->
          <vxe-column
            field="verifyCode"
            :title="$t('payment.wxVerify.field.verifyCode')"
            :min-width="200"
            show-overflow
          />
          <!-- 国际化：备注 -->
          <vxe-column
            field="remark"
            :title="$t('payment.wxVerify.field.remark')"
            :min-width="160"
            show-overflow
          />
          <!-- 国际化：创建时间 -->
          <vxe-column
            field="createTime"
            :title="$t('payment.wxVerify.field.createTime')"
            :min-width="180"
            formatter="formatDateTime"
          />
          <vxe-column fixed="right" :width="140" :show-overflow="false" :title="$t('common.operation')">
            <template #default="{ row }">
              <a-space :size="2">
                <template #separator>
                  <a-divider type="vertical" />
                </template>
                <a-button
                  v-if="hasPermission(PermCodes.Payment.Config.WxDomainVerify.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                  >{{ $t('common.edit') }}</a-button
                >
                <a-button
                  v-if="hasPermission(PermCodes.Payment.Config.WxDomainVerify.MANAGE)"
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(row)"
                  >{{ $t('common.delete') }}</a-button
                >
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

    <!-- 编辑弹窗 -->
    <PlatformWxDomainVerifyEdit ref="editRef" @ok="queryPage" />
  </div>
</template>
