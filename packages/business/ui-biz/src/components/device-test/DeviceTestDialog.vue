<script lang="ts" setup>
  import type { DeviceTestParam } from './types';

  import { computed, ref, watch } from 'vue';

  import { $t } from '@vben/locales';

  import { providerI18nMap } from '../../enums/payment';
  import { useMessage } from '../../hooks/useMessage';
  import { PRINT_TEMPLATE_CODES } from './types';

  /**
   * 虚拟设备试播/试打弹窗(简版, 运营端与商户端共用)
   *
   * 设计取舍(自 plus 裁剪):
   * - **接口由调用方注入**(fetchSpeech/submit), 组件不绑死某一端端点, 两端共用同一交互;
   * - **试播**: 金额+收款方式轻量表单, 附「预计播报」文本区; 调用方提供 fetchSpeech 时
   *   随参数防抖自动刷新预览, 未提供时由 submit 返回的文本回填(单端点一发一收场景);
   * - **试打**: 无模板列表接口与纸面预览端点, 简化为弹窗表单——金额/收款方式/输出模式
   *   (播报+打印 或 仅打印)/商户单号/版式下拉(内置枚举 templateCode, 首期仅 standard 标准小票);
   * - 四种输出: 试播走入口区分, 试打 PRINT_BOTH(播报+打印)/PRINT_ONLY(仅打印)。
   */
  defineOptions({ name: 'DeviceTestDialog' });

  const props = withDefaults(
    defineProps<{
      /** 试播提交成功提示文案 key(默认「指令已下发」口径; 调用端如需自定义提示可传) */
      announceSuccessKey?: string;
      /** 设备主键 */
      deviceId?: string;
      /** 设备号(标题展示) */
      deviceNo?: string;
      /** 预计播报文案取数(试播模式; 提供时随参数防抖自动刷新) */
      fetchSpeech?: (amountFen: number, channel: string) => Promise<string>;
      /** 'announce'=试播 / 'print'=试打 */
      mode: 'announce' | 'print';
      /** 弹窗开关 */
      open: boolean;
      /** 下发(试播/试打共用), 返回 msgId 或播报文本 */
      submit: (param: DeviceTestParam) => Promise<string>;
    }>(),
    { announceSuccessKey: 'components.deviceTest.announceSent', deviceId: undefined, deviceNo: undefined, fetchSpeech: undefined },
  );

  const emit = defineEmits<{ sent: [msgId: string]; 'update:open': [boolean] }>();

  /** 收款方式选项(与后端 PayProviderEnum code 对齐, 文案走各端语言包) */
  const CHANNELS = ['wechat', 'alipay', 'union_pay', 'douyin', 'aggregate_pay'].map((value) => ({
    label: $t(providerI18nMap[value] ?? ''),
    value,
  }));

  /** 版式下拉(内置枚举, 文案 key: components.deviceTest.template.{code}) */
  const TEMPLATE_OPTIONS = PRINT_TEMPLATE_CODES.map((code) => ({
    label: $t(`components.deviceTest.template.${code}`),
    value: code,
  }));

  const { message } = useMessage();

  const openModel = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
  });
  const isAnnounce = computed(() => props.mode === 'announce');
  // 弹窗标题(试播/试打 · 设备号)
  const title = computed(
    () => `${$t(isAnnounce.value ? 'components.deviceTest.title.announce' : 'components.deviceTest.title.print')}${props.deviceNo ? ` · ${props.deviceNo}` : ''}`,
  );

  const amount = ref(12.5);
  const channel = ref('wechat');
  const outBizNo = ref('');
  const templateCode = ref<string>(PRINT_TEMPLATE_CODES[0]);
  const printMode = ref<'PRINT_BOTH' | 'PRINT_ONLY'>('PRINT_BOTH');
  const speech = ref('');
  const sending = ref(false);

  /** 播报文案防抖定时器 */
  let speechTimer: null | ReturnType<typeof setTimeout> = null;
  /** 文案请求序号: 只采纳最后一次请求的结果, 防止慢响应覆盖新文案 */
  let speechSeq = 0;

  /** 商户订单号缺省生成(TEST 前缀, 仅供票面变量展示) */
  function genOutBizNo(): string {
    return `TEST${Date.now().toString().slice(-10)}`;
  }

  function reset() {
    // 作废上一次打开会话的在途请求与待触发的防抖, 避免旧结果污染新会话
    if (speechTimer) {
      clearTimeout(speechTimer);
      speechTimer = null;
    }
    speechSeq += 1;
    amount.value = 12.5;
    channel.value = 'wechat';
    outBizNo.value = isAnnounce.value ? '' : genOutBizNo();
    templateCode.value = PRINT_TEMPLATE_CODES[0];
    printMode.value = 'PRINT_BOTH';
    speech.value = '';
  }

  /** 金额换算为分(0.01~999999.99 由输入框自身约束, 此处兜底取整) */
  function amountFen(): number {
    return Math.round((Number(amount.value) || 0) * 100);
  }

  function buildParam(): DeviceTestParam {
    return {
      id: props.deviceId,
      amountFen: amountFen(),
      channel: channel.value,
      // 商户单号与版式仅试打模式有意义
      outBizNo: isAnnounce.value ? undefined : outBizNo.value || undefined,
      templateCode: isAnnounce.value ? undefined : templateCode.value,
      mode: isAnnounce.value ? undefined : printMode.value,
    };
  }

  /** 试播: 预计播报文案(随金额/渠道变化即时回显; 取数失败静默不打扰用户) */
  async function refreshSpeech() {
    if (!isAnnounce.value || !props.fetchSpeech) {
      return;
    }
    const seq = ++speechSeq;
    try {
      const text = await props.fetchSpeech(amountFen(), channel.value);
      if (seq === speechSeq) {
        speech.value = text ?? '';
      }
    } catch {
      if (seq === speechSeq) {
        speech.value = '';
      }
    }
  }

  function scheduleSpeech() {
    if (speechTimer) {
      clearTimeout(speechTimer);
    }
    speechTimer = setTimeout(refreshSpeech, 300);
  }

  watch(
    () => props.open,
    (value) => {
      if (value) {
        reset();
        // 提供了取数函数时打开即刷新一次预览
        if (props.fetchSpeech) {
          refreshSpeech();
        }
      }
    },
  );

  watch([amount, channel], () => {
    // 试播模式且提供了取数函数时, 参数变化防抖刷新预览
    if (props.open && props.fetchSpeech) {
      scheduleSpeech();
    }
  });

  /** 下发(试播 audio.test / 试打 print.ticket) */
  async function handleSubmit() {
    if (!props.deviceId) {
      return;
    }
    if (amountFen() < 1 || amountFen() > 99_999_999) {
      message.warning($t('components.deviceTest.amountRangeWarning'));
      return;
    }
    sending.value = true;
    try {
      const result = await props.submit(buildParam());
      message.success(
        $t(
          isAnnounce.value
            ? props.announceSuccessKey
            : 'components.deviceTest.printSent',
        ),
      );
      // 单端点一发一收场景(未提供取数函数): submit 返回的是预计播报文本, 回填预览区;
      // 已提供取数函数时 submit 返回 msgId(真下发), 不回填避免 msgId 覆盖文案
      if (isAnnounce.value && result && !props.fetchSpeech) {
        speech.value = result;
      }
      emit('sent', result);
    } finally {
      sending.value = false;
    }
  }
