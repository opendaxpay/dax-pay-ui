<script lang="ts" setup>
  import type { VxeTableInstance, VxeToolbarInstance } from 'vxe-table';

  import { computed, onMounted, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MerchantApi, type MerchantInfo } from '#/api/payment/merchant/merchant.api';
  import {
    MchWxDomainVerifyApi,
    type MchWxDomainVerifyQuery,
    type MchWxDomainVerifyVo,
  } from '#/api/payment/merchant/mch-wx-domain-verify.api';
  import { BQuery, type QueryField } from '#/components/query';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import MchWxDomainVerifyEdit from './MchWxDomainVerifyEdit.vue';

  defineOptions({ name: 'MchWxDomainVerifyList' });

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  // 必填路由参数守卫：缺少 mchNo 时提示并回退
  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo'],
    messageKey: 'payment.common.route.missingMchNo',
    fallbackPath: '/payment/merchant',
  });
  const mchNo = computed(() => routeContext.query.value.mchNo);

  const loading = ref(false);
  // 上传中状态
  const uploading = ref(false);
  const xTable = ref<VxeTableInstance>();
  const xToolbar = ref<VxeToolbarInstance>();

  const merchantInfo = ref<MerchantInfo>({});

  // 查询条件（mchNo 固定来自路由）
  const queryForm = ref<Omit<MchWxDomainVerifyQuery, 'mchNo'>>({});

  const pageConfig = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const tableData = ref<MchWxDomainVerifyVo[]>([]);

  // 编辑弹窗
  const editRef = ref();

  // 查询字段（不含商户号，固定单商户）
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
  ]);

  /**
   * 加载商户信息（展示商户名）
   */
  async function loadMerchantInfo() {
    if (!mchNo.value) return;
    const { data } = await MerchantApi.findByMchNo(mchNo.value);
    merchantInfo.value = data || {};
  }

  /**
   * 分页查询指定商户的验证文件列表
   */
  function queryPage() {
    if (!mchNo.value) return Promise.resolve();
    loading.value = true;
    return MchWxDomainVerifyApi.page({
      current: pageConfig.value.currentPage,
      size: pageConfig.value.pageSize,
      mchNo: mchNo.value,
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
    if (!mchNo.value) {
      return false;
    }
    uploading.value = true;
    try {
      const fileContent = await file.text();
      await MchWxDomainVerifyApi.upload({ fileName: file.name, fileContent }, mchNo.value);
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
  function handleEdit(row: MchWxDomainVerifyVo) {
    editRef.value?.showEdit(row);
  }

  /**
   * 查看
   */
  function handleView(row: MchWxDomainVerifyVo) {
    editRef.value?.showView(row);
  }

  /**
   * 删除验证文件（危险操作，二次确认）
   */
  function handleDelete(row: MchWxDomainVerifyVo) {
    confirm({
      // 国际化：确认
      title: $t('common.confirm'),
      content: $t('payment.wxVerify.confirmDelete'),
      okText: $t('common.delete'),
      cancelText: $t('common.cancel'),
      onOk() {
        return MchWxDomainVerifyApi.delete(row.id!).then(() => {
          message.success($t('common.deleteSuccess'));
          queryPage();
        });
      },
    });
  }

  onMounted(() => {
    if (!routeContext.isValid.value) {
      return;
    }
    loadMerchantInfo();
    xTable.value?.connectToolbar(xToolbar.value as VxeToolbarInstance);
    queryPage();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.common.route.missingMchNo')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-foreground">{{ $t('payment.wxVerify.title') }}</span>
          <span v-if="merchantInfo.mchName" class="text-sm text-muted-foreground"
            >({{ merchantInfo.mchName }})</span
          >
        </div>
      </template>

      <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />

      <div class="mt-4">
        <vxe-toolbar ref="xToolbar" custom refresh :refresh-options="{ queryMethod: queryPage }">
          <template #buttons>
            <a-upload
              :show-upload-list="false"
              accept=".txt"
              :before-upload="handleBeforeUpload"
            >
              <a-button
                v-if="hasPermission(PermCodes.Merchant.WxDomainVerify.MANAGE)"
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
                v-if="hasPermission(PermCodes.Merchant.WxDomainVerify.VIEW)"
                href="javascript:"
                class="vben-link"
                @click="handleView(row)"
                >{{ row.fileName }}</a
              >
              <span v-else>{{ row.fileName }}</span>
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
                  v-if="hasPermission(PermCodes.Merchant.WxDomainVerify.MANAGE)"
                  type="link"
                  size="small"
                  @click="handleEdit(row)"
                  >{{ $t('common.edit') }}</a-button
                >
                <a-button
                  v-if="hasPermission(PermCodes.Merchant.WxDomainVerify.MANAGE)"
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
      </div>
    </a-card>

    <!-- 编辑弹窗 -->
    <MchWxDomainVerifyEdit ref="editRef" @ok="queryPage" />
  </div>
</template>
