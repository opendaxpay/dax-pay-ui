import type { PageResult, TablePageModel } from '#/types/web';

import { reactive, ref } from 'vue';

/**
 * 获取数据对象
 */
export default function useTablePage<T = any>(queryPageCallback: () => Promise<void> | void) {
  /** 数据内容 */
  const model = reactive({
    pages: {
      size: 15,
      current: 1,
    },
    queryParam: {},
    pagination: {},
  } as TablePageModel<T>);

  /** 加载状态 */
  const loading = ref(false);
  /** 批量操作标识 */
  const batchOperateFlag = ref(false);
  /** 排序条件 */
  const sortParam = reactive({
    sortField: null as null | string,
    asc: false,
  });

  /** 不可以被重新赋值, 否则会失去绑定 */
  const { pages, pagination } = model;

  /**
   * 执行查询并管理 loading 状态
   */
  async function executeQuery() {
    loading.value = true;
    try {
      await queryPageCallback();
    } finally {
      // 注意：如果 queryPageCallback 内部调用了 pageQueryResHandle，loading 会被设为 false
      // 这里作为兜底，防止遗漏
    }
  }

  /**
   * 普通查询
   */
  function query() {
    batchOperateFlag.value = false;
    resetPage();
    executeQuery();
  }

  /**
   * 表格翻页或变动 (适配 vxe-table)
   */
  function handleTableChange({ currentPage, pageSize }: { currentPage: number; pageSize: number }) {
    batchOperateFlag.value = false;
    pages.current = currentPage;
    pages.size = pageSize;
    executeQuery();
  }

  /**
   * 排序条件变动 (适配 vxe-table)
   */
  function sortChange({ order, property }: { order: null | string; property: string }) {
    sortParam.sortField = order ? property : null;
    sortParam.asc = order === 'asc';
    executeQuery();
  }

  /**
   * 重置当前页数
   */
  function resetPage() {
    pages.current = 1;
  }

  /**
   * 分页查询返回结果处理
   */
  function pageQueryResHandle(res: PageResult<T>) {
    pagination.current = Number(res.current);
    pagination.size = Number(res.size);
    pagination.total = Number(res.total);
    (pagination as any).records = res.records;
    loading.value = false;
  }

  /**
   * 重置查询
   */
  function resetQuery() {
    resetQueryParams();
    resetPage();
    executeQuery();
  }

  /**
   * 重置查询参数
   */
  function resetQueryParams() {
    model.queryParam = {};
  }

  /**
   * ok按钮
   */
  function handleOk() {
    executeQuery();
  }

  return {
    model,
    loading,
    pages,
    pagination,
    batchOperateFlag,
    sortParam,
    query,
    sortChange,
    resetPage,
    pageQueryResHandle,
    handleTableChange,
    resetQuery,
    resetQueryParams,
    handleOk,
  };
}
