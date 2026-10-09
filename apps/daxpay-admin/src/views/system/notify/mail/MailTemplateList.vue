<script lang="ts" setup>
  import type { MenuProps } from 'antdv-next';

  import type { MailTemplate } from '#/api/system/notify/mail-template.api';

  import { onMounted, ref } from 'vue';

  import { IconifyIcon } from '@vben/icons';
  import { $t } from '@vben/locales';

  import { MailTemplateApi } from '#/api/system/notify/mail-template.api';
  import { PermCodes } from '#/constants/perm-codes';
  import { useMessage } from '#/hooks/useMessage';
  import { usePermission } from '#/hooks/usePermission';

  import MailTemplateDrawer from './MailTemplateDrawer.vue';

  const { confirm, message } = useMessage();
  const { hasPermission } = usePermission();

  const loading = ref(false);

  // 模板列表(六个固定场景, 中英两语言)
  const tableData = ref<MailTemplate[]>([]);

  // 编辑抽屉状态
  const editDrawer = ref({
    visible: false,
    template: null as MailTemplate | null,
  });

  // 表格列定义
  const columns: {
    align?: 'center';
    dataIndex?: string;
    ellipsis?: boolean;
    key?: string;
    title: string;
    width?: number;
  }[] = [
    // 邮件场景
    { title: $t('system.notify.mailTemplate.scene'), dataIndex: 'name', width: 170 },
    // 中文主题
    { title: $t('system.notify.mailTemplate.subjectZh'), dataIndex: 'zh.subject', width: 240, ellipsis: true },
    // 英文主题
    { title: $t('system.notify.mailTemplate.subjectEn'), dataIndex: 'en.subject', width: 240, ellipsis: true },
    // 状态
    { title: $t('system.notify.mailTemplate.status'), dataIndex: 'customized', width: 150, align: 'center' },
    // 操作
    { title: $t('common.operation'), key: 'operation', width: 200, align: 'center' },
  ];

  onMounted(() => {
    queryList();
  });

  /**
   * 场景名(templateCode 转帕斯卡拼 i18n key, 六场景词条见 notify.json)
   */
  function sceneName(row: MailTemplate) {
    const pascal = (row.templateCode || '')
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    return $t(`system.notify.mailTemplate.scene${pascal}`);
  }

  /**
   * 查询模板列表
   */
  function queryList() {
    loading.value = true;
    MailTemplateApi.list()
      .then((res: any) => {
        tableData.value = res.data || [];
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }

  /**
   * 打开编辑抽屉
   */
  function handleEdit(row: MailTemplate) {
    editDrawer.value.template = row;
    editDrawer.value.visible = true;
  }

  /**
   * 抽屉保存成功后刷新列表
   */
  function handleDrawerSuccess() {
    queryList();
  }

  /**
   * 恢复指定语言的默认文案(删除自定义覆盖)
   */
  function handleReset(row: MailTemplate, language: 'en' | 'zh') {
    const langName = $t(`system.notify.mailTemplate.language${language === 'zh' ? 'Zh' : 'En'}`);
    confirm({
      title: $t('system.notify.mailTemplate.reset'),
      content: $t('system.notify.mailTemplate.confirmReset', {
        lang: langName,
        name: sceneName(row),
      }),
      onOk: () => {
        MailTemplateApi.reset(row.templateCode as string, language).then(() => {
          message.success($t('system.notify.mailTemplate.resetSuccess'));
          queryList();
        });
      },
    });
  }

  /**
   * 操作列更多菜单(两种语言各自的恢复默认, 仅自定义过的语言可用)
   */
  function getActionMenu(row: MailTemplate): MenuProps {
    return {
      items: [
        {
          key: 'reset-zh',
          label: $t('system.notify.mailTemplate.resetZh'),
          disabled: !row.zh?.customized || !hasPermission(PermCodes.System.MailTemplate.MANAGE),
        },
        {
          key: 'reset-en',
          label: $t('system.notify.mailTemplate.resetEn'),
          disabled: !row.en?.customized || !hasPermission(PermCodes.System.MailTemplate.MANAGE),
        },
      ],
      onClick: ({ key }: { key: string }) => {
        if (key === 'reset-zh') {
          handleReset(row, 'zh');
        } else if (key === 'reset-en') {
          handleReset(row, 'en');
        }
      },
    };
  }
</script>

<template>
  <div class="m-3 list-page-compact rounded-lg bg-background p-3">
    <a-card>
      <!-- 页面说明(灰底说明行) -->
      <div class="page-hint">
        {{ $t('system.notify.mailTemplate.hint') }}
      </div>
      <!-- 模板表格(六个固定场景) -->
      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        :row-key="(record: MailTemplate) => record.templateCode!"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <!-- 场景名(i18n 词条, 非后端 name 字段) -->
          <template v-if="column.dataIndex === 'name'">
            {{ sceneName(record as MailTemplate) }}
          </template>
          <!-- 状态(中英两语言各自的覆盖状态) -->
          <template v-else-if="column.dataIndex === 'customized'">
            <div class="flex flex-col items-center gap-1">
              <a-tag v-if="(record as MailTemplate).zh?.customized" color="blue">
                {{ $t('system.notify.mailTemplate.languageZh') }} ·
                {{ $t('system.notify.mailTemplate.customized') }}
              </a-tag>
              <a-tag v-else>
                {{ $t('system.notify.mailTemplate.languageZh') }} ·
                {{ $t('system.notify.mailTemplate.default') }}
              </a-tag>
              <a-tag v-if="(record as MailTemplate).en?.customized" color="blue">
                {{ $t('system.notify.mailTemplate.languageEn') }} ·
                {{ $t('system.notify.mailTemplate.customized') }}
              </a-tag>
              <a-tag v-else>
                {{ $t('system.notify.mailTemplate.languageEn') }} ·
                {{ $t('system.notify.mailTemplate.default') }}
              </a-tag>
            </div>
          </template>
          <!-- 操作 -->
          <template v-else-if="column.key === 'operation'">
            <a-space :size="2">
              <template #separator>
                <a-divider type="vertical" />
              </template>
              <!-- 编辑 -->
              <a-button
                v-if="hasPermission(PermCodes.System.MailTemplate.MANAGE)"
                type="link"
                size="small"
                @click="handleEdit(record as MailTemplate)"
              >
                {{ $t('common.edit') }}
              </a-button>
              <!-- 更多(恢复默认) -->
              <a-dropdown
                v-if="hasPermission(PermCodes.System.MailTemplate.MANAGE)"
                :menu="getActionMenu(record as MailTemplate)"
              >
                <a-button type="link" size="small">
                  {{ $t('common.more') }}
                  <IconifyIcon icon="ant-design:down-outlined" class="inline" />
                </a-button>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 编辑抽屉 -->
    <MailTemplateDrawer
      v-model:open="editDrawer.visible"
      :template="editDrawer.template"
      @success="handleDrawerSuccess"
    />
  </div>
</template>

<style scoped>
  .page-hint {
    padding: 8px 12px;
    margin-bottom: 12px;
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    background: hsl(var(--muted) / 40%);
    border-radius: 8px;
  }
</style>
