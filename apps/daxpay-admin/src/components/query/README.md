# BQuery 通用查询组件

## 简介

`BQuery` 是一个轻量级的动态查询组件，通过字段配置驱动的方式生成查询表单，支持多种字段类型和时间范围查询能力。

## 特性

- 🎯 **配置驱动**：通过 `fields` 配置自动生成查询表单
- 📅 **时间范围**：支持日期范围和日期时间范围查询
- ⚡ **快捷范围**：内置今天、昨天、近7天等快捷选项
- 🔄 **展开收起**：支持查询条件展开/收起交互
- 🎨 **类型丰富**：支持文本、数字、布尔、下拉、日期等多种类型
- 💡 **轻量设计**：不依赖复杂状态管理，与页面数据流解耦
- 🌐 **国际化支持**：完整支持中英文国际化

## 安装

组件已内置在 `daxpay-admin` 项目中，无需额外安装。

## 基本用法

### 导入组件

```typescript
import { BQuery, type QueryField } from '#/components/query';
```

### 基础示例

```vue
<script setup lang="ts">
  import { reactive } from 'vue';
  import { BQuery, type QueryField } from '#/components/query';

  // 查询参数
  const queryForm = reactive({
    title: '',
    status: undefined,
    createTime: '',
  });

  // 查询字段配置
  const queryFields: QueryField[] = [
    {
      type: 'string',
      field: 'title',
      name: '标题',
      placeholder: '请输入标题',
    },
    {
      type: 'list',
      field: 'status',
      name: '状态',
      selectList: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  ];

  // 查询
  function queryPage() {
    // 调用接口
    console.log('查询参数:', queryForm);
  }

  // 重置
  function resetQuery() {
    Object.assign(queryForm, {
      title: '',
      status: undefined,
      createTime: '',
    });
    queryPage();
  }
</script>

<template>
  <BQuery :fields="queryFields" :query-params="queryForm" @query="queryPage" @reset="resetQuery" />
</template>
```

## 字段类型

### 支持的类型

| 类型              | 说明         | 必需字段                 |
| ----------------- | ------------ | ------------------------ |
| `string`          | 文本输入     | `field`                  |
| `number`          | 数字输入     | `field`                  |
| `boolean`         | 布尔选择     | `field`                  |
| `list`            | 下拉选择     | `field`, `selectList`    |
| `date`            | 日期选择     | `field`                  |
| `time`            | 时间选择     | `field`                  |
| `date_time`       | 日期时间选择 | `field`                  |
| `date_range`      | 日期范围     | `startField`, `endField` |
| `date_time_range` | 日期时间范围 | `startField`, `endField` |

### 字段配置说明

```typescript
interface QueryField {
  // 字段类型
  type?: 'string' | 'number' | 'boolean' | 'date' | 'time' | 'date_time' | 'list' | 'date_range' | 'date_time_range';

  // 字段名称（显示标签）
  name?: string;

  // 普通字段绑定名（单值字段使用）
  field?: string;

  // 栅格宽度（默认 6）
  md?: number;

  // 占位文案
  placeholder?: string | [string, string];

  // 数字精度（number 类型使用）
  precision?: number;

  // 下拉选项（list 类型使用）
  selectList?: Array<{ label: string; value: string | number | boolean }>;

  // 日期/时间格式
  format?: string;

  // 范围字段 - 开始字段名（范围字段使用）
  startField?: string;

  // 范围字段 - 结束字段名（范围字段使用）
  endField?: string;

  // 是否启用快捷范围（date_range 使用）
  shortcuts?: boolean;
}
```

## 时间范围查询

### 日期范围查询

```typescript
const queryForm = reactive({
  startTime: '',
  endTime: '',
});

const queryFields: QueryField[] = [
  {
    type: 'date_range',
    name: '创建时间',
    startField: 'startTime',
    endField: 'endTime',
    format: 'YYYY-MM-DD',
    shortcuts: true, // 启用快捷范围
  },
];
```

### 日期时间范围查询

```typescript
const queryForm = reactive({
  startDateTime: '',
  endDateTime: '',
});

const queryFields: QueryField[] = [
  {
    type: 'date_time_range',
    name: '操作时间',
    startField: 'startDateTime',
    endField: 'endDateTime',
    format: 'YYYY-MM-DD HH:mm:ss',
  },
];
```

