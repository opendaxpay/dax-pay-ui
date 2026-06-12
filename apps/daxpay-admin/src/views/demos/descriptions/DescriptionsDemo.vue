<script lang="ts" setup>
  import { Page } from '@vben/common-ui';
  import { $t } from '@vben/locales';

  import { useMessage } from '#/hooks/useMessage';

  const { message } = useMessage();

  const mockUserInfo = {
    name: '张伟',
    age: 32,
    email: 'zhangwei@example.com',
    phone: '138-0013-8000',
    address: '北京市朝阳区建国路88号',
    department: '技术研发部',
    position: '高级前端工程师',
    salary: '25,000',
    entryDate: '2021-03-15',
    status: '在职',
  };

  const mockOrderInfo = {
    orderNo: 'DD20241201000001',
    product: 'iPhone 15 Pro Max 256GB',
    quantity: 1,
    amount: '¥9,999.00',
    payment: '支付宝',
    status: '已发货',
    receiver: '李明',
    receiverPhone: '139-1234-5678',
    shippingAddress: '上海市浦东新区世纪大道100号',
    orderTime: '2024-12-01 10:30:00',
    deliveryTime: '2024-12-02 14:20:00',
  };

  const mockSystemInfo = {
    os: 'Windows 11 专业版 23H2',
    browser: 'Chrome 120.0.6099.130',
    resolution: '1920 × 1080',
    language: '简体中文 (zh-CN)',
    timezone: '中国标准时间 (UTC+8)',
    memory: '已使用 4.2 GB / 16.0 GB',
    cpu: 'Intel Core i7-12700K',
    gpu: 'NVIDIA GeForce RTX 3080',
    network: 'Wi-Fi 6 (802.11ax)',
    ip: '192.168.1.100',
  };

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    // 国际化：复制成功
    message.success($t('demos.descriptions.copySuccess'));
  }
</script>

