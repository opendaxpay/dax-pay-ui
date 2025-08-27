<template>
  <div class="p-3 pt-5">
    <!-- 卡片统计 -->
    <a-row :gutter="48" justify="space-around">
      <a-col :span="8" class="cardBox">
        <a-card class="card" title="延时桶数量">
          <a-statistic :value="bucketList.length" />
        </a-card>
      </a-col>
      <a-col :span="8" class="cardBox">
        <a-card class="card" title="就绪Topic数量">
          <a-statistic :value="readyList.length" />
        </a-card>
      </a-col>
      <a-col :span="8" class="cardBox">
        <a-card class="card" title="死信Topic数量">
          <a-statistic :value="deadList.length" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 延时桶列表 -->
    <a-row :gutter="16" justify="space-between" style="margin-top: 20px">
      <a-col :span="24">
        <div class="delayBox">
          <div class="section-title">延时桶列表</div>
          <ul class="list-container">
            <li v-for="item in bucketList" :key="item.name" class="list-item">
              {{ item.name }}: {{ item.count }}
            </li>
          </ul>
        </div>
      </a-col>
    </a-row>

    <!-- 就绪主题列表 -->
    <a-row :gutter="16" justify="space-between" style="margin-top: 20px">
      <a-col :span="12">
        <div class="gutter-box">
          <div class="section-title">就绪主题列表</div>
          <ul class="list-container">
            <li
              v-for="item in readyList"
              :key="item.name"
              class="list-item"
              :class="{ active: selectedItem == item.name }"
              @click="selectClick(item.name, 'ready')"
            >
              {{ item.name }}: {{ item.count }}
            </li>
          </ul>
        </div>
      </a-col>
      <a-col :span="12">
        <div class="gutter-box">
          <div class="section-title">就绪任务分页</div>
          <div class="delayTable">
            <div class="tableBox">
              <vxe-table
                height="auto"
                ref="xTable"
                key-field="id"
                :data="paginationOne.records"
                :loading="loadingOne"
              >
                <vxe-column field="topic" title="任务类型" />
                <vxe-column field="delayTime" title="执行时间" />
                <vxe-column field="ttrTime" title="再次投递时间" />
                <vxe-column field="message" title="消息内容" />
                <vxe-column field="retryCount" title="重试次数" />
                <vxe-column field="status" title="任务状态" />
              </vxe-table>
            </div>
            <div class="tabPage">
              <vxe-pager
                size="medium"
                :loading="loadingOne"
                :current-page="paginationOne.current"
                :page-size="paginationOne.size"
                :total="paginationOne.total"
                @page-change="handleTableChangeOne"
              />
            </div>
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- 死信主题列表 -->
    <a-row :gutter="16" justify="space-between" style="margin-top: 20px">
      <a-col :span="12">
        <div class="gutter-box">
          <div class="section-title">死信主题列表</div>
          <ul class="list-container">
            <li
              v-for="item in deadList"
              :key="item.name"
              class="list-item"
              :class="{ active: selectedItemTwo == item.name }"
              @click="selectClick(item.name, 'dead')"
            >
              {{ item.name }}: {{ item.count }}
            </li>
          </ul>
        </div>
      </a-col>
      <a-col :span="12">
        <div class="gutter-box">
          <div class="section-title">死信任务分页</div>
          <div class="delayTable">
            <div class="tableBox">
              <vxe-table
                height="auto"
                ref="xTable"
                key-field="id"
                :data="paginationTwo.records"
                :loading="loadingTwo"
              >
                <vxe-column field="topic" title="任务类型" />
                <vxe-column field="delayTime" title="执行时间" />
                <vxe-column field="ttrTime" title="再次投递时间" />
                <vxe-column field="message" title="消息内容" />
                <vxe-column field="retryCount" title="重试次数" />
                <vxe-column field="status" title="任务状态" />
              </vxe-table>
            </div>
            <div class="tabPage">
              <vxe-pager
                size="medium"
                :loading="loadingTwo"
                :current-page="paginationTwo.current"
                :page-size="paginationTwo.size"
                :total="paginationTwo.total"
                @page-change="handleTableChangeTwo"
              />
            </div>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import {
    BucketResult,
    getBucket,
    getDeadTopic,
    getReadyTopic,
    TopicResult,
  } from '@/views/baseapi/delay/DelayQuery.api'
  import useTablePage from '@/hooks/bootx/useTablePage'
  import { pageReadyJob, pageDeadJob } from './DelayQuery.api'
  // 获取解析就绪对象
  const {
    handleTableChange: handleTableChangeOne,
    pageQueryResHandel: pageQueryResHandelOne,
    pagination: paginationOne,
    pages: pagesOne,
    model: modelOne,
    loading: loadingOne,
  } = useTablePage(queryPageReady)

  //获取解死信就绪对象
  const {
    handleTableChange: handleTableChangeTwo,
    pageQueryResHandel: pageQueryResHandelTwo,
    pagination: paginationTwo,
    pages: pagesTwo,
    model: modelTwo,
    loading: loadingTwo,
  } = useTablePage(queryPageDeadJob)

  const bucketList = ref<BucketResult[]>([])
  const readyList = ref<TopicResult[]>([])
  const deadList = ref<TopicResult[]>([])

  // 绑定就绪列表
  const selectedItem = ref<string>('')
  // 绑定死信列表
  const selectedItemTwo = ref<string>('')
  //储存就绪topic
  const topicReady = ref<string>('')
  //储存死信topic
  const topicDead = ref<string>('')
  //点击那个赋值
  const selectClick = (name: any, type: any) => {
    if (type == 'ready') {
      selectedItem.value = name // 更新选中项
      topicReady.value = name
      queryPageReady()
    }
    if (type == 'dead') {
      selectedItemTwo.value = name // 更新选中项
      topicDead.value = name
      queryPageDeadJob()
    }
  }

  onMounted(async () => {
    await initData()
    //如果列表有的话 选中第一个
    if (readyList.value.length > 0) {
      //储存top值
      topicReady.value = readyList.value[0].name || ''
      //回显选中状态
      selectedItem.value = readyList.value[0].name || ''
      queryPageReady()
    }
    if (deadList.value.length > 0) {
      topicDead.value = deadList.value[0].name || ''
      selectedItemTwo.value = deadList.value[0].name || ''
      queryPageDeadJob()
    }
  })

  /**
   * 初始化数据
   */
  async function initData() {
    try {
      const [bucketData, readyData, deadData] = await Promise.all([
        getBucket(),
        getReadyTopic(),
        getDeadTopic(),
      ])
      bucketList.value = bucketData.data
      readyList.value = readyData.data
      deadList.value = deadData.data
    } catch (error) {
      console.error('初始化失败')
    }
  }

  // 就绪任务分页查询
  function queryPageReady() {
    loadingOne.value = true
    pageReadyJob({
      ...pagesOne,
      topic: topicReady.value,
    }).then(({ data }) => {
      pageQueryResHandelOne(data)
    })
    return Promise.resolve()
  }

  //死信任务分页查询
  function queryPageDeadJob() {
    loadingTwo.value = true
    pageDeadJob({
      ...pagesTwo,
      topic: topicDead.value,
    }).then(({ data }) => {
      pageQueryResHandelTwo(data)
    })
    return Promise.resolve()
  }
