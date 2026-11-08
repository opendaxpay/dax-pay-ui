<script lang="ts" setup>
  import { computed, nextTick, ref } from 'vue';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import {
    MockChannelMerchantApi,
    type MockIsvChannelMerchantCreateParam,
  } from '#/api/payment/channel/mock/channel-merchant.api';
  import { MockIsvInfoApi, type MockIsvInfoOption } from '#/api/payment/channel/mock/isv-info.api';
  import ChannelLogo from '#/components/channel/ChannelLogo.vue';
  import { productI18nMap, productNameMap } from '#/enums/payment';
  import { useMessage } from '#/hooks/useMessage';

  import MockIsvInfoEditModal from './MockIsvInfoEditModal.vue';

  /**
   * 模拟通道服务商商户建档(mock_isv)
   *
   * 纯本地登记: 归属服务商创建时选定并锁死, 子商户号必填(登记模拟通道控制台已创建的商户号,
   * 对齐 plus 口径不再自动生成); 服务商的新建/编辑在模拟服务商管理页维护,
   * 本表单下拉项带行内编辑图标可直接修改所选服务商。
   */
  defineOptions({ name: 'MockIsvMchCreateConfig' });

  const emit = defineEmits<{
    (e: 'prev'): void;
    (e: 'close'): void;
  }>();

  const { message } = useMessage();

  const mchNo = ref('');
  const productCode = ref('');
  const channelCode = ref('');
  const formRef = ref();
  const form = ref({
    channelMerchantName: '',
    channelMchNo: '',
    isvId: undefined as string | undefined,
  });

  /** 服务商下拉选项(全量行含停用, 停用项置灰不可选) */
  const isvOptions = ref<MockIsvInfoOption[]>([]);
  const isvLoading = ref(false);
  // 服务商编辑弹窗(下拉项行内编辑入口用)
  const isvModalRef = ref<InstanceType<typeof MockIsvInfoEditModal>>();

  const visible = ref(false);
  const createSuccess = ref(false);
  const submitLoading = ref(false);

  /** 支付产品展示名称(优先国际化映射, 兜底产品编码) */
  const productDisplayName = computed(() => {
    const product = productCode.value;
    if (!product) return '-';
    const i18nKey = productI18nMap[product];
    if (i18nKey) {
      return $t(i18nKey);
    }
    return productNameMap[product] || product;
  });

  /** 服务商下拉选项(名称+编号, 停用项置灰并标注「已停用」) */
  const isvSelectOptions = computed(() =>
    isvOptions.value.map((item) => ({
      value: item.id,
      label: `${$t('payment.channel.mock.isv.optionLabel', { name: item.isvName, no: item.isvNo })}${
        // 国际化：停用标注
        item.enable ? '' : $t('payment.channel.mock.isv.disabledSuffix')
      }`,
      disabled: !item.enable,
    })),
  );

  const rules = computed(() => ({
    // 所属服务商(停用项已置灰, 校验器兜底拦截)
    isvId: [
      { required: true, message: $t('payment.channel.mock.isv.selectRequired') },
      {
        validator: (_rule: any, value: string) => {
          if (!value) return Promise.resolve();
          const record = isvOptions.value.find((item) => item.id === value);
          if (record && !record.enable) {
            // 国际化：服务商已停用
            return Promise.reject($t('payment.channel.mock.isv.selectDisabled'));
          }
          return Promise.resolve();
        },
      },
    ],
    // 子商户号(必填, 登记模拟通道控制台已创建的服务商子商户号, 不再自动生成)
    channelMchNo: [
      { required: true, message: $t('payment.channel.mock.create.channelMchNoRequired') },
      {
        // 纯空白视为未填写(提交前 trim 校验)
        validator: (_rule: any, value: string) => {
          if (value && !value.trim()) {
            return Promise.reject($t('payment.channel.mock.create.channelMchNoRequired'));
          }
          return Promise.resolve();
        },
      },
    ],
    // 通道商户名称
    channelMerchantName: [{ required: true, message: $t('payment.channel.mock.create.channelMerchantNameRequired') }],
  }));

  /** 加载服务商下拉(全量行含停用) */
  function loadIsvOptions() {
    isvLoading.value = true;
    MockIsvInfoApi.dropdown()
      .then(({ data }) => {
        isvOptions.value = data || [];
      })
      .catch(() => {
        // 下拉加载失败给页面内提示, 避免未处理的 Promise 拒绝导致流程卡住
        message.error($t('payment.channel.mock.isv.loadFailed'));
      })
      .finally(() => {
        isvLoading.value = false;
      });
  }

  /** 下拉项编辑图标: 按主键取行数据打开编辑弹窗(停用项可编辑不可选用) */
  function handleEditIsv(id: unknown) {
    const record = isvOptions.value.find((item) => item.id === id);
    if (record) {
      isvModalRef.value?.show(record);
    }
  }

  /** 服务商保存成功: 重载下拉并保持当前选中(v-model 值不受选项刷新影响) */
  function handleIsvSaved() {
    loadIsvOptions();
  }

  /** 初始化建档表单(由创建流程分发组件调用) */
  function init(no: string, product: string, channel: string) {
    mchNo.value = no;
    productCode.value = product;
    channelCode.value = channel;
    visible.value = true;
    createSuccess.value = false;
    resetForm();
    loadIsvOptions();
  }

  /** 返回上一步(重选支付产品) */
  function handlePrev() {
    emit('prev');
  }

  /** 提交建档 */
  function handleSubmit() {
    formRef.value
      ?.validate()
      .then(() => {
        submitLoading.value = true;
        const param: MockIsvChannelMerchantCreateParam = {
          mchNo: mchNo.value,
          isvId: form.value.isvId!,
          // 子商户号必填: 登记模拟通道控制台已创建的服务商子商户号
          channelMchNo: form.value.channelMchNo.trim(),
          channelMerchantName: form.value.channelMerchantName.trim(),
        };
        MockChannelMerchantApi.createMockIsvMerchant(param)
          .then(() => {
            createSuccess.value = true;
            // 国际化：创建成功
            message.success($t('payment.merchant.channelMerchant.createSuccess'));
          })
          .finally(() => {
            submitLoading.value = false;
          });
      })
      .catch(() => {});
  }

  /** 重置表单(切换产品重新进入时避免残留上一次输入) */
  function resetForm() {
    form.value = {
      channelMerchantName: '',
      channelMchNo: '',
      isvId: undefined,
    };
    nextTick(() => {
      formRef.value?.resetFields();
    });
  }

  defineExpose({ init });
