# Notion 资产库内容总结

**同步时间**: 2026-03-21  
**资料库 URL**: https://www.notion.so/32a33b8576de8165b1ecd239f0d71fe7

---

## 📚 文档概览

| 文档标题 | 类型 | 版本 | 状态 | 关联模块 |
|----------|------|------|------|----------|
| 🔗 级联资源配置 - 技术方案 | 技术方案 | v1.0 | Published | 配置模块 |
| 🗄️ 级联资源配置 - 数据库设计 | 数据库设计 | v1.0 | Published | 配置模块 |
| 🎨 级联资源配置 - 页面设计 | 需求文档 | v1.0 | Published | 配置模块 |

---

## 🎯 核心功能

**级联资源配置页面** - 支持多层级资源（数据中心 → 应用系统 → 实例）的配置管理

### 功能特性
- ✅ 多层级资源配置
- ✅ 自动生成 17 位资源 ID（平台名 + 随机字符）
- ✅ 字段拖拽排序、主键配置、隐藏控制
- ✅ 输入/输出报文解析
- ✅ 一键生成 5 张表的完整 SQL 脚本

---

## 💾 数据库设计 (5 张核心表)

### 1. iop_mc_serv_pltf_reso_rln（平台与资源关联关系）
```sql
CREATE TABLE iop_mc_serv_pltf_reso_rln (
  platformtype VARCHAR(2) NOT NULL,    -- 平台类型
  resourcelevel VARCHAR(2) NOT NULL,   -- 资源层级
  platformname VARCHAR(200),           -- 平台名称
  resourceid VARCHAR(17),              -- 资源 ID
  resourcename VARCHAR(200),           -- 资源名称
  description VARCHAR(500),            -- 描述
  res1-5 VARCHAR(100)                  -- 预留字段
);
ALTER TABLE iop_mc_serv_pltf_reso_rln ADD PRIMARY KEY (platformtype, resourcelevel);
```

### 2. iop_mc_serv_reso_info（资源基本信息）
```sql
CREATE TABLE iop_mc_serv_reso_info (
  resourceid VARCHAR(17) NOT NULL,     -- 资源 ID (主键)
  resourcename VARCHAR(400),           -- 资源名称
  description VARCHAR(500),            -- 描述
  resourceapiid VARCHAR(17),           -- 关联 API ID
  res1-5 VARCHAR(100)
);
ALTER TABLE iop_mc_serv_reso_info ADD PRIMARY KEY (resourceid);
```

### 3. iop_mc_api_info（API 基本信息）
```sql
CREATE TABLE iop_mc_api_info (
  apiid VARCHAR(17) NOT NULL,          -- API ID (主键)
  apiname VARCHAR(800),                -- API 名称
  apiurl VARCHAR(2000),                -- API URL
  apitype VARCHAR(1),                  -- API 类型
  description VARCHAR(2000),           -- 描述
  res1-5 VARCHAR(100)
);
ALTER TABLE iop_mc_api_info ADD PRIMARY KEY (apiid);
```

### 4. iop_mc_reso_fld_info（资源字段详细信息）
```sql
CREATE TABLE iop_mc_reso_fld_info (
  resourceid VARCHAR(17) NOT NULL,     -- 资源 ID
  fieldname VARCHAR(200) NOT NULL,     -- 字段名
  resourcename VARCHAR(200),           -- 资源名称
  description VARCHAR(500),            -- 描述
  orderindex VARCHAR(2),               -- 排序序号
  hideflag VARCHAR(1),                 -- 隐藏标志
  pkflag VARCHAR(1),                   -- 主键标志
  pkdisplayflag VARCHAR(1),            -- 主键展示标志
  res1-5 VARCHAR(100)
);
ALTER TABLE iop_mc_reso_fld_info ADD PRIMARY KEY (resourceid, fieldname);
```

### 5. iop_mc_api_parm_rln（API 参数关联关系）
```sql
CREATE TABLE iop_mc_api_parm_rln (
  apiid VARCHAR(17) NOT NULL,          -- API ID
  parmrlntype VARCHAR(1) NOT NULL,     -- 参数关联类型
  orderindex VARCHAR(2) NOT NULL,      -- 排序序号
  parmname VARCHAR(200),               -- 参数名
  parmalisname VARCHAR(200),           -- 参数别名
  res1-5 VARCHAR(100)
);
ALTER TABLE iop_mc_api_parm_rln ADD PRIMARY KEY (apiid, parmrlntype, orderindex);
```

---

## 🔧 技术实现

### 数据结构
```typescript
interface FieldConfig {
  fieldName: string
  description: string
  orderIndex: number
  hideFlag: number
  pkFlag: number
  pkDisplayFlag: number
}

interface CascadeLevel {
  resourceLevel: string
  resourceName: string
  apiUrl: string
  resourceId: string
  apiId: string
  inputExample: string
  outputExample: string
  fields: FieldConfig[]
}
```

### 17 位 ID 生成规则
```typescript
function generateResourceId(platformCode: string, prefix: string): string {
  const base = prefix + platformCode.toLowerCase()
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = base
  while (result.length < 17) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result.substring(0, 17)
}
// 示例：reszhmc123abc4567
```

---

## 🎨 页面交互流程

1. 填写平台编码（ZH）、平台英文缩写（zhmc）、平台名称（中化）
2. 点击「➕ 添加层级」创建新层级
3. 填写资源名称、API URL
4. 粘贴输出报文示例，点击「📋 解析 API 字段」
5. 配置字段属性（中文名、隐藏、主键、展示）
6. （可选）粘贴输入报文示例生成入参配置
7. 点击「✨ 生成完整 SQL」导出脚本

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
└─────────────────────────────────────────────────────────────┘
```

---

## ❓ 待确认事项

1. **源文件路径**: 所有文档指向同一源文件 `https://www.notion.so/32133b8576de81158e02fef14039217b` - 需要确认是否有更多详细内容
2. **负责人字段**: 当前为空，需要确认具体负责人
3. **平台编码规范**: ZH 是示例还是标准编码？其他平台的编码规则是什么？
4. **API 类型**: `apitype VARCHAR(1)` - 需要确认具体的类型枚举值
5. **参数关联类型**: `parmrlntype VARCHAR(1)` - 需要确认类型定义（输入/输出？）

---

**备注**: 此总结基于 Notion API 获取的公开内容，部分详细信息可能需要访问源文件获取。
