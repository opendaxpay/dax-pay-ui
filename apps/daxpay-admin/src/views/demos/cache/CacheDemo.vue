<script lang="ts" setup>
  import type {
    CacheDemoProduct,
    CacheDemoReadResult,
    CacheInvalidationEventResult,
    CacheL1StatusResult,
  } from '#/api/demo/cache-demo.api';

  import { onMounted, ref } from 'vue';

  import { Page } from '@vben/common-ui';

  import { CacheDemoApi } from '#/api/demo/cache-demo.api';
  import { useMessage } from '#/hooks/useMessage';

  const { message } = useMessage();

  // 单对象缓存: 输入与结果
  const codeInput = ref<string>('P001');
  const productResult = ref<CacheDemoReadResult>();
  const productLoading = ref<boolean>(false);

  // 列表缓存(List<T> 重点): 输入与结果
  const categoryInput = ref<string>('drink');
  const listResult = ref<CacheDemoReadResult>();
  const listLoading = ref<boolean>(false);

  // 操作日志(最近 20 条)
  const logs = ref<LogItem[]>([]);

  interface LogItem {
    time: string;
    action: string;
    key: string;
    elementType: string;
    methodLoads: number;
    costMillis: number;
  }

  // 区块 C: 修改内容 → L1 集群失效通知
  const updateCodeInput = ref<string>('P001');
  const updateNameInput = ref<string>('');
  const updateLoading = ref<boolean>(false);
  // 失效广播事件流(本节点订阅观察)
  const invalidationEvents = ref<CacheInvalidationEventResult[]>([]);
  const eventsLoading = ref<boolean>(false);
  // 本节点 L1 缓存状态
  const l1Status = ref<CacheL1StatusResult[]>([]);
  // 最近一次修改返回的商品(展示修改结果)
  const updatedProduct = ref<CacheDemoProduct>();

  // 快捷示例
  const codeExamples = ['P001', 'P002', 'F001'];
  const categoryExamples = ['drink', 'food'];

  // 事件流表格列定义
  const eventColumns = [
    { title: '时间', dataIndex: 'time', width: 100 },
    { title: '类型', dataIndex: 'type', width: 90 },
    { title: '缓存名', dataIndex: 'cacheName', width: 190 },
    { title: 'key', dataIndex: 'key' },
  ];

  // 日志表格列定义
  const logColumns = [
    { title: '时间', dataIndex: 'time', width: 100 },
    { title: '动作', dataIndex: 'action', width: 100 },
    { title: 'key', dataIndex: 'key', width: 100 },
    { title: '实际元素类型', dataIndex: 'elementType' },
    { title: '方法执行次数', dataIndex: 'methodLoads', width: 110 },
    { title: '耗时(ms)', dataIndex: 'costMillis', width: 100 },
  ];

  /**
   * 读取单对象缓存
   */
  async function readProduct() {
    const code = codeInput.value.trim();
    if (!code) {
      message.warning('请输入商品编码');
      return;
    }
    productLoading.value = true;
    try {
      const { data } = await CacheDemoApi.getProduct(code);
      productResult.value = data;
      recordLog('读单对象', data);
    } finally {
      productLoading.value = false;
    }
  }

  /**
   * 失效单对象缓存
   */
  async function evictProductCache() {
    const code = codeInput.value.trim();
    if (!code) {
      message.warning('请输入商品编码');
      return;
    }
    await CacheDemoApi.evictProduct(code);
    message.success(`已失效单对象缓存: ${code}`);
    recordLog('失效单对象', code);
  }

  /**
   * 读取列表缓存(List<T> 泛型容器, 演示重点)
   */
  async function readProductList() {
    const category = categoryInput.value.trim();
    if (!category) {
      message.warning('请输入分类编码');
      return;
    }
    listLoading.value = true;
    try {
      const { data } = await CacheDemoApi.getProductList(category);
      listResult.value = data;
      recordLog('读列表', data);
    } finally {
      listLoading.value = false;
    }
  }

  /**
   * 失效列表缓存
   */
  async function evictListCache() {
    const category = categoryInput.value.trim();
    if (!category) {
      message.warning('请输入分类编码');
      return;
    }
    await CacheDemoApi.evictProductList(category);
    message.success(`已失效列表缓存: ${category}`);
    recordLog('失效列表', category);
  }

  /**
   * 修改商品名称并触发缓存失效广播(区块 C 演示入口)
   */
  async function updateProduct() {
    const code = updateCodeInput.value.trim();
    const name = updateNameInput.value.trim();
    if (!code) {
      message.warning('请输入商品编码');
      return;
    }
    if (!name) {
      message.warning('请输入新的商品名称');
      return;
    }
    updateLoading.value = true;
    try {
      const { data } = await CacheDemoApi.updateProduct(code, name);
      if (!data) {
        message.warning(`商品不存在: ${code}`);
        return;
      }
      updatedProduct.value = data;
      message.success(`已修改「${code}」名称为「${name}」，失效广播已发出`);
      recordLog('修改商品', code);
      // JMS 广播是异步投递, 稍等后自动刷新事件流与 L1 状态, 观察通知到达效果
      setTimeout(() => {
        void refreshInvalidationView();
      }, 1000);
    } finally {
      updateLoading.value = false;
    }
  }

  /**
   * 刷新失效广播事件流 + 本节点 L1 状态
   */
  async function refreshInvalidationView() {
    eventsLoading.value = true;
    try {
      const [eventsRes, statusRes] = await Promise.all([
        CacheDemoApi.getInvalidationEvents(),
        CacheDemoApi.getL1Status(),
      ]);
      invalidationEvents.value = eventsRes.data ?? [];
      l1Status.value = statusRes.data ?? [];
    } finally {
      eventsLoading.value = false;
    }
  }

  /**
   * 失效事件时间格式化(仅时分秒)
   */
  function eventTime(time?: string) {
    return time ? new Date(time).toLocaleTimeString() : '-';
  }

  /**
   * 清空操作日志
   */
  function clearLogs() {
    logs.value = [];
  }

  // 页面加载时先展示当前事件流与 L1 状态(历史广播事件也可见)
  onMounted(() => {
    void refreshInvalidationView();
  });

  /**
   * 记录操作日志(保留最近 20 条)
   */
  function recordLog(action: string, resultOrKey: CacheDemoReadResult | string) {
    const item: LogItem =
      typeof resultOrKey === 'string'
        ? {
            time: new Date().toLocaleTimeString(),
            action,
            key: resultOrKey,
            elementType: '-',
            methodLoads: 0,
            costMillis: 0,
          }
        : {
            time: new Date().toLocaleTimeString(),
            action,
            key: resultOrKey.cacheKey ?? '-',
            elementType: resultOrKey.elementType ?? '-',
            methodLoads: resultOrKey.methodLoads ?? 0,
            costMillis: resultOrKey.costMillis ?? 0,
          };
    logs.value = [item, ...logs.value].slice(0, 20);
  }

  /**
   * 数据 JSON 展示文本
   */
  function dataJson(result?: CacheDemoReadResult) {
    if (!result || result.data == null) {
      return '-';
    }
    return JSON.stringify(result.data, null, 2);
  }
