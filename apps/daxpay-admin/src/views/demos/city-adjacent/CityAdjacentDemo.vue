<script lang="ts" setup>
  import type { GeoFenceCityInfo, GeoFencePreview, Region } from '#/api/core/region.api';
  import type { IpRegionDemoResult } from '#/api/demo/ip-region-demo.api';

  import { computed, onMounted, ref, watch } from 'vue';

  import { Page } from '@vben/common-ui';

  import { ChinaRegionApi } from '#/api/core/region.api';
  import { IpRegionDemoApi } from '#/api/demo/ip-region-demo.api';
  import { RegionCascader } from '#/components/region';
  import { useMessage } from '#/hooks/useMessage';

  const { message } = useMessage();

  // IPv4 格式校验
  const IPV4_REG = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

  // IP 输入与查询结果
  const ipInput = ref('');
  const ipResult = ref<IpRegionDemoResult>();
  const ipLoading = ref(false);
  // IP → 地级市匹配说明
  const resolveNote = ref('');

  // 选中的城市编码(4位, IP 定位与手动选择共用此状态)
  const selectedCityCode = ref<string>();
  const preview = ref<GeoFencePreview>();
  const loading = ref(false);

  // 省市树(用于 IP 城市名 → 城市编码反查, 与 RegionCascader 同源)
  const provinces = ref<Region[]>([]);
  // 直辖市省名(归一化后)
  const DIRECT_CITY = new Set(['上海', '北京', '天津', '重庆']);

  onMounted(async () => {
    const { data } = await ChinaRegionApi.findAllProvinceAndCity();
    provinces.value = data;
  });

  // 交界地市表格列
  const adjacentColumns = computed(() => [
    { title: '城市编码', dataIndex: 'code', width: 120 },
    { title: '城市名称', dataIndex: 'name' },
    { title: '所属省份', dataIndex: 'provinceName', width: 160 },
  ]);

  // 严格策略: 仅允许门店所在市本身
  const strictList = computed<GeoFenceCityInfo[]>(() => (preview.value ? [preview.value.city] : []));
  // 平衡策略: 门店所在市 + 交界邻市
  const balancedList = computed<GeoFenceCityInfo[]>(() => {
    if (!preview.value) return [];
    return [preview.value.city, ...preview.value.adjacentCities];
  });
  // 宽松策略: 门店所在省的全部地级市
  const looseList = computed<GeoFenceCityInfo[]>(() => (preview.value ? preview.value.provinceCities : []));

  /**
   * 归一化城市/省份名: 去首尾空格, 去掉结尾一个"市"或"省"
   * 与后端 GeoFenceUtil.normalizeRegionName 同口径
   */
  function normalizeName(s: string | undefined): string {
    let r = (s || '').trim();
    if (r.endsWith('市') || r.endsWith('省')) {
      r = r.slice(0, -1);
    }
    return r;
  }

  /**
   * 将 IP 归属地解析为 base_city 4 位编码
   * 直辖市取省份下的唯一市; 普通市按归一化名称全局匹配
   */
  function resolveCityCode(ip: IpRegionDemoResult): string | undefined {
    if (ip.innerIp || !ip.chinaIp) {
      return undefined;
    }
    const provName = normalizeName(ip.province);
    // 直辖市: 省份下只有一个市辖区域({省码}01)
    if (DIRECT_CITY.has(provName)) {
      const prov = provinces.value.find((p) => normalizeName(p.name) === provName);
      return prov?.children?.[0]?.code;
    }
    // 普通市: 按归一化城市名全局匹配
    const cityName = normalizeName(ip.city);
    if (!cityName) {
      return undefined;
    }
    for (const prov of provinces.value) {
      for (const c of prov.children ?? []) {
        if (normalizeName(c.name) === cityName) {
          return c.code;
        }
      }
    }
    return undefined;
  }

  /**
   * 选择城市后加载围栏预览数据
   */
  async function loadPreview(cityCode?: string) {
    if (!cityCode) {
      preview.value = undefined;
      return;
    }
    loading.value = true;
    try {
      const { data } = await ChinaRegionApi.previewGeoFence(cityCode);
      preview.value = data;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 查询指定 IP 归属地并自动定位地级市
   */
  async function queryByIp() {
    const ip = ipInput.value.trim();
    if (!ip) {
      message.warning('请输入 IP 地址');
      return;
    }
    if (!IPV4_REG.test(ip)) {
      message.warning('IP 地址格式不正确');
      return;
    }
    await doIpQuery(() => IpRegionDemoApi.query(ip));
  }

  /**
   * 查询当前请求者 IP 归属地
   */
  async function queryCurrent() {
    await doIpQuery(() => IpRegionDemoApi.current());
  }

  /**
   * 统一执行 IP 查询: 拿归属地 → 反查城市编码 → 自动选中(触发围栏预览)
   */
  async function doIpQuery(fetcher: () => Promise<{ data: IpRegionDemoResult }>) {
    ipLoading.value = true;
    try {
      const { data } = await fetcher();
      ipResult.value = data;
      const code = resolveCityCode(data);
      if (code) {
        resolveNote.value = `已匹配到地级市，已自动选中并加载围栏预览`;
        // 自动选中会触发 watch → loadPreview, 并同步级联选择器回显
        selectedCityCode.value = code;
      } else if (data.innerIp) {
        resolveNote.value = '内网地址，无法定位地级市';
      } else if (data.chinaIp) {
        resolveNote.value = `「${data.city || data.province || '-'}」未能匹配到 base_city 地级市`;
      } else {
        resolveNote.value = '非中国大陆地址，无法定位地级市';
      }
    } finally {
      ipLoading.value = false;
    }
  }

  // 选择变化触发查询: 仅当选到地级市(4位编码)时才查询, 选到省份(2位)或清空时不触发
  watch(selectedCityCode, (code) => {
    if (code && code.length === 4) {
      loadPreview(code);
    } else {
      preview.value = undefined;
    }
  });
</script>

<template>
  <Page
    description="输入 IP 自动定位所在地级市（也可手动选择），查看其交界城市并模拟地理围栏三级策略的放行范围"
    title="地市交界演示"
  >
    <!-- IP 归属地定位 -->
    <div class="mb-4">
      <a-card title="IP 归属地定位">
        <p class="mb-3 text-gray-500 text-sm">
          输入任意公网 IPv4 地址，自动定位所在地级市并展示交界邻市与围栏策略；或点击「查询当前 IP」获取本机出口 IP。
        </p>
        <a-space-compact style="width: 100%">
          <a-input
            v-model:value="ipInput"
            allow-clear
            placeholder="请输入 IPv4 地址，如 1.2.3.4"
            style="flex: 1"
            @press-enter="queryByIp"
          />
          <a-button :loading="ipLoading" type="primary" @click="queryByIp">查询</a-button>
          <a-button :loading="ipLoading" @click="queryCurrent">查询当前 IP</a-button>
        </a-space-compact>

        <template v-if="ipResult">
          <div class="mt-4">
            <a-alert :message="`归属地：${ipResult.regionStr || '-'}`" type="success" show-icon />
          </div>
          <div class="mt-3">
            <a-descriptions :column="3" bordered size="small">
              <a-descriptions-item label="省份">
                <span class="font-mono">{{ ipResult.province || '-' }}</span>
              </a-descriptions-item>
              <a-descriptions-item label="城市">
                <span class="font-mono">{{ ipResult.city || '-' }}</span>
              </a-descriptions-item>
              <a-descriptions-item label="运营商">
                <span class="font-mono">{{ ipResult.isp || '-' }}</span>
              </a-descriptions-item>
              <a-descriptions-item label="内网地址">
                <a-tag :color="ipResult.innerIp ? 'orange' : 'default'">
                  {{ ipResult.innerIp ? '是' : '否' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="国内地址">
                <a-tag :color="ipResult.chinaIp ? 'green' : 'default'">
                  {{ ipResult.chinaIp ? '是' : '否' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="地级市匹配">
                <span :class="resolveNote.startsWith('已匹配') ? 'text-green-600' : 'text-orange-500'">
                  {{ resolveNote || '-' }}
                </span>
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </template>
      </a-card>
    </div>

    <!-- 手动选择地市 -->
    <div class="mb-4">
      <a-card title="或手动选择地市">
        <p class="mb-3 text-gray-500 text-sm">
          也可以直接选择省份与地级市（直辖市选择对应“市辖区”），与 IP 定位结果互通。
        </p>
        <RegionCascader v-model="selectedCityCode" :level="2" class="w-full sm:max-w-md" value-mode="last" />
      </a-card>
    </div>

    <template v-if="preview">
      <!-- 交界地市 -->
      <div class="mb-4">
        <a-card title="交界地市">
          <template #extra>
            <a-tag color="blue">共 {{ preview.adjacentCities.length }} 个交界市</a-tag>
          </template>

          <!-- 孤立市无邻市提示 -->
          <a-alert v-if="preview.adjacentCities.length === 0" message="该城市无交界邻市" type="warning" show-icon>
            <template #description>
              海南等省直管市因被县级单位隔开、或为海岛，在 base_city 地级市层面彼此不直接接壤，balanced 策略将与 strict
              一致。
            </template>
          </a-alert>

          <a-table
            v-else
            :columns="adjacentColumns"
            :data-source="preview.adjacentCities"
            :pagination="false"
            :loading="loading"
            row-key="code"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <span v-if="column.dataIndex === 'code'" class="font-mono">{{ record.code }}</span>
            </template>
          </a-table>
        </a-card>
      </div>

      <!-- 风控三级策略模拟 -->
      <a-card title="风控三级策略模拟">
        <p class="mb-4 text-gray-500 text-sm">
          以「{{ preview.city.name }}」为门店所在地，三种地理围栏策略的放行城市范围如下：
        </p>
        <a-row :gutter="[16, 16]">
          <!-- 严格 -->
          <a-col :lg="8" :md="24" :xs="24">
            <a-card class="h-full" size="small">
              <template #title>
                <a-space :size="6">
                  <a-tag color="red">严格</a-tag>
                  <span>{{ strictList.length }}</span>
                </a-space>
              </template>
              <p class="mb-3 text-gray-400 text-xs"> 仅允许门店所在市本身，其他城市一律拦截。 </p>
              <a-space :size="6" wrap>
                <a-tag v-for="c in strictList" :key="c.code" color="processing">
                  {{ c.name }}
                </a-tag>
              </a-space>
            </a-card>
          </a-col>
          <!-- 平衡 -->
          <a-col :lg="8" :md="24" :xs="24">
            <a-card class="h-full" size="small">
              <template #title>
                <a-space :size="6">
                  <a-tag color="blue">平衡</a-tag>
                  <span>{{ balancedList.length }}</span>
                </a-space>
              </template>
              <p class="mb-3 text-gray-400 text-xs"> 允许门店所在市及其交界邻市（可跨省）。 </p>
              <a-space :size="6" wrap>
                <a-tag
                  v-for="c in balancedList"
                  :key="c.code"
                  :color="c.code === preview.city.code ? 'processing' : 'default'"
                >
                  {{ c.name }}
                </a-tag>
              </a-space>
            </a-card>
          </a-col>
          <!-- 宽松 -->
          <a-col :lg="8" :md="24" :xs="24">
            <a-card class="h-full" size="small">
              <template #title>
                <a-space :size="6">
                  <a-tag color="green">宽松</a-tag>
                  <span>{{ looseList.length }}</span>
                </a-space>
              </template>
              <p class="mb-3 text-gray-400 text-xs"> 允许门店所在省的全部地级市。 </p>
              <a-space :size="6" wrap>
                <a-tag
                  v-for="c in looseList"
                  :key="c.code"
                  :color="c.code === preview.city.code ? 'processing' : 'default'"
                >
                  {{ c.name }}
                </a-tag>
              </a-space>
            </a-card>
          </a-col>
        </a-row>
      </a-card>
    </template>

    <!-- 未选择占位 -->
    <a-card v-else>
      <a-empty description="请输入 IP 自动定位，或在上方手动选择一个地级市" />
    </a-card>
  </Page>
</template>
