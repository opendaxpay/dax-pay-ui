<script lang="ts" setup>
  /**
   * 实体资源卡片(通用)
   * 用于「某主体下的一类资源集合」卡片墙: 门店 / 商户应用 / 通道应用 / 服务商 / 收银台商户等,
   * 统一规格 = 168px 高 / 16px 圆角 / 64px 图标块 / 17px 粗标题 / 底栏状态 + 入口。
   * 底栏三种形态: enter=状态点+入口文案(默认); actions=右侧按钮组(通道应用卡的编辑/删除);
   * none=不渲染(如无查看权限的门店卡)。
   * 整卡可点时自带键盘可达(Enter/Space)与焦点环; clickable=false 时不响应点击也不渲染 hover 动效。
   */
  import type { ResourceCardStatus } from './types';

  import { computed } from 'vue';

  import { IconifyIcon } from '@vben-core/icons';

  defineOptions({ name: 'ResourceCard' });

  const props = withDefaults(
    defineProps<{
      /** 底栏右侧入口文案(footer=enter 时生效), 多语版由调用方按语言传入 */
      actionText?: string;
      /** 当前生效态(默认门店/默认应用等): 常显主色描边 */
      active?: boolean;
      /** 无障碍标签(默认取入口文案) */
      ariaLabel?: string;
      /** 是否整卡可点(无权限时置 false: 不响应点击、不渲染 hover 动效与键盘行为) */
      clickable?: boolean;
      /** 图标缺失时的首字回退(默认取标题首字) */
      fallbackText?: string;
      /** 底栏形态: enter=状态点+入口 / actions=右侧按钮组 / none=不渲染 */
      footer?: 'actions' | 'enter' | 'none';
      /** Iconify 图标名(image 优先于 icon) */
      icon?: string;
      /** 图标块底色(品牌色, 如 '#07c160'), 不传为主色浅底 */
      iconBg?: string;
      /** 图标图片地址(品牌 logo) */
      image?: string;
      /** 底栏状态(状态点样式类 + 文案), 不传只渲染入口 */
      status?: ResourceCardStatus;
      /** 副信息行(带 tooltip) */
      subtitle?: string;
      /** 标题 */
      title?: string;
    }>(),
    {
      // open 多语版无通用「进入」类词条(组件层不可引用应用级业务 key), 默认空文案且不渲染入口文本, 由调用方显式传入
      actionText: '',
      active: false,
      ariaLabel: '',
      clickable: true,
      fallbackText: '',
      footer: 'enter',
      icon: '',
      iconBg: '',
      image: '',
      status: undefined,
      subtitle: '',
      title: '',
    },
  );

  const emit = defineEmits<{
    open: [];
  }>();

  /** 图标缺失时回退名称首字块 */
  const fallbackChar = computed(() => props.fallbackText || (props.title || '-').slice(0, 1));

  /** 图标块底色: 品牌色按 10% 透明度铺底(与既有通道卡一致) */
  const iconStyle = computed(() => (props.iconBg ? { backgroundColor: `${props.iconBg}1a` } : undefined));

  /** 命中键盘 Enter / Space 时打开 */
  function handleKeydown(e: KeyboardEvent) {
    if (!props.clickable) {
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      emit('open');
    }
  }

  function handleClick() {
    if (props.clickable) {
      emit('open');
    }
  }
</script>

<template>
  <div
    class="resource-card group relative flex h-full min-h-[168px] flex-col overflow-hidden rounded-2xl border bg-card shadow-md"
    :class="[
      clickable ? 'resource-card--clickable cursor-pointer' : '',
      active ? 'resource-card--active' : '',
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    :aria-label="clickable ? ariaLabel || actionText : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- 右上角浮动徽章(凭证配置状态等) -->
    <div v-if="$slots.badge" class="absolute right-5 top-5 z-10 flex items-center gap-1.5">
      <slot name="badge"></slot>
    </div>

    <slot name="body">
      <div class="card-body flex flex-1 items-center gap-4 px-5 py-5">
        <div
          class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-primary shadow-sm transition-all duration-300"
          :class="[
            iconBg ? '' : 'bg-primary/10',
            clickable ? 'group-hover:scale-110 group-hover:shadow-md' : '',
          ]"
          :style="iconStyle"
        >
          <img v-if="image" :src="image" class="h-8 w-8" alt="" />
          <IconifyIcon v-else-if="icon" :icon="icon" class="h-8 w-8" />
          <span v-else class="text-xl font-bold">{{ fallbackChar }}</span>
        </div>
        <div class="min-w-0 flex-1" :class="$slots.badge ? 'pr-24' : ''">
          <div class="flex items-center gap-2">
            <slot name="titlePrefix"></slot>
            <a-tooltip :title="title" placement="top">
              <span
                class="min-w-0 truncate text-[17px] font-bold leading-snug text-foreground transition-colors duration-300"
                :class="clickable || active ? 'group-hover:text-primary' : ''"
              >
                {{ title || '-' }}
              </span>
            </a-tooltip>
            <slot name="titleExtra"></slot>
          </div>
          <a-tooltip v-if="subtitle" :title="subtitle" placement="top">
            <div class="mt-2 truncate text-[13px] text-muted-foreground">{{ subtitle }}</div>
          </a-tooltip>
          <slot name="subtitleExtra"></slot>
        </div>
      </div>
    </slot>

    <!-- 底栏: 状态点 + 入口 -->
    <div
      v-if="footer === 'enter'"
      class="card-footer flex shrink-0 items-center justify-between px-5 pb-5 pt-1"
    >
      <div v-if="status" class="flex items-center gap-1.5 text-[13px] leading-none text-muted-foreground">
        <span class="inline-block h-1.5 w-1.5 rounded-full" :class="status.dotClass || 'bg-primary'" />
        <span>{{ status.text }}</span>
      </div>
      <div
        v-if="clickable && actionText"
        class="ml-auto flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground transition-colors duration-300 group-hover:text-primary"
      >
        <span>{{ actionText }}</span>
        <IconifyIcon icon="ant-design:right-outlined" class="text-[13px]" />
      </div>
      <slot name="footerRight"></slot>
    </div>

    <!-- 底栏: 右侧操作按钮组(需要分隔线) -->
    <div
      v-else-if="footer === 'actions'"
      class="card-footer flex shrink-0 items-center justify-end border-t border-border px-5 py-2"
    >
      <div class="flex items-center gap-1">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- hover 底边色条 -->
    <div
      v-if="clickable"
      class="absolute bottom-0 left-0 h-1.5 w-0 bg-primary transition-all duration-300 group-hover:w-full"
    />
  </div>
</template>

<style scoped>
  .resource-card {
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease,
      border-color 0.3s ease;
  }

  .resource-card--clickable:hover {
    border-color: hsl(var(--primary) / 40%);
    box-shadow: 0 12px 28px rgb(0 0 0 / 12%);
    transform: translateY(-6px);
  }

  .resource-card--clickable:focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }

  /* 当前生效态(默认门店/默认应用): 常显主色描边 */
  .resource-card--active {
    box-shadow:
      0 4px 14px rgb(0 0 0 / 8%),
      0 0 0 1.5px hsl(var(--primary) / 35%);
  }

  .resource-card--active:hover {
    box-shadow:
      0 12px 28px rgb(0 0 0 / 12%),
      0 0 0 1.5px hsl(var(--primary) / 35%);
  }
</style>