### 重要说明

1. **范围字段必须配置 `startField` 和 `endField`**
2. **范围值会自动拆分**：组件内部会将范围数组值拆分为两个字段
3. **清空行为**：清空范围选择器时，两个字段都会被置空

## 快捷范围

`date_range` 类型支持以下快捷选项：

- 今天
- 昨天
- 近7天
- 近30天
- 本月
- 上月

### 启用快捷范围

```typescript
{
  type: 'date_range',
  name: '创建时间',
  startField: 'startTime',
  endField: 'endTime',
  shortcuts: true, // 启用快捷范围
}
```

## 组件属性

### Props

| 属性               | 类型                  | 默认值  | 说明                   |
| ------------------ | --------------------- | ------- | ---------------------- |
| `fields`           | `QueryField[]`        | `[]`    | 查询字段配置数组       |
| `queryParams`      | `Record<string, any>` | -       | 查询参数对象（响应式） |
| `defaultItemCount` | `number`              | `2`     | 默认显示的字段数量     |
| `defaultItemMd`    | `number`              | `6`     | 单个字段栅格宽度       |
| `disabledQuery`    | `boolean`             | `false` | 是否禁用查询按钮       |
| `gutter`           | `number`              | `10`    | 栅格间距               |

### Events

| 事件    | 参数 | 说明                       |
| ------- | ---- | -------------------------- |
| `query` | -    | 点击查询按钮或按回车时触发 |
| `reset` | -    | 点击重置按钮时触发         |

## 完整示例

### 用户列表查询

```vue
<script setup lang="ts">
  import { reactive, computed } from 'vue';
  import { BQuery, type QueryField } from '#/components/query';

  const queryForm = reactive({
    username: '',
    email: '',
    status: undefined,
    department: '',
    startTime: '',
    endTime: '',
  });

  const statusOptions = [
    { label: '在职', value: 1 },
    { label: '离职', value: 0 },
  ];

  const departmentOptions = [
    { label: '技术部', value: 'tech' },
    { label: '产品部', value: 'product' },
    { label: '运营部', value: 'operation' },
  ];

  const queryFields = computed<QueryField[]>(() => [
    {
      type: 'string',
      field: 'username',
      name: '用户名',
      placeholder: '请输入用户名',
    },
    {
      type: 'string',
      field: 'email',
      name: '邮箱',
      placeholder: '请输入邮箱',
    },
    {
      type: 'list',
      field: 'status',
      name: '状态',
      selectList: statusOptions,
    },
    {
      type: 'list',
      field: 'department',
      name: '部门',
      selectList: departmentOptions,
    },
    {
      type: 'date_range',
      name: '入职时间',
      startField: 'startTime',
      endField: 'endTime',
      shortcuts: true,
    },
  ]);

  function queryPage() {
    console.log('查询参数:', queryForm);
    // 调用接口...
  }

  function resetQuery() {
    Object.assign(queryForm, {
      username: '',
      email: '',
      status: undefined,
      department: '',
      startTime: '',
      endTime: '',
    });
    queryPage();
  }
</script>

<template>
  <div class="list-page">
    <a-card>
      <BQuery
        :fields="queryFields"
        :query-params="queryForm"
        :default-item-count="3"
        @query="queryPage"
        @reset="resetQuery"
      />
    </a-card>

    <!-- 表格区域 -->
  </div>
</template>
```

## 注意事项

### 1. 重置逻辑

组件**不会自动重置**查询参数，需要页面自行处理：

```typescript
function resetQuery() {
  // 手动重置查询参数
  Object.assign(queryForm, {
    field1: '',
    field2: undefined,
    // ...
  });
  // 重新查询
  queryPage();
}
```

### 2. 范围字段命名

范围字段建议使用统一的命名规范：

```typescript
// 推荐
startField: 'startTime';
endField: 'endTime';

// 或
startField: 'startDate';
endField: 'endDate';
```

### 3. 默认值

如果查询参数需要默认值，请在 `queryForm` 初始化时设置：

