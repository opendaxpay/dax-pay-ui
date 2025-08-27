<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <a-form>
        <a-col>
          <a-form-item label="省市二级联动(全部加载)">
            <a-row>
              <cascader
                style="width: 250px"
                change-on-select
                :field-names="fieldNames"
                :options="pc"
                placeholder="请选择省市"
              />
            </a-row>
          </a-form-item>
          <a-form-item label="省市区三级联动(全部加载)">
            <a-row>
              <cascader
                style="width: 300px"
                change-on-select
                :field-names="fieldNames"
                :options="pca"
                placeholder="请选择省市区"
              />
            </a-row>
          </a-form-item>
<!--          <a-form-item label="省市区街道社区四级联动(动态加载)">-->
<!--            <a-row>-->
<!--              <cascader-->
<!--                style="width: 400px"-->
<!--                change-on-select-->
<!--                :field-names="fieldNames"-->
<!--                :options="pcaCascade"-->
<!--                :load-data="loadNextRegions"-->
<!--                placeholder="请选择行政区域"-->
<!--              />-->
<!--            </a-row>-->
<!--          </a-form-item>-->
        </a-col>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { Cascader } from 'ant-design-vue'
  import {
    findAllProvinceAndCity,
    findAllProvinceAndCityAndArea,
    findAllRegionByParentCode,
    Region,
  } from '@/api/common/ChinaRegion.api'
  import { onMounted, ref } from 'vue'
  import { DefaultOptionType } from 'ant-design-vue/es/vc-cascader'
  import { cloneDeep } from 'lodash-es'

  const fieldNames = {
    label: 'name',
    value: 'code',
    children: 'children',
  }
  let pc = ref<Region[]>([])
  let pca = ref<Region[]>([])
  let pcaCascade = ref<Region[]>([])

  onMounted(() => {
    findAllProvinceAndCity().then(({ data }) => {
      pc.value = data
    })
    findAllProvinceAndCityAndArea().then(({ data }) => {
      pca.value = cloneDeep(data)
      pcaCascade.value = cloneDeep(data)
      initPcaCascade(pcaCascade.value)
    })
  })

  /**
   * 初始化级联
   */
  function initPcaCascade(pca: Region[]) {
    for (const pcaElement of pca) {
      if (pcaElement.children) {
        initPcaCascade(pcaElement.children)
      }
      pcaElement.isLeaf = false
    }
  }
  /**
   * 加载下级
   */
  function loadNextRegions(selectedOptions: DefaultOptionType[]) {
    const targetOption = selectedOptions[selectedOptions.length - 1]
    findAllRegionByParentCode(targetOption.code).then(({ data }) => {
      targetOption.loading = false
      // 如果下一级不是街道, 说明是不是子节点
      if (targetOption.level < 3) {
        for (const item of data) {
          item.isLeaf = false
        }
      }
      targetOption.children = [...data]
    })
  }
</script>

<style scoped></style>