</script>

<template>
  <a-modal
    v-model:open="openModel"
    :cancel-text="$t('components.deviceTest.close')"
    :confirm-loading="sending"
    :mask-closable="false"
    :ok-text="$t(isAnnounce ? 'components.deviceTest.send.announce' : 'components.deviceTest.send.print')"
    :title="title"
    :width="560"
    :destroy-on-hidden="true"
    @ok="handleSubmit"
  >
    <a-form layout="vertical">
      <!-- 金额(元) -->
      <a-form-item :label="$t('components.deviceTest.amount')">
        <a-input-number v-model:value="amount" :max="999_999.99" :min="0.01" :precision="2" class="w-full" />
        <div class="dt-quick">
          <a-tag v-for="v in [0.01, 1, 12.5, 100, 9999.99]" :key="v" class="dt-quick-tag" @click="amount = v">
            {{ v }}
          </a-tag>
        </div>
      </a-form-item>

      <!-- 收款方式 -->
      <a-form-item :label="$t('components.deviceTest.channel')">
        <a-select v-model:value="channel" :options="CHANNELS" />
      </a-form-item>

      <template v-if="isAnnounce">
        <!-- 预计播报(平台镜像终端词元规则; 未提供取数函数时由下发结果回填) -->
        <a-form-item :label="$t('components.deviceTest.speechLabel')">
          <div class="dt-speech">{{ speech || $t('components.deviceTest.speechEmpty') }}</div>
          <div class="dt-hint">{{ $t('components.deviceTest.speechHint') }}</div>
        </a-form-item>
      </template>

      <template v-else>
        <!-- 输出模式(播报+打印 / 仅打印) -->
        <a-form-item :label="$t('components.deviceTest.printModeLabel')">
          <a-radio-group v-model:value="printMode" button-style="solid">
            <a-radio-button value="PRINT_BOTH">{{ $t('components.deviceTest.printMode.both') }}</a-radio-button>
            <a-radio-button value="PRINT_ONLY">{{ $t('components.deviceTest.printMode.only') }}</a-radio-button>
          </a-radio-group>
        </a-form-item>

        <!-- 商户单号(可选) -->
        <a-form-item :label="$t('components.deviceTest.outBizNo')">
          <a-input
            v-model:value="outBizNo"
            :placeholder="$t('components.deviceTest.outBizNoPlaceholder')"
          >
            <template #suffix>
              <a-button size="small" type="link" @click="outBizNo = genOutBizNo()">
                {{ $t('components.deviceTest.outBizNoGen') }}
              </a-button>
            </template>
          </a-input>
        </a-form-item>

        <!-- 打印版式(内置枚举, 首期仅标准小票) -->
        <a-form-item :label="$t('components.deviceTest.templateLabel')">
          <a-select v-model:value="templateCode" :options="TEMPLATE_OPTIONS" />
          <div class="dt-hint">{{ $t('components.deviceTest.templateHint') }}</div>
        </a-form-item>
      </template>
    </a-form>
  </a-modal>
</template>

<style scoped>
  .dt-quick {
    margin-top: 6px;
  }

  .dt-quick-tag {
    margin-bottom: 4px;
    cursor: pointer;
  }

  .dt-hint {
    margin-top: 4px;
    color: hsl(var(--muted-foreground));
    font-size: 12px;
    line-height: 1.6;
  }

  .dt-speech {
    padding: 8px 12px;
    border-radius: 6px;
    background: hsl(var(--muted));
    font-size: 14px;
    font-weight: 500;
  }
</style>
