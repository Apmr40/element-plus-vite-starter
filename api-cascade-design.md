# API 级联查询设计方案

## 📋 业务需求

- Spring Boot HTTP 分页查询接口
- 接口之间存在级联关系（A 接口出参 → B 接口入参）
- 接口配置存储在数据库表中

---

## 🗄️ 表结构映射

### 1. 接口基本信息 (`iop_mc_api_info`)

| 字段 | 说明 | 示例 |
|------|------|------|
| apiid | 接口唯一标识 | `API001` |
| apiname | 接口名称 | `用户列表查询` |
| apiurl | 接口 URL | `/api/v1/users` |
| apitype | 接口类型 | `G`/`P` (GET/POST) |

### 2. 接口参数定义 (`iop_mc_api_parm_rln`)

| 字段 | 说明 | 示例 |
|------|------|------|
| apiid | 关联接口 ID | `API001` |
| parmrlntype | 参数类型 | `0`=入参，`1`=出参 |
| orderindex | 参数顺序 | `01`, `02` |
| parmname | 内部参数名 | `str_zhmc_username` |
| parmalisname | 接口属性名 | `username` |

---

## 🔗 级联关系设计

### 新增表：接口级联关系表

```sql
CREATE TABLE iop_mc_api_cascade_rln (
    cascadeid CHARACTER VARYING(17) NOT NULL,
    sourceapiid CHARACTER VARYING(17) NOT NULL,      -- 源接口 ID（出参提供方）
    targetapiid CHARACTER VARYING(17) NOT NULL,      -- 目标接口 ID（入参接收方）
    sourceparmname CHARACTER VARYING(200),           -- 源接口出参 parmname
    targetparmname CHARACTER VARYING(200),           -- 目标接口入参 parmname
    orderindex CHARACTER VARYING(2),                 -- 级联顺序
    description CHARACTER VARYING(500),
    res1 CHARACTER VARYING(100),
    res2 CHARACTER VARYING(100),
    res3 CHARACTER VARYING(100),
    res4 CHARACTER VARYING(100),
    res5 CHARACTER VARYING(100)
);

ALTER TABLE iop_mc_api_cascade_rln 
ADD CONSTRAINT iop_mc_api_cascade_rln_pk 
PRIMARY KEY (cascadeid);
```

---

## 🏗️ Spring Boot 实现方案

### 1. 实体类设计

```java
// API 基本信息实体
@Data
@TableName("iop_mc_api_info")
public class ApiInfo {
    private String apiid;
    private String apiname;
    private String apiurl;
    private String apitype;
    private String description;
}

// API 参数实体
@Data
@TableName("iop_mc_api_parm_rln")
public class ApiParmRln {
    private String apiid;
    private String parmrlntype;  // 0=入参，1=出参
    private String orderindex;
    private String parmname;
    private String parmalisname;
}

// API 级联关系实体
@Data
@TableName("iop_mc_api_cascade_rln")
public class ApiCascadeRln {
    private String cascadeid;
    private String sourceapiid;
    private String targetapiid;
    private String sourceparmname;
    private String targetparmname;
    private String orderindex;
}
```

### 2. 核心服务类

```java
@Service
public class ApiCascadeService {
    
    @Autowired
    private ApiInfoMapper apiInfoMapper;
    
    @Autowired
    private ApiParmRlnMapper apiParmRlnMapper;
    
    @Autowired
    private ApiCascadeRlnMapper cascadeRlnMapper;
    
    @Autowired
    private RestTemplate restTemplate;
    
    /**
     * 执行级联查询
     * @param rootApiId 根接口 ID
     * @param rootParams 根接口入参
     * @return 级联查询结果
     */
    public Map<String, Object> executeCascadeQuery(String rootApiId, Map<String, Object> rootParams) {
        Map<String, Object> context = new HashMap<>();
        context.putAll(rootParams);
        
        // 1. 获取级联链路
        List<ApiCascadeRln> cascadeChain = cascadeRlnMapper.selectBySourceApiId(rootApiId);
        
        // 2. 执行根接口
        ApiInfo rootApi = apiInfoMapper.selectById(rootApiId);
        Object rootResult = executeSingleApi(rootApi, rootParams);
        context.put("root_result", rootResult);
        
        // 3. 沿级联链路执行
        for (ApiCascadeRln cascade : cascadeChain) {
            ApiInfo targetApi = apiInfoMapper.selectById(cascade.getTargetapiid());
            
            // 从上下文获取参数
            Map<String, Object> targetParams = buildTargetParams(
                context, 
                cascade.getSourceparmname(), 
                cascade.getTargetparmname()
            );
            
            Object targetResult = executeSingleApi(targetApi, targetParams);
            context.put(cascade.getTargetapiid(), targetResult);
        }
        
        return context;
    }
    
    /**
     * 执行单个 API 调用
     */
    private Object executeSingleApi(ApiInfo api, Map<String, Object> params) {
        String url = api.getApiurl();
        String method = api.getApitype();
        
        // 获取入参定义
        List<ApiParmRln> inputParams = apiParmRlnMapper.selectInputParams(api.getApiid());
        
        // 构建请求
        if ("G".equals(method)) {
            return restTemplate.getForObject(buildUrlWithParams(url, params), Object.class);
        } else {
            return restTemplate.postForObject(url, params, Object.class);
        }
    }
    
    /**
     * 根据级联关系构建目标接口参数
     */
    private Map<String, Object> buildTargetParams(
        Map<String, Object> context,
        String sourceParmName,
        String targetParmName
    ) {
        Map<String, Object> targetParams = new HashMap<>();
        
        // 从上下文提取源数据
        Object sourceValue = extractValueFromContext(context, sourceParmName);
        
        // 映射到目标参数
        if (sourceValue != null) {
            targetParams.put(targetParmName, sourceValue);
        }
        
        return targetParams;
    }
}
```