</script>

<template>
  <Page
    description="演示二级缓存（L1 Caffeine + L2 Redis）的读写、失效与类型还原，重点验证 List&lt;T&gt; 泛型容器缓存"
    title="缓存读写演示"
  >
    <!-- 验证指引 -->
    <div class="mb-4">
      <a-alert type="info" show-icon>
        <template #message>缓存架构：L1 本地缓存（TTL 60 秒）+ L2 Redis（TTL 30 分钟），L2 使用定型序列化按注册类型还原对象</template>
        <template #description>
          <div>① <b>命中观测</b>：连续点「读缓存」，「方法执行次数」不涨且耗时毫秒级 = 命中；首次未命中约 300ms（模拟慢查询）</div>
          <div>② <b>L2 反序列化验证（核心）</b>：等待 60 秒（L1 过期）后再读，元素类型仍为 <code>CacheDemoProduct</code>（绿色）说明 L2 定型序列化生效</div>
          <div>③ <b>对照实验</b>：注释后端 <code>DemoCacheValueTypeContributor</code> 的注册行并重启，L2 命中时元素类型会退化为红色 <code>java.util.LinkedHashMap</code>（即类型丢失缺陷现场）</div>
        </template>
      </a-alert>
    </div>

    <!-- 区块 A: 单对象缓存 -->
    <div class="mb-4">
      <a-card title="单对象缓存（demo:cache-product）">
        <div class="mb-3">
          <a-space-compact style="width: 100%">
            <a-input
              v-model:value="codeInput"
              allow-clear
              placeholder="请输入商品编码，如 P001"
              style="flex: 1"
              @press-enter="readProduct"
            />
            <a-button :loading="productLoading" type="primary" @click="readProduct">读缓存</a-button>
            <a-button @click="evictProductCache">失效缓存</a-button>
          </a-space-compact>
        </div>
        <!-- 快捷示例 -->
        <div>
          <span class="mr-2 text-gray-500 text-xs">快捷示例：</span>
          <a-space :size="6" wrap>
            <a-button v-for="ex in codeExamples" :key="ex" size="small" type="link" @click="codeInput = ex">
              {{ ex }}
            </a-button>
          </a-space>
        </div>

        <!-- 结果 -->
        <template v-if="productResult">
          <div class="mb-3 mt-4">
            <a-tag :color="productResult.typeMatched ? 'success' : 'error'" class="text-sm">
              {{ productResult.typeMatched ? '✅' : '❌' }}
              实际类型: {{ productResult.elementType }}
            </a-tag>
          </div>
          <a-descriptions :column="2" bordered size="small">
            <a-descriptions-item label="缓存名">
              <span class="font-mono">{{ productResult.cacheName }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="缓存 key">
              <span class="font-mono">{{ productResult.cacheKey }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="方法执行次数">
              {{ productResult.methodLoads }}
            </a-descriptions-item>
            <a-descriptions-item label="本次耗时">
              <a-tag :color="productResult.costMillis > 200 ? 'orange' : 'green'">
                {{ productResult.costMillis }} ms
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
          <!-- 序列化产物 JSON(即 L2 存储的内容形态) -->
          <div class="mt-3">
            <div class="mb-1 text-gray-500 text-xs">缓存数据（JSON 形态，与 L2 Redis 存储一致）：</div>
            <pre
              class="max-h-72 overflow-auto rounded bg-gray-50 p-3 font-mono text-xs leading-5"
            >{{ dataJson(productResult) }}</pre>
          </div>
        </template>
        <a-empty v-else class="mt-4" description="暂无结果，先输入商品编码点「读缓存」" />
      </a-card>
    </div>

    <!-- 区块 B: List<T> 泛型容器缓存(重点) -->
    <div class="mb-4">
      <a-card>
        <template #title>
          <span>
            List&lt;T&gt; 泛型容器缓存（demo:cache-product-list）
            <a-tag class="!ml-1" color="blue">演示重点</a-tag>
          </span>
        </template>
        <div class="mb-3">
          <a-space-compact style="width: 100%">
            <a-input
              v-model:value="categoryInput"
              allow-clear
              placeholder="请输入分类编码，如 drink"
              style="flex: 1"
              @press-enter="readProductList"
            />
            <a-button :loading="listLoading" type="primary" @click="readProductList">读缓存</a-button>
            <a-button @click="evictListCache">失效缓存</a-button>
          </a-space-compact>
        </div>
        <!-- 快捷示例 -->
        <div>
          <span class="mr-2 text-gray-500 text-xs">快捷示例：</span>
          <a-space :size="6" wrap>
            <a-button
              v-for="ex in categoryExamples"
              :key="ex"
              size="small"
              type="link"
              @click="categoryInput = ex"
            >
              {{ ex }}
            </a-button>
          </a-space>
        </div>

        <!-- 结果 -->
        <template v-if="listResult">
          <div class="mb-3 mt-4">
            <a-tag :color="listResult.typeMatched ? 'success' : 'error'" class="text-sm">
              {{ listResult.typeMatched ? '✅' : '❌' }}
              元素实际类型: {{ listResult.elementType }}
            </a-tag>
          </div>
          <a-descriptions :column="2" bordered size="small">
            <a-descriptions-item label="缓存名">
              <span class="font-mono">{{ listResult.cacheName }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="缓存 key">
              <span class="font-mono">{{ listResult.cacheKey }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="方法执行次数">
              {{ listResult.methodLoads }}
            </a-descriptions-item>
            <a-descriptions-item label="本次耗时">
              <a-tag :color="listResult.costMillis > 200 ? 'orange' : 'green'">
                {{ listResult.costMillis }} ms
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
          <!-- 序列化产物 JSON(列表) -->
          <div class="mt-3">
            <div class="mb-1 text-gray-500 text-xs">缓存数据（JSON 形态，与 L2 Redis 存储一致）：</div>
            <pre
              class="max-h-72 overflow-auto rounded bg-gray-50 p-3 font-mono text-xs leading-5"
            >{{ dataJson(listResult) }}</pre>
          </div>
        </template>
        <a-empty v-else class="mt-4" description="暂无结果，先输入分类编码点「读缓存」" />
      </a-card>
    </div>

    <!-- 区块 C: 修改内容 → L1 集群失效通知 -->
    <div class="mb-4">
      <a-card>
        <template #title>
          <span>
            修改内容 → L1 集群失效通知
            <a-tag class="!ml-1" color="purple">广播演示</a-tag>
          </span>
        </template>

        <!-- 机制说明 -->
        <div class="mb-4">
          <a-alert type="info" show-icon>
            <template #message>
              修改数据后的失效链路：删 Redis L2 → 删本机 L1 → 通过 Artemis multicast Topic 广播失效通知 → 每个节点的订阅者收到后删除各自 L1
            </template>
            <template #description>
              <div>① 本页事件流来自一个与平台 <code>CacheInvalidationConsumer</code> 并列的演示订阅者（multicast 下本节点也收得到自己发的广播），展示「本节点收到通知」</div>
              <div>② 多节点部署时每个节点都会收到同一条广播并删除各自 L1，实现集群 L1 一致性；广播允许丢失，L1 的 60 秒 TTL 是最终兜底</div>
              <div>③ 一次修改触发两条通知：单对象缓存精确失效（EVICT）+ 列表缓存全量失效（CLEAR，因列表 key 是分类、无法由商品编码推导）</div>
            </template>
          </a-alert>
        </div>

        <!-- 修改操作 -->
        <div class="mb-3">
          <a-space-compact style="width: 100%">
            <a-input
              v-model:value="updateCodeInput"
              allow-clear
              placeholder="商品编码，如 P001"
              style="flex: 1"
            />
            <a-input
              v-model:value="updateNameInput"
              allow-clear
              placeholder="新的商品名称"
              style="flex: 1"
              @press-enter="updateProduct"
            />
            <a-button :loading="updateLoading" type="primary" @click="updateProduct">修改并广播失效</a-button>
          </a-space-compact>
        </div>

        <!-- 修改结果 -->
        <div v-if="updatedProduct" class="mb-3">
          <a-tag color="success">已修改: {{ updatedProduct.code }} → {{ updatedProduct.name }}</a-tag>
        </div>

        <!-- 演示步骤 -->
        <div class="mb-4">
          <span class="mr-2 text-gray-500 text-xs">演示步骤：</span>
          <span class="text-gray-500 text-xs">
            在区块 A 读两次 P001（写入 L1，右侧状态卡出现 P001）→ 此处修改 P001 名称 → 事件流新增通知、L1 状态里 P001 消失 →
            回区块 A 再读，「方法执行次数」+1 且返回新名称（修改生效）
          </span>
        </div>

        <a-row :gutter="16">
          <!-- 失效广播事件流 -->
          <a-col :span="14">
            <a-card size="small" title="失效广播事件流（本节点订阅观察，最近 50 条）">
              <template #extra>
                <a-button :loading="eventsLoading" size="small" @click="refreshInvalidationView">刷新</a-button>
              </template>
              <a-table
                v-if="invalidationEvents.length > 0"
                :columns="eventColumns"
                :data-source="invalidationEvents"
                :pagination="false"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'time'">
                    {{ eventTime(record.time) }}
                  </template>
                  <template v-else-if="column.dataIndex === 'type'">
                    <a-tag :color="record.type === 'EVICT' ? 'green' : 'orange'">{{ record.type }}</a-tag>
                  </template>
                  <template v-else-if="column.dataIndex === 'cacheName'">
                    <span class="font-mono text-xs">{{ record.cacheName }}</span>
                  </template>
                  <template v-else-if="column.dataIndex === 'key'">
                    <span class="font-mono text-xs">{{ record.key || '-' }}</span>
                  </template>
                </template>
              </a-table>
              <a-empty v-else description="暂无失效通知，先修改商品或点上方「失效缓存」触发广播" />
            </a-card>
          </a-col>

          <!-- 本节点 L1 状态 -->
          <a-col :span="10">
            <a-card size="small" title="本节点 L1 缓存状态（Caffeine）">
              <div v-for="status in l1Status" :key="status.cacheName" class="mb-3">
                <div class="mb-1 flex items-center">
                  <span class="font-mono text-xs">{{ status.cacheName }}</span>
                  <a-tag class="!ml-2" :color="status.size > 0 ? 'blue' : 'default'">{{ status.size }} 条</a-tag>
                </div>
                <a-space v-if="status.keys.length > 0" :size="4" wrap>
                  <a-tag v-for="k in status.keys" :key="k" color="blue">
                    <span class="font-mono">{{ k }}</span>
                  </a-tag>
                </a-space>
                <span v-else class="text-gray-400 text-xs">（空，无缓存条目）</span>
              </div>
              <div class="text-gray-400 text-xs">
                提示：L1 的 key 与广播消息中的 key 一致（统一字符串化），通知到达后对应条目即消失
              </div>
            </a-card>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 操作日志 -->
    <a-card>
      <template #title>操作日志（最近 20 条）</template>
      <template #extra>
        <a-button size="small" @click="clearLogs">清空</a-button>
      </template>
      <a-table
        v-if="logs.length > 0"
        :columns="logColumns"
        :data-source="logs"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, text }">
          <template v-if="column.dataIndex === 'elementType'">
            <span class="font-mono text-xs">{{ text }}</span>
          </template>
        </template>
      </a-table>
      <a-empty v-else description="暂无操作记录" />
    </a-card>
  </Page>
</template>