</script>

<template>
  <div v-if="visible">
    <div v-if="!createSuccess">
      <a-spin :spinning="submitLoading">
        <!-- 无可用服务商: 给出明确指引, 避免空下拉无法建档 -->
        <div v-if="!isvLoading && isvOptions.length === 0" class="mb-6">
          <a-alert show-icon type="warning" :message="$t('payment.channel.mock.isv.empty')" />
        </div>
        <a-form
          ref="formRef"
          :model="form"
          :rules="rules"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 16 }"
          :validate-trigger="['blur', 'change']"
        >
          <!-- 国际化：支付产品 -->
          <a-form-item :label="$t('payment.merchant.channelMerchant.product')">
            <div class="flex items-center gap-2 h-8">
              <ChannelLogo v-if="channelCode" :product="productCode" :channel="channelCode" :size="24" />
              <span class="text-foreground">{{ productDisplayName }}</span>
            </div>
          </a-form-item>
          <!-- 国际化：所属服务商(停用项置灰不可选; 下拉项带行内编辑入口) -->
          <a-form-item :label="$t('payment.channel.mock.isv.selectLabel')" name="isvId">
            <a-select
              v-model:value="form.isvId"
              class="w-full"
              :loading="isvLoading"
              :options="isvSelectOptions"
              :placeholder="$t('payment.channel.mock.isv.selectPlaceholder')"
              show-search
              option-filter-prop="label"
            >
              <template #optionRender="{ option }">
                <div class="flex items-center justify-between gap-2">
                  <span>{{ option.data.label }}</span>
                  <IconifyIcon
                    icon="ant-design:edit-outlined"
                    class="shrink-0 cursor-pointer text-muted-foreground hover:text-primary"
                    @click.stop="handleEditIsv(option.data.value)"
                  />
                </div>
              </template>
            </a-select>
          </a-form-item>
          <!-- 国际化：通道商户名称 -->
          <a-form-item :label="$t('payment.channel.mock.create.channelMerchantName')" name="channelMerchantName">
            <a-input
              v-model:value="form.channelMerchantName"
              :placeholder="$t('payment.merchant.channelMerchant.pleaseInputName')"
            />
          </a-form-item>
          <!-- 国际化：子商户号(必填, 登记模拟通道控制台已创建的服务商子商户号) -->
          <a-form-item
            :label="$t('payment.channel.mock.isv.subMchNo')"
            name="channelMchNo"
            :tooltip="$t('payment.channel.mock.isv.subMchNoTooltip')"
          >
            <a-input
              v-model:value="form.channelMchNo"
              allow-clear
              :placeholder="$t('payment.channel.mock.isv.subMchNoPlaceholder')"
            />
          </a-form-item>
          <div class="flex justify-center gap-4 mt-8 pt-6 border-t border-border">
            <a-button @click="handlePrev">
              {{ $t('payment.merchant.channelMerchant.prevStep') }}
            </a-button>
            <a-button type="primary" :loading="submitLoading" @click="handleSubmit">
              {{ $t('payment.merchant.channelMerchant.create') }}
            </a-button>
          </div>
        </a-form>
      </a-spin>
    </div>

    <!-- 建档成功: 与其它通道创建流程同款成功态 -->
    <div v-else class="flex flex-col items-center justify-center py-12">
      <div class="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
        <IconifyIcon icon="ant-design:check-circle-filled" class="text-4xl text-green-500" />
      </div>
      <div class="text-xl font-bold text-foreground mb-2">{{
        $t('payment.merchant.channelMerchant.createSuccess')
      }}</div>
      <div class="text-sm text-muted-foreground mb-8">{{
        $t('payment.merchant.channelMerchant.createSuccessDesc')
      }}</div>
      <a-button type="primary" @click="emit('close')">
        {{ $t('payment.merchant.channelMerchant.closePage') }}
      </a-button>
    </div>

    <!-- 服务商编辑弹窗(下拉项行内编辑入口, 保存成功后重载下拉并保持当前选中) -->
    <MockIsvInfoEditModal ref="isvModalRef" @ok="handleIsvSaved" />
  </div>
</template>
