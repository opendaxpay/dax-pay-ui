<script lang="ts" setup>
  import type { LabelValue } from '#/types/web';

  import { computed, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';

  import { $t } from '@vben/locales';

  import { IconifyIcon } from '@vben-core/icons';

  import { MchAppInfoApi, type MchAppInfoResult } from '#/api/payment/merchant/mch-app-info.api';
  import {
    AggregateConfigApi,
    type AggregateConfigResult,
    type AggregateSceneParam,
  } from '#/api/payment/merchant/aggregate.api';
  import { PayRouteApi } from '#/api/payment/route/pay-route.api';
  import RouteQueryMissingState from '#/components/route/RouteQueryMissingState.vue';
  import { useMessage } from '#/hooks/useMessage';
  import { normalizeRouteQueryValue, useRequiredRouteQuery } from '#/hooks/useRequiredRouteQuery';

  import { AGGREGATE_LEVEL, AGGREGATE_SCENES, type AggregateLevel } from './shared/constants';

  defineOptions({ name: 'AggregateScanConfig' });

  const route = useRoute();
  const router = useRouter();
  const { confirm, message } = useMessage();

  // 路由参数校验: mchNo + appId 必传
  const routeContext = useRequiredRouteQuery({
    keys: ['mchNo', 'appId'],
    messageKey: computed(() =>
      normalizeRouteQueryValue(route.query.mchNo)
        ? 'payment.merchant.aggregate.aggregate.missingAppContext'
        : 'payment.common.route.missingMchNo',
    ),
    fallbackPath: computed(() => {
      const no = normalizeRouteQueryValue(route.query.mchNo);
      return no ? { path: '/payment/merchant/app', query: { mchNo: no } } : '/payment/merchant';
    }),
  });

  const mchNo = computed(() => routeContext.query.value.mchNo);
  const appId = computed(() => routeContext.query.value.appId);

  // 页面状态
  const loading = ref(false);
  const editing = ref(false);
  const appInfo = ref<MchAppInfoResult>({});
  const config = ref<AggregateConfigResult>({});

  // 编辑态
  const editLevel = ref<AggregateLevel>(AGGREGATE_LEVEL.AUTO);
  const autoLaunch = ref(false);
  // 每场景的编辑数据: scene → { method, channelMchNo, capability }
  const sceneForm = ref<Record<string, AggregateSceneParam>>({});

  // 候选数据
  const methodDirectory = ref<Record<string, LabelValue[]>>({}); // provider → 方式列表
  const channelMchMap = ref<Record<string, LabelValue[]>>({}); // scene → 通道商户列表
  const capabilityMap = ref<Record<string, LabelValue[]>>({}); // scene → 能力列表

  // 生效模式(服务端)
  const effectiveLevel = computed(() => config.value.level || AGGREGATE_LEVEL.AUTO);
  const isLevelActive = computed(() => editLevel.value === effectiveLevel.value);

  // 模式提示
  const modeHint = computed(() => {
    const key = editLevel.value;
    if (key === AGGREGATE_LEVEL.AUTO) {
      return $t('payment.merchant.aggregate.aggregate.autoModeHint');
    }
    if (key === AGGREGATE_LEVEL.METHOD) {
      return $t('payment.merchant.aggregate.aggregate.methodModeHint');
    }
    return $t('payment.merchant.aggregate.aggregate.directModeHint');
  });

  /** 场景国际化名 */
  function sceneLabel(scene: string) {
    return $t(`payment.merchant.aggregate.aggregate.scenes.${scene}`);
  }

  /** 初始化每场景编辑数据 */
  function initSceneForm() {
    const form: Record<string, AggregateSceneParam> = {};
    for (const sc of AGGREGATE_SCENES) {
      const serverScene = config.value.scenes?.find((s) => s.scene === sc.scene);
      form[sc.scene] = {
        scene: sc.scene,
        method: serverScene?.method || '',
        channelMchNo: serverScene?.channelMchNo || '',
        capability: serverScene?.capability || '',
      };
    }
    sceneForm.value = form;
  }

  /** 获取某场景编辑数据 */
  function getSceneData(scene: string) {
    if (!sceneForm.value[scene]) {
      sceneForm.value[scene] = { scene, method: '', channelMchNo: '', capability: '' };
    }
    return sceneForm.value[scene]!;
  }

  /** METHOD 模式: 某渠道下可选支付方式 */
  function methodOptions(provider: string) {
    return methodDirectory.value[provider] || [];
  }

  /** DIRECT 模式: 某场景可选通道商户 */
  function channelMchOptions(scene: string) {
    return channelMchMap.value[scene] || [];
  }

  /** DIRECT 模式: 某场景可选能力 */
  function capabilityOptions(scene: string) {
    return capabilityMap.value[scene] || [];
  }

  /** 加载支付方式目录(METHOD 模式用) */
  async function loadMethodDirectory() {
    const { data } = await PayRouteApi.listMethodDirectoryFlat();
    const map: Record<string, LabelValue[]> = {};
    for (const item of data || []) {
      if (!map[item.provider]) {
        map[item.provider] = [];
      }
      map[item.provider]!.push({ label: item.methodLabel || item.method, value: item.method });
    }
    methodDirectory.value = map;
  }

  /** 加载通道商户候选(DIRECT 模式用) */
  async function loadChannelMchCandidates() {
    const map: Record<string, LabelValue[]> = {};
    await Promise.all(
      AGGREGATE_SCENES.map(async (sc) => {
        const { data } = await PayRouteApi.listSceneChannelMchCandidates({
          appId: appId.value,
          provider: sc.provider,
        });
        map[sc.scene] = data || [];
      }),
    );
    channelMchMap.value = map;
  }

  /** 某场景选中通道商户后加载能力候选 */
  async function loadCapabilityForScene(scene: string, channelMchNo: string) {
    const sc = AGGREGATE_SCENES.find((s) => s.scene === scene);
    if (!sc || !channelMchNo) {
      capabilityMap.value = { ...capabilityMap.value, [scene]: [] };
      return;
    }
    const { data } = await PayRouteApi.listSceneCapabilityCandidates({
      appId: appId.value,
      provider: sc.provider,
      method: sc.defaultMethod,
      channelMchNo,
    });
    capabilityMap.value = { ...capabilityMap.value, [scene]: data || [] };
  }

  /** 加载应用信息 */
  async function loadAppInfo() {
    if (!mchNo.value || !appId.value) return;
    const { data } = await MchAppInfoApi.page({ mchNo: mchNo.value, current: 1, size: 200 });
    const app = data?.records?.find((a) => a.appId === appId.value);
    appInfo.value = app || {};
  }

  /** 加载配置 */
  async function loadConfig() {
    if (!appId.value) return;
    loading.value = true;
    const { data } = await AggregateConfigApi.getByAppId(appId.value);
    config.value = data || {};
    editLevel.value = (effectiveLevel.value as AggregateLevel) || AGGREGATE_LEVEL.AUTO;
    autoLaunch.value = config.value.autoLaunch || false;
    initSceneForm();
    loading.value = false;
  }

  /** 返回应用列表 */
  function handleBack() {
    router.push({ path: '/payment/merchant/app', query: { mchNo: mchNo.value } });
  }

  /** 进入编辑 */
  async function startEdit() {
    editing.value = true;
    initSceneForm();
    // 按模式加载候选
    if (editLevel.value === AGGREGATE_LEVEL.METHOD) {
      await loadMethodDirectory();
    } else if (editLevel.value === AGGREGATE_LEVEL.DIRECT) {
      await loadChannelMchCandidates();
      // 对已选通道商户的场景加载能力候选
      for (const sc of AGGREGATE_SCENES) {
        const sd = getSceneData(sc.scene);
        if (sd.channelMchNo) {
          await loadCapabilityForScene(sc.scene, sd.channelMchNo);
        }
      }
    }
  }

  /** 保存 */
  function save() {
    // 按模式校验
    if (editLevel.value === AGGREGATE_LEVEL.METHOD) {
      for (const sc of AGGREGATE_SCENES) {
        if (!getSceneData(sc.scene).method) {
          message.error(
            $t('payment.merchant.aggregate.aggregate.methodPlaceholder') +
              ': ' +
              sceneLabel(sc.scene),
          );
          return;
        }
      }
    } else if (editLevel.value === AGGREGATE_LEVEL.DIRECT) {
      for (const sc of AGGREGATE_SCENES) {
        const sd = getSceneData(sc.scene);
        if (!sd.channelMchNo) {
          message.error(
            $t('payment.merchant.aggregate.aggregate.channelMerchantPlaceholder') +
              ': ' +
              sceneLabel(sc.scene),
          );
          return;
        }
      }
    }

    confirm({
      content: $t('payment.merchant.aggregate.aggregate.saveConfirm'),
      async onOk() {
        const scenes =
          editLevel.value === AGGREGATE_LEVEL.AUTO
            ? []
            : Object.values(sceneForm.value);
        await AggregateConfigApi.saveOrUpdate({
          mchNo: mchNo.value,
          appId: appId.value,
          level: editLevel.value,
          autoLaunch: autoLaunch.value,
          scenes,
        });
        message.success($t('common.operationSuccess'));
        editing.value = false;
        await loadConfig();
      },
    });
  }

  /** 取消编辑 */
  function cancel() {
    editing.value = false;
    initSceneForm();
    autoLaunch.value = config.value.autoLaunch || false;
    editLevel.value = effectiveLevel.value as AggregateLevel;
  }

  // 编辑模式下切换模式时加载候选
  watch(editLevel, async (level, prev) => {
    if (!editing.value || level === prev) return;
    if (level === AGGREGATE_LEVEL.METHOD) {
      await loadMethodDirectory();
    } else if (level === AGGREGATE_LEVEL.DIRECT) {
      await loadChannelMchCandidates();
    }
  });

  /** DIRECT 模式: 通道商户变更时加载能力候选并清空旧值 */
  async function onChannelMchChange(scene: string, channelMchNo: any) {
    const sd = getSceneData(scene);
    sd.channelMchNo = channelMchNo || '';
    sd.capability = '';
    if (channelMchNo) {
      await loadCapabilityForScene(scene, channelMchNo);
    } else {
      capabilityMap.value = { ...capabilityMap.value, [scene]: [] };
    }
  }

  onMounted(async () => {
    if (!routeContext.isValid.value) return;
    await loadAppInfo();
    await loadConfig();
  });
</script>

<template>
  <RouteQueryMissingState
    v-if="!routeContext.isValid"
    :description="$t('payment.merchant.aggregate.aggregate.missingAppContext')"
    :back-text="$t('payment.merchant.workbench.workbench.backToList')"
    @back="routeContext.goFallback"
  />
  <div v-else class="m-4">
    <a-card variant="borderless" class="rounded-xl shadow-sm">
      <template #title>
        <div class="flex items-center gap-2">
          <a-button type="text" @click="handleBack">
            <template #icon>
              <IconifyIcon icon="ant-design:arrow-left-outlined" />
            </template>
          </a-button>
          <span class="text-lg font-bold">{{ $t('payment.merchant.aggregate.aggregate.title') }}</span>
          <span v-if="appInfo.appName" class="text-sm text-muted-foreground">
            ({{ appInfo.appName }})
          </span>
        </div>
      </template>

      <template #extra>
        <div class="flex gap-2">
          <a-button v-if="!editing" type="primary" @click="startEdit">
            {{ $t('common.edit') }}
          </a-button>
          <template v-else>
            <a-button type="primary" @click="save">{{ $t('common.save') }}</a-button>
            <a-button @click="cancel">{{ $t('common.cancel') }}</a-button>
          </template>
        </div>
      </template>

      <a-spin :spinning="loading">
        <!-- 模式切换 -->
        <div class="mb-4 flex items-center gap-3">
          <span class="text-sm font-medium">{{ $t('payment.merchant.aggregate.aggregate.editModeLabel') }}</span>
          <a-radio-group v-model:value="editLevel" button-style="solid" :disabled="!editing">
            <a-radio-button :value="AGGREGATE_LEVEL.AUTO">
              {{ $t('payment.merchant.aggregate.aggregate.modeAuto') }}
            </a-radio-button>
            <a-radio-button :value="AGGREGATE_LEVEL.METHOD">
              {{ $t('payment.merchant.aggregate.aggregate.modeMethod') }}
            </a-radio-button>
            <a-radio-button :value="AGGREGATE_LEVEL.DIRECT">
              {{ $t('payment.merchant.aggregate.aggregate.modeDirect') }}
            </a-radio-button>
          </a-radio-group>
          <a-tag v-if="isLevelActive && !editing" color="green">
            {{ $t('payment.merchant.aggregate.aggregate.levelActive') }}
          </a-tag>
        </div>

        <!-- 模式提示 -->
        <a-alert :message="modeHint" type="info" show-icon class="mb-4" />

        <!-- 自动拉起 -->
        <div class="mb-4">
          <a-checkbox v-model:checked="autoLaunch" :disabled="!editing">
            {{ $t('payment.merchant.aggregate.aggregate.autoLaunch') }}
          </a-checkbox>
          <span class="ml-2 text-xs text-muted-foreground">
            {{ $t('payment.merchant.aggregate.aggregate.autoLaunchHint') }}
          </span>
        </div>

        <!-- 场景配置 -->
        <div class="scene-list">
          <div v-for="sc in AGGREGATE_SCENES" :key="sc.scene" class="scene-row">
            <div class="scene-label">
              <span class="font-medium">{{ sceneLabel(sc.scene) }}</span>
            </div>

            <!-- AUTO 模式: 只读提示 -->
            <div v-if="editLevel === AGGREGATE_LEVEL.AUTO" class="scene-content">
              <a-tag color="blue">
                {{ $t('payment.merchant.aggregate.aggregate.autoDerived') }}: {{ sc.defaultMethod }}
              </a-tag>
            </div>

            <!-- METHOD 模式: 选支付方式 -->
            <div v-else-if="editLevel === AGGREGATE_LEVEL.METHOD" class="scene-content">
              <a-select
                :value="getSceneData(sc.scene).method"
                :options="methodOptions(sc.provider)"
                :placeholder="$t('payment.merchant.aggregate.aggregate.methodPlaceholder')"
                :disabled="!editing"
                allow-clear
                style="width: 240px"
                @change="(val: any) => (getSceneData(sc.scene).method = val)"
              />
            </div>

            <!-- DIRECT 模式: 选通道商户 + 能力 -->
            <div v-else class="scene-content direct-content">
              <a-select
                :value="getSceneData(sc.scene).channelMchNo"
                :options="channelMchOptions(sc.scene)"
                :placeholder="$t('payment.merchant.aggregate.aggregate.channelMerchantPlaceholder')"
                :disabled="!editing"
                allow-clear
                style="width: 240px"
                @change="(val: any) => onChannelMchChange(sc.scene, val)"
              />
              <a-select
                :value="getSceneData(sc.scene).capability"
                :options="capabilityOptions(sc.scene)"
                :placeholder="$t('payment.merchant.aggregate.aggregate.capabilityPlaceholder')"
                :disabled="!editing || !getSceneData(sc.scene).channelMchNo"
                allow-clear
                style="width: 240px"
                @change="(val: any) => (getSceneData(sc.scene).capability = val)"
              />
            </div>
          </div>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<style scoped>
  .scene-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    background: hsl(var(--muted) / 0.3);
    border-radius: 12px;
  }

  .scene-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .scene-label {
    flex-shrink: 0;
    width: 100px;
  }

  .scene-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .direct-content {
    flex-wrap: wrap;
  }
</style>