```typescript
const queryForm = reactive({
  status: 1, // 默认查询启用状态
  clientCode: 'admin', // 固定值
});
```

### 4. 展开收起

当字段数量超过 `defaultItemCount` 时，会自动显示"展开/收起"按钮。

### 5. 国际化

组件内置完整的国际化支持，所有文本内容都会根据当前语言自动切换。

#### 内置国际化键

组件使用以下国际化键（位于 `common.json`）：

| 键名                      | 中文           | 英文                      | 用途                 |
| ------------------------- | -------------- | ------------------------- | -------------------- |
| `common.query`            | 查询           | Query                     | 查询按钮             |
| `common.reset`            | 重置           | Reset                     | 重置按钮             |
| `common.expand`           | 展开           | Expand                    | 展开按钮             |
| `common.collapse`         | 收起           | Collapse                  | 收起按钮             |
| `common.yes`              | 是             | Yes                       | 布尔选项             |
| `common.no`               | 否             | No                        | 布尔选项             |
| `common.inputQueryValue`  | 请输入查询值   | Please input query value  | 输入框占位符         |
| `common.selectQueryValue` | 请选择查询值   | Please select query value | 下拉框占位符         |
| `common.selectDate`       | 请选择日期     | Please select date        | 日期选择器占位符     |
| `common.selectTime`       | 请选择时间     | Please select time        | 时间选择器占位符     |
| `common.selectDateTime`   | 请选择日期时间 | Please select datetime    | 日期时间选择器占位符 |
| `common.startTime`        | 开始时间       | Start Time                | 范围选择器开始占位符 |
| `common.endTime`          | 结束时间       | End Time                  | 范围选择器结束占位符 |
| `common.today`            | 今天           | Today                     | 快捷范围             |
| `common.yesterday`        | 昨天           | Yesterday                 | 快捷范围             |
| `common.last7Days`        | 近7天          | Last 7 Days               | 快捷范围             |
| `common.last30Days`       | 近30天         | Last 30 Days              | 快捷范围             |
| `common.thisMonth`        | 本月           | This Month                | 快捷范围             |
| `common.lastMonth`        | 上月           | Last Month                | 快捷范围             |

#### 自定义字段国际化

字段名称和占位文案支持自定义国际化：

```typescript
import { $t } from '@vben/locales';

const queryFields: QueryField[] = [
  {
    type: 'string',
    field: 'username',
    name: $t('iam.user.username'),
    placeholder: $t('iam.user.inputUsername'),
  },
];
```

#### 注意事项

- 组件内部文本已自动国际化，无需额外配置
- 字段 `name` 和 `placeholder` 需要自行使用 `$t()` 进行国际化
- 快捷范围标签已内置国际化支持

## 常见问题

### Q: 如何获取查询参数？

A: 直接使用 `queryForm` 对象，组件会自动同步值：

```typescript
function queryPage() {
  const params = {
    current: 1,
    size: 10,
    ...queryForm, // 直接展开查询参数
  };
  // 调用接口
}
```

### Q: 时间范围如何传递给后端？

A: 组件会自动将范围值拆分为两个字段，后端接口定义如下：

```java
@GetMapping("/page")
public Result page(
  @RequestParam(required = false) String startTime,
  @RequestParam(required = false) String endTime
) {
  // ...
}
```

### Q: 如何自定义字段宽度？

A: 在字段配置中设置 `md` 属性：

```typescript
{
  type: 'string',
  field: 'remark',
  name: '备注',
  md: 12, // 占用 12 栅格（半行）
}
```

### Q: 如何禁用某个字段？

A: 目前组件不支持字段级别的禁用，建议通过条件渲染处理：

```typescript
const queryFields = computed(() => {
  const fields = [
    /* 基础字段 */
  ];
  if (someCondition) {
    fields.push({
      type: 'string',
      field: 'extraField',
      name: '额外字段',
    });
  }
  return fields;
});
```

## 更新日志

### v1.0.0 (2026-04-08)

- ✨ 初始版本发布
- ✨ 支持 7 种基础字段类型
- ✨ 支持日期范围和日期时间范围查询
- ✨ 支持快捷范围选择
- ✨ 支持展开/收起交互