<template>
  <Page description="展示Descriptions描述列表的多种用法" title="Descriptions描述列表">
    <!-- 基础用法 -->
    <a-card class="mb-4" title="基础用法">
      <a-descriptions title="用户信息" :column="3">
        <a-descriptions-item label="姓名">张三</a-descriptions-item>
        <a-descriptions-item label="年龄">28</a-descriptions-item>
        <a-descriptions-item label="邮箱">zhangsan@example.com</a-descriptions-item>
        <a-descriptions-item label="手机号">138-0000-0000</a-descriptions-item>
        <a-descriptions-item label="地址">北京市朝阳区</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 带边框 -->
    <a-card class="mb-4" title="带边框 bordered">
      <a-descriptions :column="2" bordered size="large">
        <a-descriptions-item label="姓名">{{ mockUserInfo.name }}</a-descriptions-item>
        <a-descriptions-item label="年龄">{{ mockUserInfo.age }}</a-descriptions-item>
        <a-descriptions-item label="邮箱">{{ mockUserInfo.email }}</a-descriptions-item>
        <a-descriptions-item label="手机号">{{ mockUserInfo.phone }}</a-descriptions-item>
        <a-descriptions-item :span="2" label="地址">{{ mockUserInfo.address }}</a-descriptions-item>
        <a-descriptions-item :span="2" label="在职信息">
          <a-tag color="green">在职</a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 带边框 + 小尺寸 -->
    <a-card class="mb-4" title="带边框小尺寸 bordered + size=small">
      <a-descriptions :column="3" bordered size="small">
        <a-descriptions-item label="工号">EMP001</a-descriptions-item>
        <a-descriptions-item label="部门">{{ mockUserInfo.department }}</a-descriptions-item>
        <a-descriptions-item label="职位">{{ mockUserInfo.position }}</a-descriptions-item>
        <a-descriptions-item label="入职日期">{{ mockUserInfo.entryDate }}</a-descriptions-item>
        <a-descriptions-item label="薪资">{{ mockUserInfo.salary }} /月</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-badge status="success" text="正常" />
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 订单信息 -->
    <a-card class="mb-4" title="订单信息示例">
      <a-descriptions :column="3" bordered size="large">
        <a-descriptions-item label="订单编号">
          <a @click="handleCopy(mockOrderInfo.orderNo)">{{ mockOrderInfo.orderNo }}</a>
        </a-descriptions-item>
        <a-descriptions-item label="商品">{{ mockOrderInfo.product }}</a-descriptions-item>
        <a-descriptions-item label="数量">{{ mockOrderInfo.quantity }}</a-descriptions-item>
        <a-descriptions-item label="金额">
          <span class="text-red-500 font-bold">{{ mockOrderInfo.amount }}</span>
        </a-descriptions-item>
        <a-descriptions-item label="支付方式">{{ mockOrderInfo.payment }}</a-descriptions-item>
        <a-descriptions-item label="订单状态">
          <a-tag color="blue">{{ mockOrderInfo.status }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="收货人">{{ mockOrderInfo.receiver }}</a-descriptions-item>
        <a-descriptions-item label="联系电话">{{ mockOrderInfo.receiverPhone }}</a-descriptions-item>
        <a-descriptions-item label="收货地址">{{ mockOrderInfo.shippingAddress }}</a-descriptions-item>
        <a-descriptions-item label="下单时间">{{ mockOrderInfo.orderTime }}</a-descriptions-item>
        <a-descriptions-item label="发货时间">{{ mockOrderInfo.deliveryTime }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 系统信息 -->
    <a-card class="mb-4" title="系统信息示例">
      <a-descriptions :column="2" bordered size="small">
        <a-descriptions-item label="操作系统">{{ mockSystemInfo.os }}</a-descriptions-item>
        <a-descriptions-item label="浏览器">{{ mockSystemInfo.browser }}</a-descriptions-item>
        <a-descriptions-item label="分辨率">{{ mockSystemInfo.resolution }}</a-descriptions-item>
        <a-descriptions-item label="语言">{{ mockSystemInfo.language }}</a-descriptions-item>
        <a-descriptions-item label="时区">{{ mockSystemInfo.timezone }}</a-descriptions-item>
        <a-descriptions-item label="网络">{{ mockSystemInfo.network }}</a-descriptions-item>
        <a-descriptions-item :span="2" label="内存使用">
          <a-progress :percent="26" size="small" status="active" />
        </a-descriptions-item>
        <a-descriptions-item :span="2" label="CPU">{{ mockSystemInfo.cpu }}</a-descriptions-item>
        <a-descriptions-item :span="2" label="显卡">{{ mockSystemInfo.gpu }}</a-descriptions-item>
        <a-descriptions-item :span="2" label="本地IP">{{ mockSystemInfo.ip }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 无边框 -->
    <a-card class="mb-4" title="无边框 plain">
      <a-descriptions :column="3" size="large">
        <a-descriptions-item label="姓名">李四</a-descriptions-item>
        <a-descriptions-item label="年龄">25</a-descriptions-item>
        <a-descriptions-item label="邮箱">lisi@example.com</a-descriptions-item>
        <a-descriptions-item label="手机号">139-0000-0000</a-descriptions-item>
        <a-descriptions-item label="地址">上海市浦东新区</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 竖排列表 -->
    <a-card class="mb-4" title="竖排列表 vertical">
      <a-descriptions :column="2" layout="vertical" size="large">
        <a-descriptions-item label="姓名">王五</a-descriptions-item>
        <a-descriptions-item label="年龄">30</a-descriptions-item>
        <a-descriptions-item label="邮箱">wangwu@example.com</a-descriptions-item>
        <a-descriptions-item label="手机号">137-0000-0000</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 带操作按钮 -->
    <a-card class="mb-4" title="带操作">
      <a-descriptions :column="3" bordered>
        <a-descriptions-item label="姓名">赵六</a-descriptions-item>
        <a-descriptions-item label="年龄">35</a-descriptions-item>
        <a-descriptions-item label="邮箱">zhaoliu@example.com</a-descriptions-item>
        <a-descriptions-item :span="3" label="地址">广州市天河区</a-descriptions-item>
        <a-descriptions-item :span="3" label="操作">
          <a-space>
            <a-button size="small" type="primary">编辑</a-button>
            <a-button size="small" danger>删除</a-button>
            <a-button size="small">详情</a-button>
          </a-space>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </Page>
</template>
