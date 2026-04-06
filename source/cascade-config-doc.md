# 🔗 级联资源配置页面 - 开发文档

## 📋 概述

本文档描述了级联资源配置页面的功能设计、技术实现和使用方法。该页面用于维护多层级资源的级联关系配置，生成对应的数据库 INSERT 语句。

### 功能特性

- ✅ 支持多层级资源配置（数据中心 → 应用系统 → 实例）
- ✅ 自动生成 17 位资源 ID（平台名 + 随机字符）
- ✅ 字段拖拽排序、主键配置、隐藏控制
- ✅ 支持输入报文解析（生成入参配置）
- ✅ 一键生成 5 张表的完整 SQL 脚本

---

## 🗄️ 数据表结构

系统涉及 5 张核心表，用于维护平台、资源、API 和字段的级联关系。

### 1. iop_mc_serv_pltf_reso_rln（平台与资源关联关系）

```sql
CREATE TABLE iop_mc_serv_pltf_reso_rln (
  platformtype VARCHAR(2) NOT NULL,      -- 平台编码（如 ZH）
  resourcelevel VARCHAR(2) NOT NULL,     -- 级联层级（01, 02, 03）
  platformname VARCHAR(200),             -- 平台名称（如 中化）
  resourceid VARCHAR(17),                -- 资源 ID（17 位）
  resourcename VARCHAR(200),             -- 资源名称
  description VARCHAR(500),
  res1-5 VARCHAR(100)                    -- 预留字段
);
ALTER TABLE iop_mc_serv_pltf_reso_rln 
ADD PRIMARY KEY (platformtype, resourcelevel);
```

### 2. iop_mc_serv_reso_info（资源基本信息）

```sql
CREATE TABLE iop_mc_serv_reso_info (
  resourceid VARCHAR(17) NOT NULL,       -- 资源 ID（主键）
  resourcename VARCHAR(400),             -- 资源名称
  description VARCHAR(500),
  resourceapiid VARCHAR(17),             -- 关联的 API ID
  res1-5 VARCHAR(100)
);
ALTER TABLE iop_mc_serv_reso_info 
ADD PRIMARY KEY (resourceid);
```

### 3. iop_mc_api_info（API 基本信息）

```sql
CREATE TABLE iop_mc_api_info (
  apiid VARCHAR(17) NOT NULL,            -- API ID（主键）
  apiname VARCHAR(800),                  -- API 名称
  apiurl VARCHAR(2000),                  -- API 地址
  apitype VARCHAR(1),                    -- API 类型（G=GET）
  description VARCHAR(2000),
  res1-5 VARCHAR(100)
);
ALTER TABLE iop_mc_api_info 
ADD PRIMARY KEY (apiid);
```

### 4. iop_mc_reso_fld_info（资源字段详细信息）

```sql
CREATE TABLE iop_mc_reso_fld_info (
  resourceid VARCHAR(17) NOT NULL,       -- 资源 ID
  fieldname VARCHAR(200) NOT NULL,       -- 字段名（如 str_zhmc_id）
  resourcename VARCHAR(200),             -- 资源名称
  description VARCHAR(500),              -- 字段中文名
  orderindex VARCHAR(2),                 -- 序号
  hideflag VARCHAR(1),                   -- 隐藏标志（0/1）
  pkflag VARCHAR(1),                     -- 主键标志（0/1）
  pkdisplayflag VARCHAR(1),              -- 主键展示标志（0/1）
  res1-5 VARCHAR(100)
);
ALTER TABLE iop_mc_reso_fld_info 
ADD PRIMARY KEY (resourceid, fieldname);
```

### 5. iop_mc_api_parm_rln（API 参数关联关系）

```sql
CREATE TABLE iop_mc_api_parm_rln (
  apiid VARCHAR(17) NOT NULL,            -- API ID
  parmrlntype VARCHAR(1) NOT NULL,       -- 参数类型（0=入参，1=出参）
  orderindex VARCHAR(2) NOT NULL,        -- 序号
  parmname VARCHAR(200),                 -- 参数名（如 str_zhmc_id）
  parmalisname VARCHAR(200),             -- 参数别名（如 id）
  res1-5 VARCHAR(100)
);
ALTER TABLE iop_mc_api_parm_rln 
ADD PRIMARY KEY (apiid, parmrlntype, orderindex);
```

---

## 🎨 页面设计

### 页面布局

