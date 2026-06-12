import type { BaseEntity, LabelValue, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/** 风险模型 API */
export const ModelTemplateApi = {
  /** 模型模板分页查询 */
  page(params: any): Promise<Result<PageResult<ModelTemplateResult>>> {
    return defHttp.get({ url: '/risk/model/template/page', params });
  },
  /** 根据ID查询模型模板 */
  findById(id: string): Promise<Result<ModelTemplateResult>> {
    return defHttp.get({ url: '/risk/model/template/find-by-id', params: { id } });
  },
  /** 根据模型ID查询模型模板 */
  findByModelId(modelId: string): Promise<Result<ModelTemplateResult>> {
    return defHttp.get({ url: '/risk/model/template/find-by-model-id', params: { modelId } });
  },
  /** 新增模型模板 */
  add(data: ModelTemplateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/model/template/add', data });
  },
  /** 更新模型模板 */
  update(data: ModelTemplateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/model/template/update', data });
  },
  /** 删除模型模板 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/model/template/delete', params: { id } });
  },
  /** 模型模板下拉列表 */
  dropdown(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/risk/model/template/dropdown' });
  },
};

/** 模型实例 API */
export const ModelInstanceApi = {
  /** 模型实例分页查询 */
  page(params: any): Promise<Result<PageResult<ModelInstanceResult>>> {
    return defHttp.get({ url: '/risk/model/instance/page', params });
  },
  /** 根据ID查询模型实例 */
  findById(id: string): Promise<Result<ModelInstanceResult>> {
    return defHttp.get({ url: '/risk/model/instance/find-by-id', params: { id } });
  },
  /** 根据实例ID查询模型实例 */
  findByInstanceId(instanceId: string): Promise<Result<ModelInstanceResult>> {
    return defHttp.get({ url: '/risk/model/instance/find-by-instance-id', params: { instanceId } });
  },
  /** 新增模型实例 */
  add(data: ModelInstanceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/model/instance/add', data });
  },
  /** 更新模型实例 */
  update(data: ModelInstanceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/model/instance/update', data });
  },
  /** 删除模型实例 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/model/instance/delete', params: { id } });
  },
  /** 更新实例配置参数 */
  updateConfigParams(data: ModelInstanceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/model/instance/update-config-params', data });
  },
};

/** 实例查表行 API */
export const InstanceLookupRowApi = {
  /** 查询实例查表行列表 */
  listByLookupTableId(lookupTableId: string, instanceId: string): Promise<Result<InstanceLookupRowResult[]>> {
    return defHttp.get({
      url: '/risk/instance/lookup/row/list-by-lookup-table-id',
      params: { lookupTableId, instanceId },
    });
  },
  /** 新增实例查表行 */
  add(data: InstanceLookupRowParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/instance/lookup/row/add', data });
  },
  /** 更新实例查表行 */
  update(data: InstanceLookupRowParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/instance/lookup/row/update', data });
  },
  /** 删除实例查表行 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/instance/lookup/row/delete', params: { id } });
  },
  /** 批量差量保存实例查表行 */
  saveRows(data: InstanceLookupRowBatchParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/instance/lookup/row/save-rows', data });
  },
};

/** 实例评分卡 API */
export const InstanceScorecardApi = {
  /** 查询 SCORECARD 规则节点 */
  listRuleNodes(modelId: string): Promise<Result<RuleNodeResult[]>> {
    return defHttp.get({ url: '/risk/instance/scorecard/list-rule-nodes', params: { modelId } });
  },
  /** 查询模板维度（只读） */
  listDimensions(ruleNodeId: string): Promise<Result<ScorecardDimensionResult[]>> {
    return defHttp.get({ url: '/risk/instance/scorecard/list-dimensions', params: { ruleNodeId } });
  },
  /** 查询实例评分卡条目表单（模板结构+覆盖值） */
  listEntryForm(dimensionId: string, instanceId: string): Promise<Result<InstanceScorecardEntryFormResult[]>> {
    return defHttp.get({ url: '/risk/instance/scorecard/list-entry-form', params: { dimensionId, instanceId } });
  },
  /** 查询实例评级标尺表单（模板结构+覆盖值） */
  listMappingForm(ruleNodeId: string, instanceId: string): Promise<Result<InstanceScorecardMappingFormResult[]>> {
    return defHttp.get({ url: '/risk/instance/scorecard/list-mapping-form', params: { ruleNodeId, instanceId } });
  },
  /** 查询实例评分卡条目 */
  listEntries(dimensionId: string, instanceId: string): Promise<Result<ScorecardEntryResult[]>> {
    return defHttp.get({ url: '/risk/instance/scorecard/list-entries', params: { dimensionId, instanceId } });
  },
  /** 批量保存实例评分卡条目 */
  saveEntries(data: InstanceScorecardParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/instance/scorecard/save-entries', data });
  },
  /** 删除实例评分卡条目 */
  deleteEntry(id: string, instanceId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/instance/scorecard/delete-entry', params: { id, instanceId } });
  },
  /** 查询实例评级标尺 */
  listMappings(ruleNodeId: string, instanceId: string): Promise<Result<ScorecardMappingResult[]>> {
    return defHttp.get({ url: '/risk/instance/scorecard/list-mappings', params: { ruleNodeId, instanceId } });
  },
  /** 批量保存实例评级标尺 */
  saveMappings(data: InstanceScorecardParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/instance/scorecard/save-mappings', data });
  },
  /** 删除实例评级标尺条目 */
  deleteMapping(id: string, instanceId: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/instance/scorecard/delete-mapping', params: { id, instanceId } });
  },
};

/** 输入参数集 API */
export const InputParamSetApi = {
  /** 输入参数集分页查询 */
  page(params: any): Promise<Result<PageResult<InputParamSetResult>>> {
    return defHttp.get({ url: '/risk/input-param/set/page', params });
  },
  /** 查询所有输入参数集 */
  list(): Promise<Result<InputParamSetResult[]>> {
    return defHttp.get({ url: '/risk/input-param/set/list' });
  },
  /** 新增输入参数集 */
  add(data: InputParamSetParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/input-param/set/add', data });
  },
  /** 更新输入参数集 */
  update(data: InputParamSetParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/input-param/set/update', data });
  },
  /** 删除输入参数集 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/input-param/set/delete', params: { id } });
  },
  /** 输入参数集下拉列表 */
  dropdown(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/risk/input-param/set/dropdown' });
  },
  /** 根据ID查询输入参数集 */
  findById(id: string): Promise<Result<InputParamSetResult>> {
    return defHttp.get({ url: '/risk/input-param/set/find-by-id', params: { id } });
  },
};

/** 输入参数定义 API */
export const InputParamDefApi = {
  /** 查询所有输入参数定义 */
  list(): Promise<Result<InputParamDefResult[]>> {
    return defHttp.get({ url: '/risk/input-param/def/list' });
  },
  /** 根据ID查询输入参数定义 */
  findById(id: string): Promise<Result<InputParamDefResult>> {
    return defHttp.get({ url: '/risk/input-param/def/find-by-id', params: { id } });
  },
  /** 根据参数集ID查询输入参数定义 */
  listBySetId(setId: string): Promise<Result<InputParamDefResult[]>> {
    return defHttp.get({ url: '/risk/input-param/def/list-by-set-id', params: { setId } });
  },
  /** 新增输入参数定义 */
  add(data: InputParamDefParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/input-param/def/add', data });
  },
  /** 更新输入参数定义 */
  update(data: InputParamDefParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/input-param/def/update', data });
  },
  /** 删除输入参数定义 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/input-param/def/delete', params: { id } });
  },
  /** 输入参数定义下拉列表 */
  dropdown(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/risk/input-param/def/dropdown' });
  },
  /** 判断编码是否已存在 */
  existsByCode(code: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/risk/input-param/def/exists-by-code', params: { code } });
  },
  /** 判断编码是否已存在(排除指定ID) */
  existsByCodeNotId(code: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/risk/input-param/def/exists-by-code-not-id', params: { code, id } });
  },
};

/** 模型数据源 API */
export const ModelDataSourceApi = {
  /** 根据模型ID查询数据源列表 */
  listByModelId(modelId: string): Promise<Result<ModelDataSourceResult[]>> {
    return defHttp.get({ url: '/risk/model/data-source/list-by-model-id', params: { modelId } });
  },
  /** 新增模型数据源 */
  add(data: ModelDataSourceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/model/data-source/add', data });
  },
  /** 更新模型数据源 */
  update(data: ModelDataSourceParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/model/data-source/update', data });
  },
  /** 删除模型数据源 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/model/data-source/delete', params: { id } });
  },
  /** 根据ID查询模型数据源 */
  findById(id: string): Promise<Result<ModelDataSourceResult>> {
    return defHttp.get({ url: '/risk/model/data-source/find-by-id', params: { id } });
  },
  /** 判断同模型下数据源编码是否已存在 */
  existsByDataSourceCode(modelId: string, dataSourceCode: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/risk/model/data-source/exists-by-data-source-code', params: { modelId, dataSourceCode } });
  },
  /** 判断同模型下数据源编码是否已存在(排除指定ID) */
  existsByDataSourceCodeNotId(modelId: string, dataSourceCode: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/risk/model/data-source/exists-by-data-source-code-not-id', params: { modelId, dataSourceCode, id } });
  },
};

/** 数据源定义 API */
export const DataSourceDefApi = {
  /** 数据源定义分页查询 */
  page(params: any): Promise<Result<PageResult<DataSourceDefResult>>> {
    return defHttp.get({ url: '/risk/data-source/def/page', params });
  },
  /** 查询所有数据源定义 */
  list(): Promise<Result<DataSourceDefResult[]>> {
    return defHttp.get({ url: '/risk/data-source/def/list' });
  },
  /** 扫描同步数据源定义 */
  scan(): Promise<Result<DataSourceDefSyncResult>> {
    return defHttp.post({ url: '/risk/data-source/def/scan' });
  },
  /** 数据源定义下拉列表 */
  dropdown(): Promise<Result<LabelValue[]>> {
    return defHttp.get({ url: '/risk/data-source/def/dropdown' });
  },
};

/** 配置参数 API */
export const ConfigParamApi = {
  /** 根据模型ID查询配置参数列表 */
  listByModelId(modelId: string): Promise<Result<ConfigParamResult[]>> {
    return defHttp.get({ url: '/risk/config/param/list-by-model-id', params: { modelId } });
  },
  /** 新增配置参数 */
  add(data: ConfigParamParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/config/param/add', data });
  },
  /** 更新配置参数 */
  update(data: ConfigParamParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/config/param/update', data });
  },
  /** 删除配置参数 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/config/param/delete', params: { id } });
  },
  /** 根据ID查询配置参数 */
  findById(id: string): Promise<Result<ConfigParamResult>> {
    return defHttp.get({ url: '/risk/config/param/find-by-id', params: { id } });
  },
  /** 判断同模型下参数编码是否已存在 */
  existsByParamCode(modelId: string, paramCode: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/risk/config/param/exists-by-param-code', params: { modelId, paramCode } });
  },
  /** 判断同模型下参数编码是否已存在(排除指定ID) */
  existsByParamCodeNotId(modelId: string, paramCode: string, id: string): Promise<Result<boolean>> {
    return defHttp.get({ url: '/risk/config/param/exists-by-param-code-not-id', params: { modelId, paramCode, id } });
  },
};

/** 查表定义 API */
export const LookupTableApi = {
  /** 根据模型ID查询查表定义列表 */
  listByModelId(modelId: string): Promise<Result<LookupTableResult[]>> {
    return defHttp.get({ url: '/risk/lookup/table/list-by-model-id', params: { modelId } });
  },
  /** 根据ID查询查表定义 */
  findById(id: string): Promise<Result<LookupTableResult>> {
    return defHttp.get({ url: '/risk/lookup/table/find-by-id', params: { id } });
  },
  /** 新增查表定义 */
  add(data: LookupTableParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/lookup/table/add', data });
  },
  /** 更新查表定义 */
  update(data: LookupTableParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/lookup/table/update', data });
  },
  /** 删除查表定义 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/lookup/table/delete', params: { id } });
  },
};

/** 策略节点 API */
export const StrategyNodeApi = {
  /** 根据模型ID查询策略节点列表 */
  listByModelId(modelId: string): Promise<Result<StrategyNodeResult[]>> {
    return defHttp.get({ url: '/risk/strategy-node/list-by-model-id', params: { modelId } });
  },
  /** 根据ID查询策略节点 */
  findById(id: string): Promise<Result<StrategyNodeResult>> {
    return defHttp.get({ url: '/risk/strategy-node/find-by-id', params: { id } });
  },
  /** 新增策略节点 */
  add(data: StrategyNodeParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/strategy-node/add', data });
  },
  /** 更新策略节点 */
  update(data: StrategyNodeParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/strategy-node/update', data });
  },
  /** 删除策略节点 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/strategy-node/delete', params: { id } });
  },
};

/** 规则节点 API */
export const RuleNodeApi = {
  /** 根据策略节点ID查询规则节点列表 */
  listByStrategyNodeId(strategyNodeId: string): Promise<Result<RuleNodeResult[]>> {
    return defHttp.get({ url: '/risk/rule-node/list-by-strategy-node-id', params: { strategyNodeId } });
  },
  /** 根据ID查询规则节点 */
  findById(id: string): Promise<Result<RuleNodeResult>> {
    return defHttp.get({ url: '/risk/rule-node/find-by-id', params: { id } });
  },
  /** 新增规则节点 */
  add(data: RuleNodeParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/rule-node/add', data });
  },
  /** 更新规则节点 */
  update(data: RuleNodeParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/rule-node/update', data });
  },
  /** 删除规则节点 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/rule-node/delete', params: { id } });
  },
};

/** 规则条目 API */
export const RuleEntryApi = {
  /** 根据规则节点ID查询规则条目列表 */
  listByRuleNodeId(ruleNodeId: string): Promise<Result<RuleEntryResult[]>> {
    return defHttp.get({ url: '/risk/rule-entry/list-by-rule-node-id', params: { ruleNodeId } });
  },
  /** 根据ID查询规则条目 */
  findById(id: string): Promise<Result<RuleEntryResult>> {
    return defHttp.get({ url: '/risk/rule-entry/find-by-id', params: { id } });
  },
  /** 新增规则条目 */
  add(data: RuleEntryParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/rule-entry/add', data });
  },
  /** 更新规则条目 */
  update(data: RuleEntryParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/rule-entry/update', data });
  },
  /** 删除规则条目 */
  delete(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/rule-entry/delete', params: { id } });
  },
};

/** 评分卡 API */
export const ScorecardApi = {
  /** 根据规则节点ID查询评分卡维度列表 */
  listDimensionsByRuleNodeId(ruleNodeId: string): Promise<Result<ScorecardDimensionResult[]>> {
    return defHttp.get({ url: '/risk/scorecard/list-by-rule-node-id', params: { ruleNodeId } });
  },
  /** 根据规则节点ID查询评级标尺列表 */
  listMappingsByRuleNodeId(ruleNodeId: string): Promise<Result<ScorecardMappingResult[]>> {
    return defHttp.get({ url: '/risk/scorecard/list-mappings-by-rule-node-id', params: { ruleNodeId } });
  },
  /** 新增评分卡维度 */
  addDimension(data: ScorecardDimensionParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/scorecard/add-dimension', data });
  },
  /** 更新评分卡维度 */
  updateDimension(data: ScorecardDimensionParam): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/scorecard/update-dimension', data });
  },
  /** 删除评分卡维度 */
  deleteDimension(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/scorecard/delete-dimension', params: { id } });
  },
  /** 新增评级标尺条目 */
  addMapping(data: ScorecardMappingItem): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/scorecard/add-mapping', data });
  },
  /** 更新评级标尺条目 */
  updateMapping(data: ScorecardMappingItem): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/scorecard/update-mapping', data });
  },
  /** 删除评级标尺条目 */
  deleteMapping(id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/risk/scorecard/delete-mapping', params: { id } });
  },
};

export interface ModelTemplateResult extends BaseEntity {
  modelId?: string;
  modelName?: string;
  description?: string;
  status?: string;
  inputParamSetCode?: string;
}

export interface ModelTemplateParam {
  id?: string;
  modelId?: string;
  modelName?: string;
  description?: string;
  status?: string;
  inputParamSetCode?: string;
}

export interface ModelInstanceResult extends BaseEntity {
  instanceId?: string;
  modelId?: string;
  providerId?: string;
  instanceName?: string;
  configParams?: string;
  status?: string;
}

export interface ModelInstanceParam {
  id?: string;
  instanceId?: string;
  modelId?: string;
  providerId?: string;
  instanceName?: string;
  configParams?: string;
  status?: string;
}

export interface InputParamSetResult extends BaseEntity {
  code?: string;
  name?: string;
  description?: string;
}

export interface InputParamSetParam {
  id?: string;
  name?: string;
  description?: string;
}

export interface InputParamDefResult extends BaseEntity {
  setId?: string;
  code?: string;
  name?: string;
  description?: string;
  paramType?: string;
}

export interface InputParamDefParam {
  id?: string;
  setId?: string;
  code?: string;
  name?: string;
  description?: string;
  paramType?: string;
}

export interface ModelDataSourceResult extends BaseEntity {
  modelId?: string;
  dataSourceCode?: string;
  dataSourceName?: string;
  loadType?: string;
  sortNo?: number;
}

export interface ModelDataSourceParam {
  id?: string;
  modelId?: string;
  dataSourceCode?: string;
  dataSourceName?: string;
  loadType?: string;
  sortNo?: number;
}

export interface DataSourceDefResult extends BaseEntity {
  code?: string;
  name?: string;
  className?: string;
  remark?: string;
}

export interface DataSourceDefSyncResult {
  added?: number;
  updated?: number;
}

export interface ConfigParamResult extends BaseEntity {
  modelId?: string;
  paramCode?: string;
  paramName?: string;
  paramType?: string;
  defaultValue?: string;
  sortNo?: number;
}

export interface ConfigParamParam {
  id?: string;
  modelId?: string;
  paramCode?: string;
  paramName?: string;
  paramType?: string;
  defaultValue?: string;
  sortNo?: number;
}

export interface LookupTableKeyDefItem {
  id?: string;
  code?: string;
  name?: string;
  expression?: string;
}

export interface LookupTableRowItem {
  id?: string;
  keys?: Record<string, any>;
  value?: string;
}

export interface LookupTableResult extends BaseEntity {
  modelId?: string;
  code?: string;
  name?: string;
  keyDefs?: LookupTableKeyDefItem[];
  rows?: LookupTableRowItem[];
}

export interface LookupTableParam {
  id?: string;
  modelId?: string;
  name?: string;
  keyDefs?: LookupTableKeyDefItem[];
  rows?: LookupTableRowItem[];
}

export interface RiskInputParamSetQuery {
  code?: string;
  name?: string;
}

/** 策略节点结果 */
export interface StrategyNodeResult extends BaseEntity {
  modelId?: string;
  nodeId?: string;
  nodeName?: string;
  sortNo?: number;
  decisionMode?: string;
  precondition?: string;
}

/** 策略节点参数 */
export interface StrategyNodeParam {
  id?: string;
  modelId?: string;
  nodeId?: string;
  nodeName?: string;
  sortNo?: number;
  decisionMode?: string;
  precondition?: string;
}

/** 规则节点结果 */
export interface RuleNodeResult extends BaseEntity {
  strategyNodeId?: string;
  nodeId?: string;
  nodeName?: string;
  sortNo?: number;
  type?: string;
  outputVariable?: string;
  entryAggregation?: string;
  lookupTableId?: string;
}

/** 规则节点参数 */
export interface RuleNodeParam {
  id?: string;
  strategyNodeId?: string;
  nodeId?: string;
  nodeName?: string;
  sortNo?: number;
  type?: string;
  outputVariable?: string;
  entryAggregation?: string;
  lookupTableId?: string;
}

/** 规则条目结果 */
export interface RuleEntryResult extends BaseEntity {
  ruleNodeId?: string;
  seq?: number;
  conditionExpr?: string;
  resultValue?: string;
  isExpression?: boolean;
  outputVariable?: string;
}

/** 规则条目参数 */
export interface RuleEntryParam {
  id?: string;
  ruleNodeId?: string;
  seq?: number;
  conditionExpr?: string;
  resultValue?: string;
  isExpression?: boolean;
  outputVariable?: string;
}

/** 评分卡维度结果 */
export interface ScorecardDimensionResult extends BaseEntity {
  ruleNodeId?: string;
  name?: string;
  sortNo?: number;
  entries?: ScorecardEntryResult[];
}

/** 评分卡条目结果 */
export interface ScorecardEntryResult extends BaseEntity {
  dimensionId?: string;
  seq?: number;
  conditionExpr?: string;
  score?: string;
  isExpression?: boolean;
}

/** 评分卡标尺条目结果 */
export interface ScorecardMappingResult extends BaseEntity {
  ruleNodeId?: string;
  minScoreExpr?: string;
  isExpression?: boolean;
  grade?: string;
  decision?: string;
  isDefault?: boolean;
  sortNo?: number;
}

/** 评分卡条目参数 */
export interface ScorecardEntryItem {
  id?: string;
  dimensionId?: string;
  seq?: number;
  conditionExpr?: string;
  score?: string;
  isExpression?: boolean;
}

/** 评分卡标尺条目参数 */
export interface ScorecardMappingItem {
  id?: string;
  ruleNodeId?: string;
  minScoreExpr?: string;
  isExpression?: boolean;
  grade?: string;
  decision?: string;
  isDefault?: boolean;
  sortNo?: number;
}

/** 评分卡维度参数 */
export interface ScorecardDimensionParam {
  id?: string;
  ruleNodeId?: string;
  name?: string;
  sortNo?: number;
  entries?: ScorecardEntryItem[];
}

/** 实例查表行结果 */
export interface InstanceLookupRowResult extends BaseEntity {
  lookupTableId?: string;
  instanceId?: string;
  keys?: string;
  value?: string;
}

/** 实例查表行参数 */
export interface InstanceLookupRowParam {
  id?: string;
  lookupTableId?: string;
  instanceId?: string;
  keys?: string;
  value?: string;
}

/** 实例查表行批量保存参数 */
export interface InstanceLookupRowBatchParam {
  lookupTableId?: string;
  instanceId?: string;
  rows?: LookupTableRowItem[];
}

/** 实例评分卡参数 */
export interface InstanceScorecardParam {
  instanceId?: string;
  dimensionId?: string;
  ruleNodeId?: string;
  entries?: ScorecardEntryItem[];
  mappings?: ScorecardMappingItem[];
}

/** 实例评分卡条目表单行 */
export interface InstanceScorecardEntryFormResult {
  templateEntryId?: string;
  dimensionId?: string;
  seq?: number;
  templateConditionExpr?: string;
  templateScore?: string;
  templateIsExpression?: boolean;
  conditionExpr?: string;
  score?: string;
  isExpression?: boolean;
  instanceEntryId?: string;
  overridden?: boolean;
}

/** 实例评级标尺表单行 */
export interface InstanceScorecardMappingFormResult {
  templateMappingId?: string;
  ruleNodeId?: string;
  sortNo?: number;
  templateMinScoreExpr?: string;
  templateIsExpression?: boolean;
  templateGrade?: string;
  templateDecision?: string;
  templateIsDefault?: boolean;
  minScoreExpr?: string;
  isExpression?: boolean;
  grade?: string;
  decision?: string;
  isDefault?: boolean;
  instanceMappingId?: string;
  overridden?: boolean;
}