</script>
<style lang="less">
  /* 自定义滚动条样式 */
  ::-webkit-scrollbar {
    width: 0.4vw; /* 滚动条宽度 */
    height: 0.4vw;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #d9d9d9; /* 滑块颜色 */
    cursor: pointer;
    border-radius: 0.3vw; /* 圆角 */
  }

  ::-webkit-scrollbar-track {
    background-color: #fff; /* 轨道颜色 */
    border-radius: 0.3vw; /* 圆角 */
  }
</style>

<style scoped lang="less">
  .cardBox {
    display: flex;
    justify-content: center;
    align-items: center;

    .card {
      width: 100%;
      text-align: center;
      border-radius: 0.4167vw;
      box-shadow: 0 0.2083vw 0.3125vw rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        cursor: pointer;
      }
    }
  }
  // 延时桶
  .delayBox {
    height: auto;
    padding: 1vw;
    background-color: #fff;
    border-radius: 0.4167vw;
    box-shadow: 0 0.2083vw 0.3125vw rgba(0, 0, 0, 0.1);

    .section-title {
      height: 2.125vw;
      font-size: 1.2vw;
      font-weight: bold;
      margin-bottom: 0.8vw;
      color: #333;
      text-align: left;
    }

    .list-container {
      height: calc(100% - 2.125vw);
      list-style: none;
      padding: 0;
      margin: 0;
      flex-wrap: wrap;
      display: flex;
      gap: 1.0417vw;

      .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.6vw 0.8vw;
        margin-bottom: 0.4vw;
        background-color: #f9f9f9;
        border-radius: 0.5vw;
        font-size: 0.9vw;
        color: #555;
        transition: all 0.3s;

        &:hover {
          background-color: #e6f7ff;
          transform: scale(1.02);
          cursor: pointer;
        }
      }
    }
  }
  .gutter-box {
    height: 20.0208vw;
    padding: 1vw;
    background-color: #fff;
    border-radius: 0.4167vw;
    box-shadow: 0 0.2083vw 0.3125vw rgba(0, 0, 0, 0.1);

    .section-title {
      height: 2.125vw;
      font-size: 1.2vw;
      font-weight: bold;
      margin-bottom: 0.8vw;
      color: #333;
      text-align: left;
    }
    .delayTable {
      height: calc(100% - 2.125vw);
      padding: 0;
      margin: 0;
      .tableBox {
        height: 80%;
      }
      .tabPage {
        height: 20%;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }
    }

    .list-container {
      height: calc(100% - 2.125vw);
      list-style: none;
      padding: 0;
      margin: 0;
      overflow: scroll;

      .list-item {
        width: 99%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.6vw 0.8vw;
        margin-bottom: 0.4vw;
        background-color: #f9f9f9;
        border-radius: 0.3vw;
        font-size: 0.9vw;
        color: #555;
        transition: all 0.3s;

        &:hover {
          background-color: #e6f7ff;
          transform: scale(1.02);
          cursor: pointer;
        }
        &.active {
          background-color: #e6f7ff;
          transform: scale(1.02);
          cursor: pointer;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
</style>