```
┌─────────────────────────────────────────────────────────────┐
│  🔗 级联资源配置           [支持多层级资源配置]              │
├─────────────────────────────────────────────────────────────┤
│  平台编码  平台英文缩写  平台名称                           │
│  [ZH]     [zhmc]      [中化]           [➕ 添加层级]        │
├─────────────────────────────────────────────────────────────┤
│  📊 级联层级列表                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │层级│资源名称  │API URL       │字段数│操作         │     │
│  │ 01 │数据中心  │/api/dc/list  │  5   │⬆️⬇️🗑️      │     │
│  │ 02 │应用系统  │/api/app/list │  8   │⬆️⬇️🗑️      │     │
│  └────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  📝 字段配置 - 层级 01 (数据中心)           [📋 解析 API 字段]│
│  ┌────────────────────────────────────────────────────┐     │
│  │📍│序号│字段名│中文名│隐藏│主键│展示│                │     │
│  └────────────────────────────────────────────────────┘     │
│  📥 输入报文示例（生成入参）                                  │
│  📤 输出报文示例                                             │
├─────────────────────────────────────────────────────────────┤
│  [✨ 生成完整 SQL]  [🔄 重置]                                │
└─────────────────────────────────────────────────────────────┘
```

### 核心交互流程

1. 填写平台编码（ZH）、平台英文缩写（zhmc）、平台名称（中化）
2. 点击「➕ 添加层级」创建新层级
3. 填写资源名称、API URL
4. 粘贴输出报文示例，点击「📋 解析 API 字段」
5. 配置字段属性（中文名、隐藏、主键、展示）
6. （可选）粘贴输入报文示例生成入参配置
7. 点击「✨ 生成完整 SQL」导出脚本

---

## 💻 技术实现

### 数据结构

```typescript
// 字段配置接口
interface FieldConfig {
  fieldName: string        // 字段名（如 id）
  description: string      // 中文名
  orderIndex: number       // 序号
  hideFlag: number         // 隐藏标志 0/1
  pkFlag: number           // 主键标志 0/1
  pkDisplayFlag: number    // 展示标志 0/1
}

// 层级配置接口
interface CascadeLevel {
  resourceLevel: string    // '01', '02', '03'
  resourceName: string     // '数据中心'
  apiUrl: string           // '/api/dc/list'
  resourceId: string       // 17 位（reszhmc123abc）
  apiId: string            // 17 位（apizhmc456def）
  inputExample: string     // 输入报文示例
  outputExample: string    // 输出报文示例
  fields: FieldConfig[]    // 字段列表
}

// 表单数据
const form = reactive({
  platformType: '',        // 平台编码：'ZH'
  platformCode: '',        // 平台英文缩写：'zhmc'
  platformName: ''         // 平台名称：'中化'
})

const levels = ref<CascadeLevel[]>([])  // 层级列表
```

### 核心函数

| 函数名 | 说明 |
|--------|------|
| `generateResourceId(platformName, prefix)` | 生成 17 位资源 ID |
| `addLevel()` | 添加新层级 |
| `deleteLevel(index)` | 删除层级 |
| `moveLevelUp/Down(index)` | 调整层级顺序 |
| `parseOutput()` | 解析输出报文提取字段 |
| `generateSQL()` | 生成 5 张表的 INSERT 语句 |

### 17 位 ID 生成规则

```typescript
function generateResourceId(platformName: string, prefix: string): string {
  const base = prefix + platformName.toLowerCase()
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = base
  
  // 补齐到 17 位
  while (result.length < 17) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result.substring(0, 17)
}

// 示例：
// platformName='zhmc', prefix='res' → 'reszhmc123abc4567'
// platformName='zhmc', prefix='api' → 'apizhmc456def7890'
```

---

## 📤 SQL 生成示例

### 级联关系

```sql
-- 层级 01：数据中心
INSERT INTO iop_mc_serv_pltf_reso_rln 
  (platformtype, resourcelevel, platformname, resourceid, resourcename, description, res1, res2, res3, res4, res5)
VALUES 
  ('ZH', '01', 'zhmc', 'reszhmc123abc', '数据中心', NULL, NULL, NULL, NULL, NULL, NULL);

-- 层级 02：应用系统
INSERT INTO iop_mc_serv_pltf_reso_rln 
  (platformtype, resourcelevel, platformname, resourceid, resourcename, description, res1, res2, res3, res4, res5)
VALUES 
  ('ZH', '02', 'zhmc', 'reszhmc456def', '应用系统', NULL, NULL, NULL, NULL, NULL, NULL);
```

