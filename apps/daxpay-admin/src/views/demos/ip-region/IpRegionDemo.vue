<script lang="ts" setup>
  import type { IpRegionDemoResult } from '#/api/demo/ip-region-demo.api';

  import { ref } from 'vue';

  import { Page } from '@vben/common-ui';

  import { IpRegionDemoApi } from '#/api/demo/ip-region-demo.api';
  import { useMessage } from '#/hooks/useMessage';

  const { message } = useMessage();

  // IPv4 简单格式校验正则
  const IPV4_REG = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  // IPv6 格式校验正则（覆盖完整/缩写/双栈映射等常见形态）
  const IPV6_REG = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

  // 快捷示例 IP（点击直接填入输入框）
  const examples = [
    { label: 'IPv4 电信', ip: '114.114.114.114' },
    { label: 'IPv4 谷歌', ip: '8.8.8.8' },
    { label: 'IPv6 电信', ip: '240e:3b7:3272:d8d0:db09:c067:8d59:539e' },
    { label: 'IPv6 教育网', ip: '2001:da8::1' },
    { label: 'IPv6 Cloudflare', ip: '2606:4700:4700::1111' },
  ];

  // 输入框绑定的 IP
  const ipInput = ref<string>('');
  // 查询结果
  const result = ref<IpRegionDemoResult>();
  // 查询中 loading
  const loading = ref<boolean>(false);

  // Descriptions 字段定义
  const columns = [
    { label: 'IP 地址', dataIndex: 'ip' },
    { label: '国家', dataIndex: 'country' },
    { label: '省份', dataIndex: 'province' },
    { label: '城市', dataIndex: 'city' },
    { label: '运营商', dataIndex: 'isp' },
    { label: '国家码', dataIndex: 'countryCode' },
  ];

  /**
   * 查询指定 IP 归属地
   */
  async function queryByIp() {
    const ip = ipInput.value.trim();
    if (!ip) {
      message.warning('请输入 IP 地址');
      return;
    }
    if (!IPV4_REG.test(ip) && !IPV6_REG.test(ip)) {
      message.warning('IP 地址格式不正确（支持 IPv4 / IPv6）');
      return;
    }
    await doQuery(() => IpRegionDemoApi.query(ip));
  }

  /**
   * 查询当前请求者 IP 归属地
   */
  async function queryCurrent() {
    await doQuery(() => IpRegionDemoApi.current());
  }

  /**
   * 统一执行查询并处理 loading / 结果回填
   */
  async function doQuery(fetcher: () => Promise<{ data: IpRegionDemoResult }>) {
    loading.value = true;
    try {
      const { data } = await fetcher();
      result.value = data;
      message.success('查询成功');
    } finally {
      loading.value = false;
    }
  }

  /**
   * 占位文本（空值显示）
   */
  function placeholder(val?: string) {
    return val && val.length > 0 ? val : '-';
  }
</script>

<template>
  <Page
    description="基于 ip2region 离线库，演示 IPv4 / IPv6 归属地查询能力（与审计日志 location 字段同源）"
    title="IP归属地查询演示"
  >
    <!-- 查询输入区 -->
    <div class="mb-4">
      <a-card title="查询条件">
        <p class="mb-3 text-gray-500 text-sm">
          输入任意公网 IP 地址（支持 IPv4 / IPv6）查询归属地，或点击「查询当前 IP」自动获取本机出口 IP。
        </p>
        <a-space-compact style="width: 100%">
          <a-input
            v-model:value="ipInput"
            allow-clear
            placeholder="请输入 IP 地址，如 1.2.3.4 或 240e:3b7::1"
            style="flex: 1"
            @press-enter="queryByIp"
          />
          <a-button :loading="loading" type="primary" @click="queryByIp">查询</a-button>
          <a-button :loading="loading" @click="queryCurrent">查询当前 IP</a-button>
        </a-space-compact>

        <!-- 快捷示例 -->
        <div class="mt-3">
          <span class="mr-2 text-gray-500 text-xs">快捷示例：</span>
          <a-space :size="6" wrap>
            <a-button
              v-for="ex in examples"
              :key="ex.ip"
              size="small"
              type="link"
              @click="ipInput = ex.ip"
            >
              {{ ex.label }}
            </a-button>
          </a-space>
        </div>
      </a-card>
    </div>

    <!-- 查询结果区 -->
    <a-card title="查询结果">
      <template v-if="result">
        <!-- 归属地格式化文本（突出展示） -->
        <div class="mb-4">
          <a-alert type="success" show-icon>
            <template #message>
              <span>
                归属地：{{ result.regionStr || '-' }}
                <a-tag :color="result.ip?.includes(':') ? 'purple' : 'blue'" class="!ml-2">
                  {{ result.ip?.includes(':') ? 'IPv6' : 'IPv4' }}
                </a-tag>
              </span>
            </template>
          </a-alert>
        </div>

        <!-- 结构化字段 -->
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item v-for="col in columns" :key="col.dataIndex" :label="col.label">
            <span class="font-mono">{{ placeholder((result as any)[col.dataIndex]) }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="内网地址">
            <a-tag :color="result.innerIp ? 'orange' : 'default'">
              {{ result.innerIp ? '是' : '否' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="国内地址">
            <a-tag :color="result.chinaIp ? 'green' : 'default'">
              {{ result.chinaIp ? '是' : '否' }}
            </a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </template>
      <a-empty v-else description="暂无查询结果，先输入 IP 或查询当前 IP" />
    </a-card>
  </Page>
</template>
