<script lang="ts" setup>
  /**
   * 工作台分组磁贴网格(通用)
   * 分组彩色竖条 + 220px 卡片网格 + hover 动效, danger 卡(删除等)红色系,
   * active 卡(当前生效态, 如已设为默认)主色系 + 常显底条, 与危险态区分;
   * 数量以标题旁的灰色小标签呈现(存量语义, 不用红点角标, 与「待办/告警」区分);
   * 右上角提供 badge 作用域插槽(如接入配置状态 tag), 调用方按 card.key 自行渲染, 不传不渲染
   */
  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  defineOptions({ name: 'WorkbenchTileGrid' });

  defineProps<{
    groups: WorkbenchTileGroup[];
  }>();

  const emit = defineEmits<{
    select: [key: string];
  }>();

  defineSlots<{
    /** 磁贴右上角徽章(作用域参数为当前磁贴) */
    badge?: (props: { card: WorkbenchTile }) => any;
  }>();

  export type TileColor = 'blue' | 'gray' | 'green' | 'orange' | 'purple' | 'red';

  export type WorkbenchTile = {
    /**
     * 当前生效态强调, 主色系: 浅主色图标底(图标本身用实心符号, 如实心星) + 主色标题 + 常显主色底条
     *
     * 只用于「当前主体本身是否处于默认态」的卡(如本应用是否默认应用);
     * 指向性配置卡(本应用使用哪个通道/终端)配的是引用对象, 不是主体默认态, 不要用本属性。
     */
    active?: boolean;
    /** 数量(可选, 如商户名下设备台数; undefined 不渲染) */
    count?: number;
    /** 数量单位(可选, 如「台」「个」; 不传只显示数字) */
    countUnit?: string;
    /** 危险操作卡(删除等)红色系 */
    danger?: boolean;
    description: string;
    icon: string;
    key: string;
    title: string;
  };

  export type WorkbenchTileGroup = {
    cards: WorkbenchTile[];
    color: TileColor;
    group: string;
  };

  /** 组标题竖条颜色 */
  const groupBarColorMap: Record<TileColor, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    gray: 'bg-gray-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  /** 卡片图标背景色 */
  const iconBgColorMap: Record<TileColor, string> = {
    blue: 'bg-primary/10 text-primary',
    green: 'bg-success/10 text-success',
    gray: 'bg-muted text-muted-foreground',
    orange: 'bg-orange-500/10 text-orange-500',
    purple: 'bg-purple-500/10 text-purple-500',
    red: 'bg-red-500/10 text-red-500',
  };

  function handleCardClick(card: WorkbenchTile) {
    emit('select', card.key);
  }

  /** 数量标签文案(数字 + 可选单位, 如「1 台」) */
  function countText(card: WorkbenchTile) {
    return card.countUnit ? `${card.count} ${card.countUnit}` : String(card.count);
  }
</script>

<template>
  <div class="space-y-10 py-2">
    <div v-for="group in groups" :key="group.group">
      <div class="mb-5 flex items-center gap-3 px-2">
        <div class="h-5 w-1.5 rounded-full shadow-sm" :class="groupBarColorMap[group.color]" />
        <span class="text-lg font-extrabold tracking-tight text-foreground">{{ group.group }}</span>
      </div>

      <div class="tile-grid">
        <a-card
          v-for="card in group.cards"
          :key="card.key"
          class="tile-card group relative overflow-hidden rounded-2xl border-none bg-card shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
          :styles="{ body: { padding: '24px 20px' } }"
          @click="handleCardClick(card)"
        >
          <!--
            右上角徽章(如配置状态 tag): 调用方按 card.key 渲染, 无内容时空容器不占位;
            宽度封顶 50% - 40px(220px 磁贴约 70px), 保证长文案语种也不压住中央 56px 图标(含 hover 放大)
          -->
          <div
            v-if="$slots.badge"
            class="absolute right-2 top-2 z-10 flex max-w-[calc(50%_-_40px)] items-center gap-1.5"
          >
            <slot name="badge" :card="card" />
          </div>
          <div class="flex flex-col items-center text-center">
            <div
              class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
              :class="
                card.danger
                  ? 'bg-destructive/10 text-destructive'
                  : card.active
                    ? 'bg-primary/10 text-primary'
                    : iconBgColorMap[group.color]
              "
            >
              <IconifyIcon :icon="card.icon" class="h-7 w-7" />
            </div>

            <div
              class="mb-1.5 flex items-center justify-center gap-1.5 text-base font-bold transition-colors duration-300"
              :class="
                card.danger
                  ? 'text-destructive'
                  : card.active
                    ? 'text-primary'
                    : 'text-foreground group-hover:text-primary'
              "
            >
              <span class="truncate">{{ card.title }}</span>
              <!-- 数量标签(标题右侧, 仅传入 count 时渲染; 存量语义用中性灰, 不用红点角标) -->
              <span
                v-if="card.count !== undefined"
                class="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs leading-none font-medium text-muted-foreground"
              >
                {{ countText(card) }}
              </span>
            </div>
            <a-tooltip :title="card.description" placement="bottom">
              <div
                class="card-desc line-clamp-1 text-xs leading-relaxed transition-colors duration-300"
                :class="
                  card.danger
                    ? 'text-destructive/80 group-hover:text-destructive'
                    : card.active
                      ? 'text-primary/80 group-hover:text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                "
              >
                {{ card.description }}
              </div>
            </a-tooltip>
          </div>

          <div
            class="absolute bottom-0 left-0 h-1.5 transition-all duration-300"
            :class="
              card.danger
                ? 'w-0 bg-destructive group-hover:w-full'
                : card.active
                  ? 'w-full bg-primary'
                  : ['w-0 group-hover:w-full', groupBarColorMap[group.color]]
            "
          />
        </a-card>
      </div>
    </div>

    <div v-if="groups.length === 0 || groups.every((g) => g.cards.length === 0)" class="py-16 text-center text-sm text-muted-foreground">
      {{ $t('common.noData') }}
    </div>
  </div>
</template>

<style scoped>
  .tile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 220px);
    gap: 24px;
    /* 整墙居中: 固定轨道铺不满容器时余量两侧平分, 磁贴墙相对内容区视觉居中(既定视觉, 勿改成左对齐) */
    justify-content: center;
  }

  .tile-card {
    max-height: 200px;
  }

  .card-desc {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  .line-clamp-1 {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
</style>