### 资源信息

```sql
INSERT INTO iop_mc_serv_reso_info 
  (resourceid, resourcename, description, resourceapiid, res1, res2, res3, res4, res5)
VALUES 
  ('reszhmc123abc', '数据中心', NULL, 'apizhmc789ghi', NULL, NULL, NULL, NULL, NULL);
```

### API 信息

```sql
INSERT INTO iop_mc_api_info 
  (apiid, apiname, apiurl, apitype, description, res1, res2, res3, res4, res5)
VALUES 
  ('apizhmc789ghi', '数据中心查询接口', '/api/dc/list', 'G', NULL, NULL, NULL, NULL, NULL, NULL);
```

### 字段配置（orderindex 不补 0）

```sql
INSERT INTO iop_mc_reso_fld_info 
  (resourceid, fieldname, resourcename, description, orderindex, hideflag, pkflag, pkdisplayflag, res1, res2, res3, res4, res5)
VALUES 
  ('reszhmc123abc', 'str_zhmc_id', '数据中心', 'ID', 1, '0', '1', '0', NULL, NULL, NULL, NULL, NULL);

INSERT INTO iop_mc_reso_fld_info 
  (resourceid, fieldname, resourcename, description, orderindex, hideflag, pkflag, pkdisplayflag, res1, res2, res3, res4, res5)
VALUES 
  ('reszhmc123abc', 'str_zhmc_name', '数据中心', '名称', 2, '0', '0', '1', NULL, NULL, NULL, NULL, NULL);
```

### 参数关联（出参 + 入参）

```sql
-- 出参（parmrlntype=1）
INSERT INTO iop_mc_api_parm_rln 
  (apiid, parmrlntype, orderindex, parmname, parmalisname, res1, res2, res3, res4, res5)
VALUES 
  ('apizhmc789ghi', '1', 1, 'str_zhmc_id', 'id', NULL, NULL, NULL, NULL, NULL);

-- 入参（parmrlntype=0）
INSERT INTO iop_mc_api_parm_rln 
  (apiid, parmrlntype, orderindex, parmname, parmalisname, res1, res2, res3, res4, res5)
VALUES 
  ('apizhmc789ghi', '0', 1, 'str_zhmc_dc', 'dc', NULL, NULL, NULL, NULL, NULL);
```

---

## 📂 文件位置

```
路径：/home/admin/.openclaw/workspace/element-plus-vite-starter/src/pages/nav/7.vue
框架：Vue 3 + TypeScript + Element Plus
路由：/nav/7
GitHub: https://github.com/Apmr40/element-plus-vite-starter
```

---

## 🔑 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| platformtype | VARCHAR(2) | 平台编码 | ZH |
| resourcelevel | VARCHAR(2) | 级联层级 | 01, 02, 03 |
| platformname | VARCHAR(200) | 平台名称（中文） | 中化 |
| platformcode | - | 平台英文缩写（前端字段） | zhmc |
| resourceid | VARCHAR(17) | 资源 ID | reszhmc123abc |
| apiid | VARCHAR(17) | API ID | apizhmc456def |
| fieldname | VARCHAR(200) | 字段名 | str_zhmc_id |
| hideflag | VARCHAR(1) | 隐藏标志 | 0=显示，1=隐藏 |
| pkflag | VARCHAR(1) | 主键标志 | 0/1 |
| pkdisplayflag | VARCHAR(1) | 展示标志 | 0/1 |
| parmrlntype | VARCHAR(1) | 参数类型 | 0=入参，1=出参 |

---

## ⚠️ 注意事项

- ⚠️ platformtype 必须为 2 位大写字母
- ⚠️ platformname 必须为小写字母
- ⚠️ resourceid 和 apiid 固定为 17 位
- ⚠️ orderindex 使用数字，不补 0（1, 2, 3 而非 01, 02, 03）
- ⚠️ 每个层级的 pkflag 只能有一个为 1
- ⚠️ 所有 INSERT 语句枚举全部字段，空值用 NULL

---

---

## 🔄 更新日志

- **2026-03-16**：补充核心函数列表、17 位 ID 生成规则详解、完整字段说明表格
- **2026-03-13**：更新页面布局图，修正字段名称（平台编码/平台英文缩写/平台名称）
- **2026-03-12**：移除级联名称输入框，简化为三字段配置

---

**最后更新时间：** 2026-03-16
