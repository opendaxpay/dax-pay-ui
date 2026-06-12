<script lang="ts" setup>
  import { ref } from 'vue';

  import { Page } from '@vben/common-ui';

  import { RegionCascader } from '#/components/region';

  const lastModeValue = ref<string>();
  const arrayModeValue = ref<string[]>([]);
  const provinceCityValue = ref<string>();
  const fullRegionValue = ref<string>();

  function clearAll() {
    lastModeValue.value = undefined;
    arrayModeValue.value = [];
    provinceCityValue.value = undefined;
    fullRegionValue.value = undefined;
  }

  function setTestValue() {
    lastModeValue.value = '110101';
    arrayModeValue.value = ['11', '1101', '110101'];
    provinceCityValue.value = '1101';
    fullRegionValue.value = '110101';
  }
</script>

<template>
  <Page description="中国行政区划级联选择器组件示例" title="行政区划选择器 Demo">
    <a-card class="mb-4" title="基本用法">
      <a-row :gutter="24">
        <a-col :span="12">
          <div class="mb-2 font-medium"> 只绑定最后一级值 (valueMode="last") </div>
          <RegionCascader v-model="lastModeValue" placeholder="请选择省市区" />
          <div class="mt-2 text-gray-500"> 绑定值: {{ lastModeValue || '(未选择)' }} </div>
        </a-col>
        <a-col :span="12">
          <div class="mb-2 font-medium"> 绑定完整路径数组 (valueMode="array") </div>
          <RegionCascader v-model="arrayModeValue" placeholder="请选择省市区" value-mode="array" />
          <div class="mt-2 text-gray-500"> 绑定值: {{ JSON.stringify(arrayModeValue) }} </div>
        </a-col>
      </a-row>
    </a-card>

    <a-card class="mb-4" title="不同层级">
      <a-row :gutter="24">
        <a-col :span="8">
          <div class="mb-2 font-medium">省市二级联动</div>
          <RegionCascader v-model="provinceCityValue" :level="2" placeholder="请选择省市" />
          <div class="mt-2 text-gray-500"> 绑定值: {{ provinceCityValue || '(未选择)' }} </div>
        </a-col>
        <a-col :span="8">
          <div class="mb-2 font-medium">省市区三级联动</div>
          <RegionCascader v-model="fullRegionValue" :level="3" placeholder="请选择省市区" />
          <div class="mt-2 text-gray-500"> 绑定值: {{ fullRegionValue || '(未选择)' }} </div>
        </a-col>
        <a-col :span="8">
          <div class="mb-2 font-medium">省市区县四级联动</div>
          <RegionCascader :level="4" placeholder="请选择省市区县街道" disabled />
          <div class="mt-2 text-gray-500 text-sm"> (需要街道数据支持) </div>
        </a-col>
      </a-row>
    </a-card>

    <a-card class="mb-4" title="操作按钮">
      <a-space>
        <a-button type="primary" @click="setTestValue"> 设置测试值 (北京市东城区) </a-button>
        <a-button danger @click="clearAll"> 清空所有 </a-button>
      </a-space>
    </a-card>

    <a-card title="回显测试">
      <a-alert class="mb-4" message="回显原理说明" type="info" show-icon>
        <template #description>
          <p>中国行政区划代码本身包含层级关系：</p>
          <ul class="list-disc pl-4">
            <li>省份代码: 2位 (如: 11 = 北京市)</li>
            <li>城市代码: 4位 (如: 1101 = 市辖区)</li>
            <li>区县代码: 6位 (如: 110101 = 东城区)</li>
            <li>街道代码: 9位</li>
          </ul>
          <p class="mt-2">
            因此，只需要最后一级代码，就可以通过切片计算出完整的路径。 例如: 110101 → [11, 1101, 110101]
          </p>
        </template>
      </a-alert>
      <a-row :gutter="24">
        <a-col :span="8">
          <div class="mb-2 font-medium">预设值: 110101 (东城区)</div>
          <RegionCascader v-model="lastModeValue" />
        </a-col>
        <a-col :span="8">
          <div class="mb-2 font-medium">预设值: 320102 (玄武区)</div>
          <RegionCascader v-model="lastModeValue" />
        </a-col>
        <a-col :span="8">
          <div class="mb-2 font-medium">预设值: 440305 (南山区)</div>
          <RegionCascader v-model="lastModeValue" />
        </a-col>
      </a-row>
    </a-card>
  </Page>
</template>