### 3. 参数名转换工具

```java
@Component
public class ParmNameConverter {
    
    /**
     * 根据规则生成内部参数名
     * 规则：str_平台名_parmalisname(转小写)
     */
    public String buildInternalParmName(String platformName, String parmAliasName) {
        return String.format("str_%s_%s", 
            platformName, 
            parmAliasName.toLowerCase());
    }
    
    /**
     * 从内部参数名解析平台和属性名
     */
    public ParmNameInfo parseInternalParmName(String internalParmName) {
        if (internalParmName.startsWith("str_")) {
            String[] parts = internalParmName.substring(4).split("_", 2);
            if (parts.length == 2) {
                return new ParmNameInfo(parts[0], parts[1]);
            }
        }
        return null;
    }
    
    @Data
    public static class ParmNameInfo {
        private String platformName;
        private String parmAliasName;
        
        public ParmNameInfo(String platformName, String parmAliasName) {
            this.platformName = platformName;
            this.parmAliasName = parmAliasName;
        }
    }
}
```

### 4. 分页查询控制器

```java
@RestController
@RequestMapping("/api/cascade")
public class ApiCascadeController {
    
    @Autowired
    private ApiCascadeService cascadeService;
    
    @PostMapping("/query")
    public ResponseEntity<?> cascadeQuery(
        @RequestParam String apiId,
        @RequestBody Map<String, Object> params,
        @RequestParam(defaultValue = "1") Integer pageNum,
        @RequestParam(defaultValue = "10") Integer pageSize
    ) {
        // 添加分页参数
        params.put("pageNum", pageNum);
        params.put("pageSize", pageSize);
        
        try {
            Map<String, Object> result = cascadeService.executeCascadeQuery(apiId, params);
            return ResponseEntity.ok(Result.success(result));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Result.error("级联查询失败：" + e.getMessage()));
        }
    }
}
```

---

## 📊 数据配置示例

### 场景：平台 → 资源 → 资源字段 级联查询

```sql
-- 1. 配置接口
INSERT INTO iop_mc_api_info VALUES 
('API001', '平台列表查询', '/api/platforms', 'G', ''),
('API002', '资源列表查询', '/api/resources', 'G', ''),
('API003', '资源字段查询', '/api/resource/fields', 'G', '');

-- 2. 配置接口参数
-- API001 出参
INSERT INTO iop_mc_api_parm_rln VALUES 
('API001', '1', '01', 'str_platform_platformid', 'platformid'),
('API001', '1', '02', 'str_platform_platformname', 'platformname');

-- API002 入参
INSERT INTO iop_mc_api_parm_rln VALUES 
('API002', '0', '01', 'str_platform_platformid', 'platformId'),
('API002', '1', '01', 'str_resource_resourceid', 'resourceid');

-- API003 入参
INSERT INTO iop_mc_api_parm_rln VALUES 
('API003', '0', '01', 'str_resource_resourceid', 'resourceId');

-- 3. 配置级联关系
INSERT INTO iop_mc_api_cascade_rln VALUES 
('CASC001', 'API001', 'API002', 'str_platform_platformid', 'str_platform_platformid', '01', ''),
('CASC002', 'API002', 'API003', 'str_resource_resourceid', 'str_resource_resourceid', '02', '');
```

---

## 🔄 执行流程

```
用户请求 (apiId=API001)
       ↓
┌─────────────────┐
│  执行 API001    │ → 返回 platformid
└────────┬────────┘
         │
         ↓ (级联映射)
┌─────────────────┐
│  执行 API002    │ → 返回 resourceid
│  (入参：platformId) │
└────────┬────────┘
         │
         ↓ (级联映射)
┌─────────────────┐
│  执行 API003    │ → 返回字段列表
│  (入参：resourceId) │
└─────────────────┘
```

---

## ✅ 可行性结论

| 需求 | 是否支持 | 说明 |
|------|---------|------|
| 接口 URL 配置化 | ✅ | `iop_mc_api_info.apiurl` |
| 入参/出参定义 | ✅ | `iop_mc_api_parm_rln` + `parmrlntype` |
| 参数名映射规则 | ✅ | `parmname` / `parmalisname` |
| 级联关系 | ⚠️ | 需新增 `iop_mc_api_cascade_rln` 表 |
| 分页支持 | ✅ | 统一添加 `pageNum`/`pageSize` 参数 |

**需要补充的表：** 接口级联关系表（见上方 DDL）

---

## 📝 后续建议

1. **增加接口执行顺序字段** - 支持更复杂的级联编排
2. **增加参数转换规则** - 支持数据类型转换、格式转换
3. **增加缓存机制** - 避免重复调用相同接口
4. **增加错误处理** - 级联失败时的回滚或补偿机制
5. **增加执行日志** - 记录每次级联查询的执行轨迹
