<script lang="ts" setup>
  import { computed } from 'vue';

  import { PageTitleBar } from '../page-title-bar';

  // 配置页公共表单样式(config-* 与 module-* 类), 随 PageShell 引入全局生效
  import './config-form.css';

  /**
   * 配置类页面外壳:右上固定(标题/描述/状态标签/操作按钮) + 右下滚动(内容区)
   *
   * 解决 vben document 级滚动下 height:100% 失效的问题:根容器以
   * calc(100vh - var(--vben-header-height)) 锚定视口(--vben-content-height
   * 冷启动缺失/切页被清,不可用),左右栏各自内部滚动。
   */
  const props = withDefaults(
    defineProps<{
      /** 是否显示返回按钮(仅"有上级页"的子页传 true, 与卡片页标题栏形态一致) */
      back?: boolean;
      /** 右栏描述文案(说明性文字, 渲染在标题下方; 商户名/应用名请改用 name) */
      description?: string;
      /** 加载中(内置 a-spin 并撑满高度链) */
      loading?: boolean;
      /** 商户名/应用名等, 灰色淡化显示在标题后方(与卡片页标题栏统一形态) */
      name?: string;
      /** 左栏宽度(px),仅双栏形态生效 */
      navWidth?: number;
      /** 状态概要标签(跟随配置数据计算,如"风控：已开启") */
      tags?: string[];
      /** 右栏标题 */
      title: string;
    }>(),
    {
      back: false,
      description: '',
      name: '',
      tags: () => [],
      loading: false,
      navWidth: 280,
    },
  );

  const emit = defineEmits<{ back: [] }>();

  const navStyle = computed(() => ({
    flexBasis: `${props.navWidth}px`,
  }));
</script>

<template>
  <div class="page-shell">
    <a-spin :spinning="loading" class="page-shell__spin">
      <div class="page-shell__layout">
        <!-- 左栏: 分组导航(传入 nav 插槽即双栏形态, 内部自身滚动) -->
        <aside v-if="$slots.nav" class="page-shell__sidebar" :style="navStyle">
          <slot name="nav" />
        </aside>
        <!-- 右栏: header 常驻不滚动, 内容区内部滚动 -->
        <section class="page-shell__main">
          <div class="page-shell__header">
            <div class="page-shell__header-main">
              <!-- 标题栏: 返回 + 功能名 +（商户/应用名称）, 与卡片页统一形态 -->
              <PageTitleBar :title="title" :name="name" :back="back" @back="emit('back')" />
              <div v-if="description" class="page-shell__desc">{{ description }}</div>
              <!-- 状态概要标签 -->
              <a-space v-if="tags.length > 0" wrap size="small" class="page-shell__tags">
                <a-tag v-for="item in tags" :key="item">{{ item }}</a-tag>
              </a-space>
            </div>
            <!-- 右上操作区: 编辑/保存/新增等按钮常驻 -->
            <div v-if="$slots.actions" class="page-shell__actions">
              <a-space>
                <slot name="actions" />
              </a-space>
            </div>
          </div>
          <div class="page-shell__content">
            <slot />
          </div>
        </section>
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
  .page-shell {
    box-sizing: border-box;

    /* 锁定为视口内内容区高度(顶栏+页签栏由 --vben-header-height 表达, 布局启动即写入 :root),
       左右栏在各自内部滚动, 不再随 document 整页滚动 */
    height: calc(100vh - var(--vben-header-height, 88px));
    padding: 12px;
  }

  /* a-spin 需要撑满高度链, 内层布局才能按视口锚定 */
  .page-shell__spin,
  .page-shell__spin :deep(.ant-spin-nested-loading),
  .page-shell__spin :deep(.ant-spin-container) {
    height: 100%;
    min-height: 0;
  }

  .page-shell__layout {
    display: flex;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: hsl(var(--card));
    border-radius: 16px;
    box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
  }

  .page-shell__sidebar {
    display: flex;
    flex: 0 0 280px;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    min-height: 0;
    padding: 24px 20px;
    overflow-y: auto;
    background: hsl(var(--card));
    border-right: 1px solid hsl(var(--border));
  }

  .page-shell__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    background: hsl(var(--card));
  }

  /* 右栏顶部: 标题 + 描述 + 状态标签 + 操作按钮(常驻不随内容滚动) */
  .page-shell__header {
    display: flex;
    flex-shrink: 0;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 28px 16px;
    border-bottom: 1px solid hsl(var(--border));
  }

  .page-shell__header-main {
    min-width: 0;
  }

  .page-shell__desc {
    margin-top: 4px;
    font-size: 13px;
    line-height: 1.7;
    color: hsl(var(--muted-foreground));
  }

  .page-shell__tags {
    padding-top: 6px;
  }

  .page-shell__actions {
    flex-shrink: 0;
  }

  /* 右栏内容区: 内部滚动 */
  .page-shell__content {
    flex: 1;
    min-height: 0;
    padding: 20px 28px 28px;
    padding-right: 24px;
    overflow-y: auto;
  }
</style>
