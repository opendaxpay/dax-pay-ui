<script lang="ts" setup>
  import type { MockIsvInfoResult } from '#/api/payment/channel/mock/isv-info.api';

  import { computed, ref, watch } from 'vue';
  import { useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { PageTitleBar } from '@daxpay/ui-biz/components/page-title-bar';
  import { useDynamicTabTitle } from '@daxpay/ui-biz/hooks/useDynamicTabTitle';

  import { MockIsvInfoApi } from '#/api/payment/channel/mock/isv-info.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { MockIsvPaths } from '#/constants/isv-provider-paths';
  import { useMessage } from '#/hooks/useMessage';
  import { useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import MockIsvCredentialConfig from './config/MockIsvCredentialConfig.vue';

  /**
   * 模拟服务商工作台(单个服务商的磁贴总览)
   *
   * 基础信息(名称可改, 编号/状态只读) + 接入配置(网关地址与服务商级签名密钥)
   * + 管理操作(启用/停用绑定、启用/停用支付、删除服务商);
   * 不含费率与应用管理(open 版无费率域, mock 无微信应用域)。
   */
  defineOptions({ name: 'MockIsvWorkbench' });

  const router = useRouter();
  const { confirm, message } = useMessage();
  const { setTabObjectTitle } = useDynamicTabTitle($t('payment.channel.mock.isv.workbenchTitle'));

  const routeContext = useRequiredRouteQuery({
    keys: ['id'],
    messageKey: computed(() => 'payment.channel.mock.isv.notFound'),
    fallbackPath: computed(() => MockIsvPaths.MANAGE),
  });

  const loading = ref(false);
  const saving = ref(false);
  const profile = ref<MockIsvInfoResult>({});
  // 当前打开的抽屉('' = 总览)
  const activeDrawer = ref('');
  // 基础信息表单(名称可改, 编号/状态只读)
  const nameForm = ref<{ isvName: string }>({ isvName: '' });
  const nameFormRef = ref();
  // 服务商级接入配置抽屉
  const credentialRef = ref<InstanceType<typeof MockIsvCredentialConfig>>();

  // 路由 id 经 useRequiredRouteQuery 归一(空串/纯空白视为缺失)
  const isvId = computed(() => routeContext.query.value.id);
  const displayName = computed(() => profile.value.isvName || '');

  const nameRules = {
    // 国际化: 服务商名称
    isvName: [{ required: true, message: $t('payment.channel.mock.isv.isvNameRequired') }],
  };

  /** 功能磁贴分组(基础配置 + 管理操作; 无费率/应用组) */
  const tileGroups = computed(() => [
    {
      // 国际化: 基础配置
      group: $t('payment.channel.mock.isv.groupBasic'),
      color: 'blue',
      cards: [
        {
          key: 'basic',
          // 国际化: 基础信息
          title: $t('payment.channel.mock.isv.cardBasicInfo'),
          icon: 'ant-design:info-circle-outlined',
          description: $t('payment.channel.mock.isv.cardBasicInfoDesc'),
        },
        {
          key: 'access',
          // 国际化: 接入配置
          title: $t('payment.channel.mock.isv.cardAccess'),
          icon: 'ant-design:api-outlined',
          description: $t('payment.channel.mock.isv.cardAccessDesc'),
        },
      ],
    },
    {
      // 国际化: 管理操作
      group: $t('payment.channel.mock.isv.groupManage'),
      color: 'red',
      cards: [
        {
          key: 'toggle',
          title: profile.value.enable
            ? $t('payment.channel.mock.isv.cardToggleEnable')
            : $t('payment.channel.mock.isv.cardToggleDisable'),
          icon: 'ant-design:team-outlined',
          description: profile.value.enable
            ? $t('payment.channel.mock.isv.cardToggleEnableDesc')
            : $t('payment.channel.mock.isv.cardToggleDisableDesc'),
        },
        {
          key: 'pay-toggle',
          title: profile.value.payEnable
            ? $t('payment.channel.mock.isv.cardTogglePayEnable')
            : $t('payment.channel.mock.isv.cardTogglePayDisable'),
          icon: 'ant-design:pay-circle-outlined',
          description: profile.value.payEnable
            ? $t('payment.channel.mock.isv.cardTogglePayEnableDesc')
            : $t('payment.channel.mock.isv.cardTogglePayDisableDesc'),
        },
        {
          key: 'delete',
          // 国际化: 删除服务商
          title: $t('payment.channel.mock.isv.cardDelete'),
          icon: 'ant-design:delete-outlined',
          description: $t('payment.channel.mock.isv.cardDeleteDesc'),
        },
      ],
    },
  ]);

  /**
   * 加载服务商详情
   */
  function loadProfile() {
    if (!isvId.value) {
      return;
    }
    loading.value = true;
    // find 是后端接口方法名(非数组查找), unicorn 回调引用规则在此属误报
    // eslint-disable-next-line unicorn/no-array-callback-reference
    MockIsvInfoApi.find(isvId.value)
      .then(({ data }) => {
        profile.value = data || {};
        nameForm.value = { isvName: profile.value.isvName || '' };
        // 页签标题动态化: 「{服务商名} · 模拟服务商工作台」
        setTabObjectTitle(displayName.value);
      })
      .finally(() => {
        loading.value = false;
      });
  }

  /** 磁贴点击分发 */
  function handleTileSelect(key: string) {
    if (key === 'basic') {
      activeDrawer.value = 'basic';
      return;
    }
    if (key === 'access') {
      credentialRef.value?.show(profile.value.isvNo || '');
      return;
    }
    if (key === 'toggle') {
      handleToggleEnable();
      return;
    }
    if (key === 'pay-toggle') {
      handleTogglePayEnable();
      return;
    }
    if (key === 'delete') {
      handleDelete();
    }
  }

  /**
   * 保存基础信息(仅名称可改, 全量提交当前启停状态)
   */
  function handleSaveBasic() {
    nameFormRef.value
      ?.validate()
      .then(() => {
        saving.value = true;
        MockIsvInfoApi.update({
          id: isvId.value,
          isvName: nameForm.value.isvName,
          enable: profile.value.enable ?? true,
          payEnable: profile.value.payEnable ?? true,
        })
          .then(() => {
            profile.value.isvName = nameForm.value.isvName;
            activeDrawer.value = '';
            setTabObjectTitle(nameForm.value.isvName);
            message.success($t('payment.channel.mock.isv.updateSuccess'));
          })
          .finally(() => {
            saving.value = false;
          });
      })
      .catch(() => {});
  }

  /**
   * 启用/停用绑定(新通道商户绑定候选池; 不影响存量与支付)
   */
  function handleToggleEnable() {
    const enable = !profile.value.enable;
    confirm({
      title: enable
        ? $t('payment.channel.mock.isv.confirmEnableTitle')
        : $t('payment.channel.mock.isv.confirmDisableTitle'),
      content: enable
        ? $t('payment.channel.mock.isv.confirmEnableContent', { name: displayName.value })
        : $t('payment.channel.mock.isv.confirmDisableContent', { name: displayName.value }),
      onOk: () => {
        return MockIsvInfoApi.update({
          id: isvId.value,
          isvName: displayName.value,
          enable,
          payEnable: profile.value.payEnable ?? true,
        }).then(() => {
          profile.value.enable = enable;
          message.success(
            enable ? $t('payment.channel.mock.isv.enableSuccess') : $t('payment.channel.mock.isv.disableSuccess'),
          );
        });
      },
    });
  }

  /**
   * 启用/停用支付(仅拦新支付, 退款/关单/查询/回调不受影响)
   */
  function handleTogglePayEnable() {
    const payEnable = !profile.value.payEnable;
    confirm({
      title: payEnable
        ? $t('payment.channel.mock.isv.confirmPayEnableTitle')
        : $t('payment.channel.mock.isv.confirmPayDisableTitle'),
      content: payEnable
        ? $t('payment.channel.mock.isv.confirmPayEnableContent', { name: displayName.value })
        : $t('payment.channel.mock.isv.confirmPayDisableContent', { name: displayName.value }),
      onOk: () => {
        return MockIsvInfoApi.update({
          id: isvId.value,
          isvName: displayName.value,
          enable: profile.value.enable ?? true,
          payEnable,
        }).then(() => {
          profile.value.payEnable = payEnable;
          message.success(
            payEnable
              ? $t('payment.channel.mock.isv.payEnableSuccess')
              : $t('payment.channel.mock.isv.payDisableSuccess'),
          );
        });
      },
    });
  }

  /**
   * 删除服务商(名下仍有通道商户时后端拒绝, 成功后返回列表)
   */
  function handleDelete() {
    confirm({
      title: $t('payment.channel.mock.isv.deleteConfirmTitle'),
      content: $t('payment.channel.mock.isv.deleteConfirmContent', { name: displayName.value }),
      okText: $t('common.delete'),
      cancelText: $t('common.cancel'),
      onOk: () => {
        return MockIsvInfoApi.delete(isvId.value).then(() => {
          message.success($t('payment.channel.mock.isv.deleteSuccess'));
          router.push({ path: MockIsvPaths.MANAGE });
        });
      },
    });
  }

  /** 返回服务商管理页 */
  function handleBack() {
    router.push({ path: MockIsvPaths.MANAGE });
  }

  /** 分组主题色(左侧竖条) */
  function getGroupColorClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-blue-500',
      red: 'bg-red-500',
    };
    return map[color] || 'bg-gray-500';
  }

  /** 图标底色(按分组) */
  function getIconBgClass(color: string) {
    const map: Record<string, string> = {
      blue: 'bg-primary/10 text-primary',
      red: 'bg-red-500/10 text-red-500',
    };
    return map[color] || 'bg-muted text-muted-foreground';
  }

  // 路由 id 变化(同一路由多实例)与必填参数校验通过后加载详情
  watch(
    () => [isvId.value, routeContext.isValid.value] as const,
    ([id, valid]) => {
      if (valid && id) {
        loadProfile();
      }
    },
    { immediate: true },
  );
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.channel.mock.isv.notFound')"
    :back-text="$t('payment.channel.mock.isv.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-3">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <!-- 标题栏: 返回 + 功能名 + (服务商名) -->
        <PageTitleBar
          :title="$t('payment.channel.mock.isv.workbenchTitle')"
          :name="displayName"
          back
          @back="handleBack"
        />
      </template>

      <a-spin :spinning="loading">
        <div v-if="!loading && !profile.id" class="flex flex-col items-center justify-center py-16">
          <!-- 国际化: 服务商不存在 -->
          <p class="mb-2 text-base text-muted-foreground">{{ $t('payment.channel.mock.isv.notFound') }}</p>
          <p class="text-sm text-muted-foreground/70">{{ $t('payment.channel.mock.isv.notFoundDesc') }}</p>
        </div>
        <div v-else class="py-4">
          <div v-for="group in tileGroups" :key="group.group" class="mb-10 last:mb-0">
            <div class="mb-6 flex items-center gap-3 px-2">
              <div class="h-6 w-1.5 rounded-full shadow-sm" :class="getGroupColorClass(group.color)"></div>
              <span class="text-xl font-extrabold tracking-tight text-foreground">{{ group.group }}</span>
            </div>
            <div class="card-grid">
              <a-card
                v-for="card in group.cards"
                :key="card.key"
                hoverable
                class="isv-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                :styles="{ body: { padding: '16px' } }"
                @click="handleTileSelect(card.key)"
              >
                <div class="flex flex-col items-center text-center">
                  <div
                    class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
                    :class="getIconBgClass(group.color)"
                  >
                    <IconifyIcon :icon="card.icon" class="h-7 w-7" />
                  </div>
                  <div
                    class="mb-1.5 text-base font-bold text-foreground transition-colors duration-300 group-hover:text-primary"
                  >
                    {{ card.title }}
                  </div>
                  <a-tooltip :title="card.description" placement="bottom">
                    <div class="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                      {{ card.description }}
                    </div>
                  </a-tooltip>
                </div>
                <div
                  class="absolute bottom-0 left-0 h-1.5 w-0 transition-all duration-300 group-hover:w-full"
                  :class="getGroupColorClass(group.color)"
                ></div>
              </a-card>
            </div>
          </div>
        </div>
      </a-spin>
    </a-card>

    <!-- 基础信息抽屉(名称可编辑, 编号/状态只读) -->
    <a-drawer
      :open="activeDrawer === 'basic'"
      :title="$t('payment.channel.mock.isv.cardBasicInfo')"
      :default-size="480"
      resizable
      destroy-on-hidden
      @close="activeDrawer = ''"
    >
      <template #footer>
        <a-space>
          <a-button type="primary" :loading="saving" @click="handleSaveBasic">
            {{ $t('common.save') }}
          </a-button>
        </a-space>
      </template>
      <a-form
        ref="nameFormRef"
        :model="nameForm"
        :rules="nameRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <!-- 国际化: 服务商编号 -->
        <a-form-item :label="$t('payment.channel.mock.isv.isvNo')">
          <span class="text-muted-foreground">{{ profile.isvNo || '-' }}</span>
        </a-form-item>
        <!-- 国际化: 服务商名称 -->
        <a-form-item :label="$t('payment.channel.mock.isv.isvName')" name="isvName">
          <a-input
            v-model:value="nameForm.isvName"
            :maxlength="100"
            :placeholder="$t('payment.channel.mock.isv.isvNamePlaceholder')"
          />
        </a-form-item>
        <!-- 国际化: 启用绑定状态 -->
        <a-form-item :label="$t('payment.channel.mock.isv.enable')">
          <a-tag :color="profile.enable ? 'green' : 'default'">
            {{ profile.enable ? $t('payment.channel.mock.isv.enableOn') : $t('payment.channel.mock.isv.enableOff') }}
          </a-tag>
        </a-form-item>
        <!-- 国际化: 启用支付状态 -->
        <a-form-item :label="$t('payment.channel.mock.isv.payEnable')">
          <a-tag :color="profile.payEnable ? 'green' : 'default'">
            {{
              profile.payEnable
                ? $t('payment.channel.mock.isv.payEnableOn')
                : $t('payment.channel.mock.isv.payEnableOff')
            }}
          </a-tag>
        </a-form-item>
        <!-- 国际化: 凭证配置状态 -->
        <a-form-item :label="$t('payment.channel.mock.isv.credentialStatus')">
          <a-tag :color="profile.credentialConfigured ? 'green' : 'orange'">
            {{
              profile.credentialConfigured
                ? $t('payment.channel.mock.isv.credentialConfigured')
                : $t('payment.channel.mock.isv.credentialNotConfigured')
            }}
          </a-tag>
        </a-form-item>
      </a-form>
    </a-drawer>

    <!-- 服务商级接入配置抽屉(网关地址 + 两段 PEM, 保存成功后刷新凭证状态) -->
    <MockIsvCredentialConfig ref="credentialRef" @saved="loadProfile" />
  </div>
</template>

<style scoped>
  .isv-card {
    min-height: 200px;
  }

  .line-clamp-1 {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
</style>
