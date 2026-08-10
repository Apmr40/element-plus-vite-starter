-- ============================================================
-- 配置巡检系统 GaussDB DDL
-- 数据库: GaussDB (openGauss)
-- 表前缀: iop_mc_inspect_
-- 生成日期: 2026-07-27
-- 来源: docs/config-inspect/配置巡检-流程图逻辑分析.md (18张表结构截图)
-- ============================================================

-- ============================================================
-- 一、策略域（6张表）
-- ============================================================

-- ------------------------------------------------------------
-- 1. iop_mc_inspect_strategy（巡检策略表）
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_strategy (
    strategy_id       VARCHAR(17)    NOT NULL,
    strategy_name     VARCHAR(800)   NOT NULL,
    top_type          VARCHAR(30),
    sub_type          VARCHAR(200),
    tags              VARCHAR(200),
    category_id       VARCHAR(80),
    category_name     VARCHAR(200),
    test_ip           VARCHAR(200),
    dept_id           VARCHAR(30),
    dept_name         VARCHAR(200),
    strategy_type     VARCHAR(20),
    inspect_scope     VARCHAR(16000),
    status            VARCHAR(20),
    exec_type         VARCHAR(10)    DEFAULT '0',
    res1              VARCHAR(800),
    res2              VARCHAR(800),
    res3              VARCHAR(800),
    res4              VARCHAR(800),
    res5              VARCHAR(800),
    creator           VARCHAR(80),
    create_time       TIMESTAMP,
    modifier          VARCHAR(80),
    modify_time       TIMESTAMP,
    CONSTRAINT pk_inspect_strategy PRIMARY KEY (strategy_id)
);

COMMENT ON TABLE iop_mc_inspect_strategy IS '巡检策略表';
COMMENT ON COLUMN iop_mc_inspect_strategy.strategy_id IS '策略id';
COMMENT ON COLUMN iop_mc_inspect_strategy.strategy_name IS '策略名称';
COMMENT ON COLUMN iop_mc_inspect_strategy.top_type IS '策略总分类（01基础，02应用）';
COMMENT ON COLUMN iop_mc_inspect_strategy.sub_type IS '策略细分（存分类表id）';
COMMENT ON COLUMN iop_mc_inspect_strategy.tags IS '标签（01安全基线、02安全漏洞、03运行优化）';
COMMENT ON COLUMN iop_mc_inspect_strategy.category_id IS '模块编号';
COMMENT ON COLUMN iop_mc_inspect_strategy.category_name IS '模块名称';
COMMENT ON COLUMN iop_mc_inspect_strategy.test_ip IS '测试ip';
COMMENT ON COLUMN iop_mc_inspect_strategy.dept_id IS '部门id';
COMMENT ON COLUMN iop_mc_inspect_strategy.dept_name IS '部门名称';
COMMENT ON COLUMN iop_mc_inspect_strategy.strategy_type IS '策略类型（01公共，02部门定制）';
COMMENT ON COLUMN iop_mc_inspect_strategy.inspect_scope IS '巡检范围';
COMMENT ON COLUMN iop_mc_inspect_strategy.status IS '状态';
COMMENT ON COLUMN iop_mc_inspect_strategy.exec_type IS '0-代理端执行，1-服务端执行';
COMMENT ON COLUMN iop_mc_inspect_strategy.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_strategy.res2 IS '后续用于区分编排还是操作';
COMMENT ON COLUMN iop_mc_inspect_strategy.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_strategy.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_strategy.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_strategy.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_strategy.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_strategy.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_strategy.modify_time IS '修改时间';

-- ------------------------------------------------------------
-- 2. iop_mc_inspect_strategy_draft（巡检策略草稿表）
--    结构与策略表一致，审批通过后写入正式表、删除草稿
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_strategy_draft (
    strategy_id       VARCHAR(17)    NOT NULL,
    strategy_name     VARCHAR(800)   NOT NULL,
    top_type          VARCHAR(30),
    sub_type          VARCHAR(200),
    tags              VARCHAR(200),
    category_id       VARCHAR(80),
    category_name     VARCHAR(200),
    test_ip           VARCHAR(200),
    dept_id           VARCHAR(30),
    dept_name         VARCHAR(200),
    strategy_type     VARCHAR(20),
    inspect_scope     VARCHAR(16000),
    status            VARCHAR(20),
    exec_type         VARCHAR(10)    DEFAULT '0',
    res1              VARCHAR(800),
    res2              VARCHAR(800),
    res3              VARCHAR(800),
    res4              VARCHAR(800),
    res5              VARCHAR(800),
    creator           VARCHAR(80),
    create_time       TIMESTAMP,
    modifier          VARCHAR(80),
    modify_time       TIMESTAMP,
    CONSTRAINT pk_inspect_strategy_draft PRIMARY KEY (strategy_id)
);

COMMENT ON TABLE iop_mc_inspect_strategy_draft IS '巡检策略草稿表';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.strategy_id IS '策略id';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.strategy_name IS '策略名称';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.top_type IS '策略总分类（01基础，02应用）';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.sub_type IS '策略细分（存分类表id）';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.tags IS '标签（01安全基线、02安全漏洞、03运行优化）';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.category_id IS '模块编号';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.category_name IS '模块名称';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.test_ip IS '测试ip';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.dept_id IS '部门id';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.dept_name IS '部门名称';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.strategy_type IS '策略类型（01公共，02部门定制）';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.inspect_scope IS '巡检范围';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.status IS '状态';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.exec_type IS '0-代理端执行，1-服务端执行';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.res1 IS '流程工单id';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.res2 IS '后续用于区分编排还是操作';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_strategy_draft.modify_time IS '修改时间';

-- ------------------------------------------------------------
-- 3. iop_mc_inspect_component（巡检组件表）
--    联合主键: strategy_id + component_id + component_version
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_component (
    strategy_id        VARCHAR(17)    NOT NULL,
    component_id       VARCHAR(32)    NOT NULL,
    component_version  VARCHAR(20)    NOT NULL,
    component_code     VARCHAR(100),
    component_name     VARCHAR(2000),
    status             VARCHAR(20),
    exec_type          VARCHAR(10)    DEFAULT '0',
    param_json         VARCHAR(1000),
    res1               VARCHAR(800),
    res2               VARCHAR(800),
    res3               VARCHAR(800),
    res4               VARCHAR(800),
    res5               VARCHAR(800),
    modifier           VARCHAR(80),
    modify_time        TIMESTAMP,
    creator            VARCHAR(80),
    create_time        TIMESTAMP,
    CONSTRAINT pk_inspect_component PRIMARY KEY (strategy_id, component_id, component_version)
);

COMMENT ON TABLE iop_mc_inspect_component IS '巡检组件表';
COMMENT ON COLUMN iop_mc_inspect_component.strategy_id IS '巡检策略id';
COMMENT ON COLUMN iop_mc_inspect_component.component_id IS '巡检组件id';
COMMENT ON COLUMN iop_mc_inspect_component.component_version IS '巡检组件版本';
COMMENT ON COLUMN iop_mc_inspect_component.component_code IS '巡检组件code';
COMMENT ON COLUMN iop_mc_inspect_component.component_name IS '巡检组件名称';
COMMENT ON COLUMN iop_mc_inspect_component.status IS '状态';
COMMENT ON COLUMN iop_mc_inspect_component.exec_type IS '0-代理端执行，1-服务端执行';
COMMENT ON COLUMN iop_mc_inspect_component.param_json IS '入参';
COMMENT ON COLUMN iop_mc_inspect_component.res1 IS '流程工单id(参考draft表)';
COMMENT ON COLUMN iop_mc_inspect_component.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_component.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_component.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_component.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_component.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_component.modify_time IS '修改时间';
COMMENT ON COLUMN iop_mc_inspect_component.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_component.create_time IS '创建时间';

-- ------------------------------------------------------------
-- 4. iop_mc_inspect_component_draft（巡检组件草稿表）
--    结构与组件表一致，res1为流程工单id
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_component_draft (
    strategy_id        VARCHAR(17)    NOT NULL,
    component_id       VARCHAR(32)    NOT NULL,
    component_version  VARCHAR(20)    NOT NULL,
    component_code     VARCHAR(100),
    component_name     VARCHAR(2000),
    status             VARCHAR(20),
    exec_type          VARCHAR(10)    DEFAULT '0',
    param_json         VARCHAR(1000),
    res1               VARCHAR(800),
    res2               VARCHAR(800),
    res3               VARCHAR(800),
    res4               VARCHAR(800),
    res5               VARCHAR(800),
    modifier           VARCHAR(80),
    modify_time        TIMESTAMP,
    creator            VARCHAR(80),
    create_time        TIMESTAMP,
    CONSTRAINT pk_inspect_component_draft PRIMARY KEY (strategy_id, component_id, component_version)
);

COMMENT ON TABLE iop_mc_inspect_component_draft IS '巡检组件草稿表';
COMMENT ON COLUMN iop_mc_inspect_component_draft.strategy_id IS '巡检策略id';
COMMENT ON COLUMN iop_mc_inspect_component_draft.component_id IS '巡检组件id';
COMMENT ON COLUMN iop_mc_inspect_component_draft.component_version IS '巡检组件版本';
COMMENT ON COLUMN iop_mc_inspect_component_draft.component_code IS '巡检组件code';
COMMENT ON COLUMN iop_mc_inspect_component_draft.component_name IS '巡检组件名称';
COMMENT ON COLUMN iop_mc_inspect_component_draft.status IS '状态';
COMMENT ON COLUMN iop_mc_inspect_component_draft.exec_type IS '0-代理端执行，1-服务端执行';
COMMENT ON COLUMN iop_mc_inspect_component_draft.param_json IS '入参';
COMMENT ON COLUMN iop_mc_inspect_component_draft.res1 IS '流程工单id';
COMMENT ON COLUMN iop_mc_inspect_component_draft.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_component_draft.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_component_draft.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_component_draft.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_component_draft.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_component_draft.modify_time IS '修改时间';
COMMENT ON COLUMN iop_mc_inspect_component_draft.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_component_draft.create_time IS '创建时间';

-- ------------------------------------------------------------
-- 5. iop_mc_inspect_item（检查项表）
--    联合主键: component_id + check_name + component_version
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_item (
    component_id              VARCHAR(32)    NOT NULL,
    check_name                VARCHAR(800)   NOT NULL,
    component_version         VARCHAR(20)    NOT NULL,
    obj_name                  VARCHAR(3000),
    std_value                 VARCHAR(2000),
    baseline_no               VARCHAR(800),
    cross_center              VARCHAR(20),
    risk_level                VARCHAR(20),
    govern_deadline           VARCHAR(80),
    govern_component_id       VARCHAR(32),
    govern_component_name     VARCHAR(800),
    govern_component_version  VARCHAR(20),
    govern_desc               VARCHAR(2000),
    status                    VARCHAR(20),
    res1                      VARCHAR(800),
    res2                      VARCHAR(800),
    res3                      VARCHAR(800),
    res4                      VARCHAR(800),
    res5                      VARCHAR(800),
    modifier                  VARCHAR(80),
    modify_time               TIMESTAMP,
    creator                   VARCHAR(80),
    create_time               TIMESTAMP,
    CONSTRAINT pk_inspect_item PRIMARY KEY (component_id, check_name, component_version)
);

COMMENT ON TABLE iop_mc_inspect_item IS '检查项表';
COMMENT ON COLUMN iop_mc_inspect_item.component_id IS '巡检组件id';
COMMENT ON COLUMN iop_mc_inspect_item.check_name IS '检查项名字';
COMMENT ON COLUMN iop_mc_inspect_item.component_version IS '巡检组件版本';
COMMENT ON COLUMN iop_mc_inspect_item.obj_name IS '检查对象';
COMMENT ON COLUMN iop_mc_inspect_item.std_value IS '标准值';
COMMENT ON COLUMN iop_mc_inspect_item.baseline_no IS '基线检查编号';
COMMENT ON COLUMN iop_mc_inspect_item.cross_center IS '跨中心（AC:需要应用配合 AE:需要应用实施 N:否）';
COMMENT ON COLUMN iop_mc_inspect_item.risk_level IS '风险等级（01:低风险 02:中风险 03:高风险）';
COMMENT ON COLUMN iop_mc_inspect_item.govern_deadline IS '治理时限';
COMMENT ON COLUMN iop_mc_inspect_item.govern_component_id IS '治理组件id';
COMMENT ON COLUMN iop_mc_inspect_item.govern_component_name IS '治理组件名字';
COMMENT ON COLUMN iop_mc_inspect_item.govern_component_version IS '治理组件版本';
COMMENT ON COLUMN iop_mc_inspect_item.govern_desc IS '治理说明';
COMMENT ON COLUMN iop_mc_inspect_item.status IS '状态';
COMMENT ON COLUMN iop_mc_inspect_item.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_item.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_item.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_item.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_item.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_item.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_item.modify_time IS '修改时间';
COMMENT ON COLUMN iop_mc_inspect_item.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_item.create_time IS '创建时间';

-- ------------------------------------------------------------
-- 6. iop_mc_inspect_item_draft（检查项草稿表）
--    结构与检查项表一致，res1为流程工单id
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_item_draft (
    component_id              VARCHAR(32)    NOT NULL,
    check_name                VARCHAR(800)   NOT NULL,
    component_version         VARCHAR(20)    NOT NULL,
    obj_name                  VARCHAR(3000),
    std_value                 VARCHAR(2000),
    baseline_no               VARCHAR(800),
    cross_center              VARCHAR(20),
    risk_level                VARCHAR(20),
    govern_deadline           VARCHAR(80),
    govern_component_id       VARCHAR(32),
    govern_component_name     VARCHAR(800),
    govern_component_version  VARCHAR(20),
    govern_desc               VARCHAR(2000),
    status                    VARCHAR(20),
    res1                      VARCHAR(800),
    res2                      VARCHAR(800),
    res3                      VARCHAR(800),
    res4                      VARCHAR(800),
    res5                      VARCHAR(800),
    modifier                  VARCHAR(80),
    modify_time               TIMESTAMP,
    creator                   VARCHAR(80),
    create_time               TIMESTAMP,
    CONSTRAINT pk_inspect_item_draft PRIMARY KEY (component_id, check_name, component_version)
);

COMMENT ON TABLE iop_mc_inspect_item_draft IS '检查项草稿表';
COMMENT ON COLUMN iop_mc_inspect_item_draft.component_id IS '巡检组件id';
COMMENT ON COLUMN iop_mc_inspect_item_draft.check_name IS '检查项名字';
COMMENT ON COLUMN iop_mc_inspect_item_draft.component_version IS '巡检组件版本';
COMMENT ON COLUMN iop_mc_inspect_item_draft.obj_name IS '检查对象';
COMMENT ON COLUMN iop_mc_inspect_item_draft.std_value IS '标准值';
COMMENT ON COLUMN iop_mc_inspect_item_draft.baseline_no IS '基线检查编号';
COMMENT ON COLUMN iop_mc_inspect_item_draft.cross_center IS '跨中心（AC:需要应用配合 AE:需要应用实施 N:否）';
COMMENT ON COLUMN iop_mc_inspect_item_draft.risk_level IS '风险等级（01:低风险 02:中风险 03:高风险）';
COMMENT ON COLUMN iop_mc_inspect_item_draft.govern_deadline IS '治理时限';
COMMENT ON COLUMN iop_mc_inspect_item_draft.govern_component_id IS '治理组件id';
COMMENT ON COLUMN iop_mc_inspect_item_draft.govern_component_name IS '治理组件名字';
COMMENT ON COLUMN iop_mc_inspect_item_draft.govern_component_version IS '治理组件版本';
COMMENT ON COLUMN iop_mc_inspect_item_draft.govern_desc IS '治理说明';
COMMENT ON COLUMN iop_mc_inspect_item_draft.status IS '状态';
COMMENT ON COLUMN iop_mc_inspect_item_draft.res1 IS '流程工单id';
COMMENT ON COLUMN iop_mc_inspect_item_draft.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_item_draft.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_item_draft.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_item_draft.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_item_draft.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_item_draft.modify_time IS '修改时间';
COMMENT ON COLUMN iop_mc_inspect_item_draft.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_item_draft.create_time IS '创建时间';

-- ============================================================
-- 二、计划域（2张表）
-- ============================================================

-- ------------------------------------------------------------
-- 7. iop_mc_inspect_plan（巡检计划表）
--    主键: plan_id
--    注意: 无res1/res2（被batch_size/wait_time占用）
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_plan (
    plan_id           VARCHAR(17)    NOT NULL,
    strategy_id       VARCHAR(17)    NOT NULL,
    dept_id           VARCHAR(30),
    plan_name         VARCHAR(800)   NOT NULL,
    crontab           VARCHAR(100),
    trial_times       VARCHAR(30),
    cur_trial_times   VARCHAR(30),
    trial_ips         VARCHAR(2000),
    status            VARCHAR(20),
    enable_flag       VARCHAR(20),
    jobtimer_id       VARCHAR(100),
    category_code     VARCHAR(80),
    category_name     VARCHAR(200),
    dept_name         VARCHAR(200),
    batch_size        VARCHAR(800),
    wait_time         VARCHAR(800),
    res3              VARCHAR(800),
    res4              VARCHAR(800),
    res5              VARCHAR(800),
    creator           VARCHAR(80),
    create_time       TIMESTAMP,
    modifier          VARCHAR(80),
    modify_time       TIMESTAMP,
    CONSTRAINT pk_inspect_plan PRIMARY KEY (plan_id)
);

COMMENT ON TABLE iop_mc_inspect_plan IS '巡检计划表';
COMMENT ON COLUMN iop_mc_inspect_plan.plan_id IS '巡检计划id';
COMMENT ON COLUMN iop_mc_inspect_plan.strategy_id IS '巡检策略id';
COMMENT ON COLUMN iop_mc_inspect_plan.dept_id IS '部门id';
COMMENT ON COLUMN iop_mc_inspect_plan.plan_name IS '巡检计划名称';
COMMENT ON COLUMN iop_mc_inspect_plan.crontab IS '执行周期';
COMMENT ON COLUMN iop_mc_inspect_plan.trial_times IS '试运行次数';
COMMENT ON COLUMN iop_mc_inspect_plan.cur_trial_times IS '当前已试运行次数';
COMMENT ON COLUMN iop_mc_inspect_plan.trial_ips IS '试运行ip';
COMMENT ON COLUMN iop_mc_inspect_plan.status IS '状态（0试运行，1正式运行，2已取消）';
COMMENT ON COLUMN iop_mc_inspect_plan.enable_flag IS '开启状态（启动：01，暂停：02，禁用：03）';
COMMENT ON COLUMN iop_mc_inspect_plan.jobtimer_id IS '定时作业id';
COMMENT ON COLUMN iop_mc_inspect_plan.category_code IS '模块编号';
COMMENT ON COLUMN iop_mc_inspect_plan.category_name IS '模块名称';
COMMENT ON COLUMN iop_mc_inspect_plan.dept_name IS '部门名称';
COMMENT ON COLUMN iop_mc_inspect_plan.batch_size IS '每批次机器数量';
COMMENT ON COLUMN iop_mc_inspect_plan.wait_time IS '等待时间';
COMMENT ON COLUMN iop_mc_inspect_plan.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_plan.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_plan.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_plan.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_plan.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_plan.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_plan.modify_time IS '修改时间';

-- ------------------------------------------------------------
-- 8. iop_mc_inspect_component_plan（巡检组件计划关联表）
--    联合主键: plan_id + component_id + component_version
--    用途: 计划级入参覆盖策略级（param容量10000，是组件表param_json的10倍）
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_component_plan (
    plan_id            VARCHAR(17)     NOT NULL,
    component_id       VARCHAR(32)     NOT NULL,
    component_version  VARCHAR(20)     NOT NULL,
    component_code     VARCHAR(100),
    component_name     VARCHAR(2000),
    status             VARCHAR(20),
    param              VARCHAR(10000),
    exec_type          VARCHAR(10),
    res1               VARCHAR(800),
    res2               VARCHAR(800),
    res3               VARCHAR(800),
    res4               VARCHAR(800),
    res5               VARCHAR(800),
    modifier           VARCHAR(80),
    modify_time        TIMESTAMP,
    creator            VARCHAR(80),
    create_time        TIMESTAMP,
    CONSTRAINT pk_inspect_component_plan PRIMARY KEY (plan_id, component_id, component_version)
);

COMMENT ON TABLE iop_mc_inspect_component_plan IS '巡检组件计划关联表';
COMMENT ON COLUMN iop_mc_inspect_component_plan.plan_id IS '巡检计划id';
COMMENT ON COLUMN iop_mc_inspect_component_plan.component_id IS '巡检组件id';
COMMENT ON COLUMN iop_mc_inspect_component_plan.component_version IS '巡检组件版本';
COMMENT ON COLUMN iop_mc_inspect_component_plan.component_code IS '巡检组件code';
COMMENT ON COLUMN iop_mc_inspect_component_plan.component_name IS '巡检组件名称';
COMMENT ON COLUMN iop_mc_inspect_component_plan.status IS '状态';
COMMENT ON COLUMN iop_mc_inspect_component_plan.param IS '组件相关的入参json';
COMMENT ON COLUMN iop_mc_inspect_component_plan.exec_type IS '代理端执行-0，服务端执行-1';
COMMENT ON COLUMN iop_mc_inspect_component_plan.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_component_plan.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_component_plan.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_component_plan.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_component_plan.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_component_plan.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_component_plan.modify_time IS '修改时间';
COMMENT ON COLUMN iop_mc_inspect_component_plan.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_component_plan.create_time IS '创建时间';

-- ============================================================
-- 三、执行域（3张表）
-- ============================================================

-- ------------------------------------------------------------
-- 9. iop_mc_inspect_execution（执行进度表）
--    主键: job_id
--    exec_status=2 对应流程图中的 status=3（服务端常态化，automation自行入库）
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_execution (
    job_id             VARCHAR(80)    NOT NULL,
    jobtimer_id        VARCHAR(80)    NOT NULL,
    plan_id            VARCHAR(17)    NOT NULL,
    strategy_id        VARCHAR(17)    NOT NULL,
    component_id       VARCHAR(32)    NOT NULL,
    component_version  VARCHAR(20)    NOT NULL,
    trial_flag         VARCHAR(20),
    dept_id            VARCHAR(30),
    dept_name          VARCHAR(200),
    inspect_date       VARCHAR(80),
    inspect_time       VARCHAR(80),
    strategy_name      VARCHAR(800),
    top_type           VARCHAR(30),
    sub_type           VARCHAR(200),
    tags               VARCHAR(200),
    exec_status        VARCHAR(20),
    category_code      VARCHAR(80),
    category_name      VARCHAR(200),
    res1               VARCHAR(800),
    res2               VARCHAR(800),
    res3               VARCHAR(800),
    res4               VARCHAR(800),
    res5               VARCHAR(800),
    creator            VARCHAR(80),
    create_time        TIMESTAMP,
    modifier           VARCHAR(80),
    modify_time        TIMESTAMP,
    CONSTRAINT pk_inspect_execution PRIMARY KEY (job_id)
);

COMMENT ON TABLE iop_mc_inspect_execution IS '执行进度表';
COMMENT ON COLUMN iop_mc_inspect_execution.job_id IS '单次作业id';
COMMENT ON COLUMN iop_mc_inspect_execution.jobtimer_id IS '定时作业id';
COMMENT ON COLUMN iop_mc_inspect_execution.plan_id IS '巡检计划id';
COMMENT ON COLUMN iop_mc_inspect_execution.strategy_id IS '巡检策略id';
COMMENT ON COLUMN iop_mc_inspect_execution.component_id IS '巡检组件id';
COMMENT ON COLUMN iop_mc_inspect_execution.component_version IS '巡检组件版本';
COMMENT ON COLUMN iop_mc_inspect_execution.trial_flag IS '试运行标记（0试运行、1正式）';
COMMENT ON COLUMN iop_mc_inspect_execution.dept_id IS '巡检计划对应的部门id';
COMMENT ON COLUMN iop_mc_inspect_execution.dept_name IS '巡检计划对应的部门名';
COMMENT ON COLUMN iop_mc_inspect_execution.inspect_date IS '巡检日期';
COMMENT ON COLUMN iop_mc_inspect_execution.inspect_time IS '巡检时间';
COMMENT ON COLUMN iop_mc_inspect_execution.strategy_name IS '巡检策略名';
COMMENT ON COLUMN iop_mc_inspect_execution.top_type IS '巡检策略的总分类';
COMMENT ON COLUMN iop_mc_inspect_execution.sub_type IS '巡检策略的细分';
COMMENT ON COLUMN iop_mc_inspect_execution.tags IS '巡检策略的标签（01安全基线、02安全漏洞、03运行优化）';
COMMENT ON COLUMN iop_mc_inspect_execution.exec_status IS '执行状态（0未执行，1已执行，2虽未入库但不需要再轮询）';
COMMENT ON COLUMN iop_mc_inspect_execution.category_code IS '巡检计划对应的模块编号';
COMMENT ON COLUMN iop_mc_inspect_execution.category_name IS '巡检计划对应的模块名';
COMMENT ON COLUMN iop_mc_inspect_execution.res1 IS '巡检组件名称（从akita接口获取）';
COMMENT ON COLUMN iop_mc_inspect_execution.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_execution.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_execution.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_execution.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_execution.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_execution.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_execution.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_execution.modify_time IS '修改时间';

-- ------------------------------------------------------------
-- 10. iop_mc_inspect_exec_detail（巡检明细表）
--     主键: detail_id
--     按作业粒度存储，每次执行每个检查项一条记录
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_exec_detail (
    detail_id              VARCHAR(17)    NOT NULL,
    plan_id                VARCHAR(17)    NOT NULL,
    jobtimer_id            VARCHAR(80)    NOT NULL,
    job_id                 VARCHAR(80)    NOT NULL,
    component_id           VARCHAR(32)    NOT NULL,
    component_version      VARCHAR(20)    NOT NULL,
    trial_flag             VARCHAR(20),
    check_name             VARCHAR(100),
    ip                     VARCHAR(80),
    host_name              VARCHAR(200),
    resource_type          VARCHAR(100),
    obj_name               VARCHAR(800),
    std_value              VARCHAR(800),
    current_value          VARCHAR(800),
    baseline_no            VARCHAR(800),
    result_status          VARCHAR(100),
    inspect_date           VARCHAR(80),
    inspect_time           VARCHAR(80),
    res1                   VARCHAR(800),
    res2                   VARCHAR(800),
    res3                   VARCHAR(800),
    res4                   VARCHAR(800),
    res5                   VARCHAR(800),
    imp1                   VARCHAR(1000),
    imp2                   VARCHAR(1000),
    imp3                   VARCHAR(1000),
    exception_remark       VARCHAR(1200),
    exception_applicant    VARCHAR(80),
    exception_apply_time   VARCHAR(80),
    dept_id                VARCHAR(30),
    category_code          VARCHAR(500),
    admin_id               VARCHAR(200),
    admin_group            VARCHAR(400),
    creator                VARCHAR(80),
    create_time            TIMESTAMP,
    modifier               VARCHAR(80),
    modify_time            TIMESTAMP,
    CONSTRAINT pk_inspect_exec_detail PRIMARY KEY (detail_id)
);

COMMENT ON TABLE iop_mc_inspect_exec_detail IS '巡检明细表';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.detail_id IS '巡检结果明细id';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.plan_id IS '巡检计划id';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.jobtimer_id IS '定时作业id';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.job_id IS '单次作业id';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.component_id IS '巡检组件id';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.component_version IS '巡检组件版本';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.trial_flag IS '是否为试运行结果（0试运行，1正式运行）';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.check_name IS '检查项名字';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.ip IS 'ip地址';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.host_name IS '主机名';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.resource_type IS '资源类型';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.obj_name IS '检查对象';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.std_value IS '标准值';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.current_value IS '当前值';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.baseline_no IS '基线检查编号';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.result_status IS '检查结论（含正常、异常、警告）';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.inspect_date IS '检查日期';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.inspect_time IS '检查时间';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.res2 IS '是否例外（0和null代表否，1代表是）';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.res3 IS '例外截止时间';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.imp1 IS '扩展字段1';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.imp2 IS '扩展字段2';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.imp3 IS '扩展字段3';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.exception_remark IS '例外备注';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.exception_applicant IS '例外申请人';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.exception_apply_time IS '例外申请时间';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.dept_id IS '巡检计划对应的部门id';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.category_code IS '机器对应的模块编号';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.admin_id IS '运维负责人userid';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.admin_group IS '系统维护组';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_exec_detail.modify_time IS '修改时间';

-- ------------------------------------------------------------
-- 11. iop_mc_inspect_exec_miss（缺失巡检内容表）
--     主键: miss_id
--     记录"应有结果但未返回"的机器+检查项
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_exec_miss (
    miss_id                    VARCHAR(17)    NOT NULL,
    plan_id                    VARCHAR(17)    NOT NULL,
    jobtimer_id                VARCHAR(80)    NOT NULL,
    strategy_id                VARCHAR(17)    NOT NULL,
    dept_id                    VARCHAR(30)    NOT NULL,
    component_id               VARCHAR(32)    NOT NULL,
    check_name                 VARCHAR(100)   NOT NULL,
    obj_name                   VARCHAR(800)   NOT NULL,
    ip                         VARCHAR(80)    NOT NULL,
    component_version          VARCHAR(20)    NOT NULL,
    job_id                     VARCHAR(80)    NOT NULL,
    strategy_name              VARCHAR(800),
    tags                       VARCHAR(200),
    dept_name                  VARCHAR(200),
    category_code              VARCHAR(80),
    category_name              VARCHAR(200),
    host_name                  VARCHAR(200)   NOT NULL,
    baseline_no                VARCHAR(800),
    resource_type              VARCHAR(100),
    top_type                   VARCHAR(30),
    sub_type                   VARCHAR(200),
    std_value                  VARCHAR(800),
    inspect_date               VARCHAR(80),
    inspect_time               VARCHAR(80),
    cross_center               VARCHAR(20),
    risk_level                 VARCHAR(20),
    govern_deadline            VARCHAR(80),
    govern_component_id        VARCHAR(32),
    govern_component_name      VARCHAR(800),
    govern_component_version   VARCHAR(20),
    govern_desc                VARCHAR(2000),
    admin_name                 VARCHAR(400),
    admin_id                   VARCHAR(200),
    admin_group                VARCHAR(400),
    exception_remark           VARCHAR(1200),
    exception_applicant        VARCHAR(80),
    exception_apply_time       VARCHAR(80),
    creator                    VARCHAR(80),
    create_time                TIMESTAMP,
    modifier                   VARCHAR(80),
    modify_time                TIMESTAMP,
    CONSTRAINT pk_inspect_exec_miss PRIMARY KEY (miss_id)
);

COMMENT ON TABLE iop_mc_inspect_exec_miss IS '缺失巡检内容表';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.miss_id IS '缺失巡检内容id';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.plan_id IS '巡检计划id';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.jobtimer_id IS '定时作业id';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.strategy_id IS '策略id';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.dept_id IS '巡检计划对应的部门id';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.component_id IS '巡检组件id';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.check_name IS '检查项名称';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.obj_name IS '检查对象';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.ip IS 'ip地址';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.component_version IS '巡检组件版本';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.job_id IS '单次作业id';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.strategy_name IS '巡检策略名称';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.tags IS '巡检策略标签';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.dept_name IS '巡检计划对应的部门名称';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.category_code IS '机器对应的模块编号';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.category_name IS '机器对应的模块名称';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.host_name IS '主机名';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.baseline_no IS '基线检查编号';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.resource_type IS '资源类型';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.top_type IS '策略总分类';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.sub_type IS '策略细分（存分类表id）';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.std_value IS '标准值';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.inspect_date IS '检查日期';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.inspect_time IS '检查时间';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.cross_center IS '跨中心';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.risk_level IS '风险等级';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.govern_deadline IS '治理时限';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.govern_component_id IS '治理组件id';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.govern_component_name IS '治理组件名字';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.govern_component_version IS '治理组件版本';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.govern_desc IS '治理说明';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.admin_name IS '运维负责人名字';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.admin_id IS '运维负责人userid';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.admin_group IS '系统维护组';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.exception_remark IS '例外备注';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.exception_applicant IS '例外申请人';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.exception_apply_time IS '例外申请时间';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_exec_miss.modify_time IS '修改时间';

-- ============================================================
-- 四、例外域（2张表）
-- ============================================================

-- ------------------------------------------------------------
-- 12. iop_mc_inspect_exception（巡检例外表）
--     联合主键: check_name + obj_name + host_name
--     例外有审批流程（申请→审批通过→可取消→取消审批通过）
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_exception (
    check_name            VARCHAR(100)   NOT NULL,
    obj_name              VARCHAR(800)   NOT NULL,
    host_name             VARCHAR(200)   NOT NULL,
    applicant             VARCHAR(200),
    appl_user_id          VARCHAR(80)    NOT NULL,
    appl_time             TIMESTAMP      NOT NULL,
    check_type            VARCHAR(100),
    remark                VARCHAR(2000),
    excep_end_date        VARCHAR(80),
    work_order_id         VARCHAR(50),
    cancel_applicant      VARCHAR(200),
    cancel_user_id        VARCHAR(80),
    cancel_reason         VARCHAR(2000),
    cancel_apply_time     TIMESTAMP,
    status                VARCHAR(10),
    res1                  VARCHAR(800),
    res2                  VARCHAR(800),
    res3                  VARCHAR(800),
    res4                  VARCHAR(800),
    res5                  VARCHAR(800),
    creator               VARCHAR(80),
    create_time           TIMESTAMP,
    modifier              VARCHAR(80),
    modify_time           TIMESTAMP,
    CONSTRAINT pk_inspect_exception PRIMARY KEY (check_name, obj_name, host_name)
);

COMMENT ON TABLE iop_mc_inspect_exception IS '巡检例外表';
COMMENT ON COLUMN iop_mc_inspect_exception.check_name IS '检查项';
COMMENT ON COLUMN iop_mc_inspect_exception.obj_name IS '检查对象';
COMMENT ON COLUMN iop_mc_inspect_exception.host_name IS '机器名';
COMMENT ON COLUMN iop_mc_inspect_exception.applicant IS '例外申请人中文名';
COMMENT ON COLUMN iop_mc_inspect_exception.appl_user_id IS '例外申请人userid';
COMMENT ON COLUMN iop_mc_inspect_exception.appl_time IS '例外申请时间';
COMMENT ON COLUMN iop_mc_inspect_exception.check_type IS '健康检查类型';
COMMENT ON COLUMN iop_mc_inspect_exception.remark IS '例外备注';
COMMENT ON COLUMN iop_mc_inspect_exception.excep_end_date IS '例外截止日期';
COMMENT ON COLUMN iop_mc_inspect_exception.work_order_id IS '流程工单id';
COMMENT ON COLUMN iop_mc_inspect_exception.cancel_applicant IS '取消例外申请人中文名';
COMMENT ON COLUMN iop_mc_inspect_exception.cancel_user_id IS '取消例外申请人userid';
COMMENT ON COLUMN iop_mc_inspect_exception.cancel_reason IS '取消例外原因';
COMMENT ON COLUMN iop_mc_inspect_exception.cancel_apply_time IS '取消例外申请时间';
COMMENT ON COLUMN iop_mc_inspect_exception.status IS '审批状态（0-例外审批中 1-例外审批通过 2-取消例外审批中 3-取消例外审批通过）';
COMMENT ON COLUMN iop_mc_inspect_exception.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_exception.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_exception.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_exception.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_exception.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_exception.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_exception.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_exception.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_exception.modify_time IS '修改时间';

-- ------------------------------------------------------------
-- 13. iop_mc_inspect_exception_history（巡检例外历史表）
--     主键: id
--     每次例外状态变更写入一条历史记录
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_exception_history (
    id                    VARCHAR(17)    NOT NULL,
    check_name            VARCHAR(100)   NOT NULL,
    obj_name              VARCHAR(800)   NOT NULL,
    host_name             VARCHAR(200)   NOT NULL,
    applicant             VARCHAR(200),
    appl_user_id          VARCHAR(80),
    appl_time             TIMESTAMP,
    check_type            VARCHAR(100),
    remark                VARCHAR(2000),
    excep_end_date        VARCHAR(80),
    work_order_id         VARCHAR(50),
    cancel_applicant      VARCHAR(200),
    cancel_user_id        VARCHAR(80),
    cancel_reason         VARCHAR(2000),
    cancel_apply_time     TIMESTAMP,
    status                VARCHAR(10),
    res1                  VARCHAR(800),
    res2                  VARCHAR(800),
    res3                  VARCHAR(800),
    res4                  VARCHAR(800),
    res5                  VARCHAR(800),
    creator               VARCHAR(80),
    create_time           TIMESTAMP,
    modifier              VARCHAR(80),
    modify_time           TIMESTAMP,
    CONSTRAINT pk_inspect_exception_history PRIMARY KEY (id)
);

COMMENT ON TABLE iop_mc_inspect_exception_history IS '巡检例外历史表';
COMMENT ON COLUMN iop_mc_inspect_exception_history.id IS '例外历史id';
COMMENT ON COLUMN iop_mc_inspect_exception_history.check_name IS '检查项';
COMMENT ON COLUMN iop_mc_inspect_exception_history.obj_name IS '检查对象';
COMMENT ON COLUMN iop_mc_inspect_exception_history.host_name IS '机器名';
COMMENT ON COLUMN iop_mc_inspect_exception_history.applicant IS '例外申请人中文名';
COMMENT ON COLUMN iop_mc_inspect_exception_history.appl_user_id IS '例外申请人userid';
COMMENT ON COLUMN iop_mc_inspect_exception_history.appl_time IS '例外申请时间';
COMMENT ON COLUMN iop_mc_inspect_exception_history.check_type IS '健康检查类型';
COMMENT ON COLUMN iop_mc_inspect_exception_history.remark IS '例外备注';
COMMENT ON COLUMN iop_mc_inspect_exception_history.excep_end_date IS '例外截止日期';
COMMENT ON COLUMN iop_mc_inspect_exception_history.work_order_id IS '流程工单id';
COMMENT ON COLUMN iop_mc_inspect_exception_history.cancel_applicant IS '取消例外申请人中文名';
COMMENT ON COLUMN iop_mc_inspect_exception_history.cancel_user_id IS '取消例外申请人userid';
COMMENT ON COLUMN iop_mc_inspect_exception_history.cancel_reason IS '取消例外原因';
COMMENT ON COLUMN iop_mc_inspect_exception_history.cancel_apply_time IS '取消例外申请时间';
COMMENT ON COLUMN iop_mc_inspect_exception_history.status IS '审批状态（0-例外审批中 1-例外审批通过 2-取消例外审批中 3-取消例外审批通过）';
COMMENT ON COLUMN iop_mc_inspect_exception_history.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_exception_history.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_exception_history.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_exception_history.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_exception_history.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_exception_history.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_exception_history.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_exception_history.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_exception_history.modify_time IS '修改时间';

-- ============================================================
-- 五、治理域（3张表）
-- ============================================================

-- ------------------------------------------------------------
-- 14. iop_mc_inspect_govern（治理表）
--     联合主键: check_name + obj_name + host_name
--     用途: 跟踪异常项的整改进度（剩余整改时间倒计时）
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_govern (
    check_name        VARCHAR(100)   NOT NULL,
    obj_name          VARCHAR(800)   NOT NULL,
    host_name         VARCHAR(200)   NOT NULL,
    ip                VARCHAR(80),
    remain_time       VARCHAR(10),
    start_date        VARCHAR(80),
    dept_id           VARCHAR(30),
    category_code     VARCHAR(100),
    category_name     VARCHAR(500),
    resource_type     VARCHAR(100),
    res1              VARCHAR(800),
    res2              VARCHAR(800),
    res3              VARCHAR(800),
    res4              VARCHAR(800),
    res5              VARCHAR(800),
    creator           VARCHAR(80),
    create_time       TIMESTAMP,
    modifier          VARCHAR(80),
    modify_time       TIMESTAMP,
    CONSTRAINT pk_inspect_govern PRIMARY KEY (check_name, obj_name, host_name)
);

COMMENT ON TABLE iop_mc_inspect_govern IS '治理表';
COMMENT ON COLUMN iop_mc_inspect_govern.check_name IS '检查项';
COMMENT ON COLUMN iop_mc_inspect_govern.obj_name IS '检查对象';
COMMENT ON COLUMN iop_mc_inspect_govern.host_name IS '机器名';
COMMENT ON COLUMN iop_mc_inspect_govern.ip IS 'ip地址';
COMMENT ON COLUMN iop_mc_inspect_govern.remain_time IS '剩余整改时间';
COMMENT ON COLUMN iop_mc_inspect_govern.start_date IS '异常起始日期';
COMMENT ON COLUMN iop_mc_inspect_govern.dept_id IS '巡检计划对应的部门id';
COMMENT ON COLUMN iop_mc_inspect_govern.category_code IS '机器对应的模块编号';
COMMENT ON COLUMN iop_mc_inspect_govern.category_name IS '机器对应的模块名称';
COMMENT ON COLUMN iop_mc_inspect_govern.resource_type IS '资源类型';
COMMENT ON COLUMN iop_mc_inspect_govern.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_govern.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_govern.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_govern.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_govern.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_govern.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_govern.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_govern.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_govern.modify_time IS '修改时间';

-- ------------------------------------------------------------
-- 15. iop_mc_inspect_govern_snapshot（治理快照表）
--     联合主键: check_name + obj_name + host_name + summary_date
--     用途: 每日快照治理进度，用于趋势分析
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_govern_snapshot (
    check_name        VARCHAR(100)   NOT NULL,
    obj_name          VARCHAR(800)   NOT NULL,
    host_name         VARCHAR(200)   NOT NULL,
    summary_date      VARCHAR(80)    NOT NULL,
    ip                VARCHAR(80),
    remain_time       VARCHAR(10),
    start_date        VARCHAR(80),
    dept_id           VARCHAR(30),
    category_code     VARCHAR(100),
    category_name     VARCHAR(500),
    resource_type     VARCHAR(100),
    res1              VARCHAR(800),
    res2              VARCHAR(800),
    res3              VARCHAR(800),
    res4              VARCHAR(800),
    res5              VARCHAR(800),
    creator           VARCHAR(80),
    create_time       TIMESTAMP,
    modifier          VARCHAR(80),
    modify_time       TIMESTAMP,
    CONSTRAINT pk_inspect_govern_snapshot PRIMARY KEY (check_name, obj_name, host_name, summary_date)
);

COMMENT ON TABLE iop_mc_inspect_govern_snapshot IS '治理快照表';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.check_name IS '检查项';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.obj_name IS '检查对象';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.host_name IS '机器名';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.summary_date IS '执行快照统计的日期';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.ip IS 'ip地址';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.remain_time IS '剩余整改时间';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.start_date IS '异常起始日期';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.dept_id IS '巡检计划对应的部门id';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.category_code IS '机器对应的模块编号';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.category_name IS '机器对应的模块名称';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.resource_type IS '资源类型';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_govern_snapshot.modify_time IS '修改时间';

-- ------------------------------------------------------------
-- 16. iop_mc_inspect_summary（巡检运营统计表）
--     主键: sum_id
--     按 部门+模块+层级+资源类型+日期 维度聚合统计
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_summary (
    sum_id                  VARCHAR(17)    NOT NULL,
    plan_dept_id            VARCHAR(30)    NOT NULL,
    category_code           VARCHAR(80)    NOT NULL,
    category_name           VARCHAR(200)   NOT NULL,
    layer                   VARCHAR(20),
    resource_type           VARCHAR(100)   NOT NULL,
    summary_date            VARCHAR(80)    NOT NULL,
    earliest_inspect_time   VARCHAR(80),
    latest_inspect_time     VARCHAR(80),
    actual_target_num       VARCHAR(80),
    tar_num                 VARCHAR(80),
    abnormal_num            VARCHAR(80),
    check_num               VARCHAR(80),
    res1                    VARCHAR(800),
    res2                    VARCHAR(800),
    res3                    VARCHAR(800),
    res4                    VARCHAR(800),
    res5                    VARCHAR(800),
    creator                 VARCHAR(80),
    create_time             TIMESTAMP,
    modifier                VARCHAR(80),
    modify_time             TIMESTAMP,
    CONSTRAINT pk_inspect_summary PRIMARY KEY (sum_id)
);

COMMENT ON TABLE iop_mc_inspect_summary IS '巡检运营统计表';
COMMENT ON COLUMN iop_mc_inspect_summary.sum_id IS '统计id';
COMMENT ON COLUMN iop_mc_inspect_summary.plan_dept_id IS '所属巡检计划的部门id';
COMMENT ON COLUMN iop_mc_inspect_summary.category_code IS '模块code';
COMMENT ON COLUMN iop_mc_inspect_summary.category_name IS '模块名';
COMMENT ON COLUMN iop_mc_inspect_summary.layer IS '层级（01接入层，02业务层，03数据层，04系统层）';
COMMENT ON COLUMN iop_mc_inspect_summary.resource_type IS '资源类型';
COMMENT ON COLUMN iop_mc_inspect_summary.summary_date IS '统计的日期';
COMMENT ON COLUMN iop_mc_inspect_summary.earliest_inspect_time IS '最早执行时间';
COMMENT ON COLUMN iop_mc_inspect_summary.latest_inspect_time IS '最晚执行时间';
COMMENT ON COLUMN iop_mc_inspect_summary.actual_target_num IS '实际执行目标数';
COMMENT ON COLUMN iop_mc_inspect_summary.tar_num IS '应执行目标数';
COMMENT ON COLUMN iop_mc_inspect_summary.abnormal_num IS '异常项数量';
COMMENT ON COLUMN iop_mc_inspect_summary.check_num IS '检查条目数量';
COMMENT ON COLUMN iop_mc_inspect_summary.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_summary.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_summary.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_summary.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_summary.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_summary.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_summary.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_summary.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_summary.modify_time IS '修改时间';

-- ============================================================
-- 六、资源域（1张表）
-- ============================================================

-- ------------------------------------------------------------
-- 17. iop_mc_inspect_resource（机器资源表）
--     主键: resource_ip
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_resource (
    resource_ip       VARCHAR(32)    NOT NULL,
    owner_info        VARCHAR(2000),
    kf_maint_group    VARCHAR(32),
    application_id    VARCHAR(500),
    application_name  VARCHAR(2000),
    res1              VARCHAR(800),
    res2              VARCHAR(800),
    res3              VARCHAR(800),
    res4              VARCHAR(800),
    res5              VARCHAR(800),
    creator           VARCHAR(80),
    create_time       TIMESTAMP,
    modifier          VARCHAR(80),
    modify_time       TIMESTAMP,
    CONSTRAINT pk_inspect_resource PRIMARY KEY (resource_ip)
);

COMMENT ON TABLE iop_mc_inspect_resource IS '机器资源表';
COMMENT ON COLUMN iop_mc_inspect_resource.resource_ip IS '机器IP地址';
COMMENT ON COLUMN iop_mc_inspect_resource.owner_info IS '运维负责人信息';
COMMENT ON COLUMN iop_mc_inspect_resource.kf_maint_group IS '系统维护组';
COMMENT ON COLUMN iop_mc_inspect_resource.application_id IS '模块编号';
COMMENT ON COLUMN iop_mc_inspect_resource.application_name IS '模块名称';
COMMENT ON COLUMN iop_mc_inspect_resource.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_resource.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_resource.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_resource.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_resource.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_resource.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_resource.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_resource.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_resource.modify_time IS '修改时间';

-- ============================================================
-- 七、分类域（1张表）
-- ============================================================

-- ------------------------------------------------------------
-- 18. iop_mc_inspect_category（分类表）
--     主键: category_id
--     树形结构: 操作库 → 条线 → 子分类 → 技术栈叶子节点
--     示例路径: /基础操作库/系统条线/中间件/TongLinkQ
-- ------------------------------------------------------------
CREATE TABLE iop_mc_inspect_category (
    category_id       VARCHAR(80)    NOT NULL,
    category_code     VARCHAR(80),
    category_name     VARCHAR(200)   NOT NULL,
    parent_id         VARCHAR(80),
    category_level    VARCHAR(10),
    sort_order        VARCHAR(10),
    status            VARCHAR(20),
    res1              VARCHAR(800),
    res2              VARCHAR(800),
    res3              VARCHAR(800),
    res4              VARCHAR(800),
    res5              VARCHAR(800),
    creator           VARCHAR(80),
    create_time       TIMESTAMP,
    modifier          VARCHAR(80),
    modify_time       TIMESTAMP,
    CONSTRAINT pk_inspect_category PRIMARY KEY (category_id)
);

COMMENT ON TABLE iop_mc_inspect_category IS '分类表';
COMMENT ON COLUMN iop_mc_inspect_category.category_id IS '分类id';
COMMENT ON COLUMN iop_mc_inspect_category.category_code IS '分类编号';
COMMENT ON COLUMN iop_mc_inspect_category.category_name IS '分类名称';
COMMENT ON COLUMN iop_mc_inspect_category.parent_id IS '父分类id（顶级为空）';
COMMENT ON COLUMN iop_mc_inspect_category.category_level IS '层级（01操作库，02条线，03子分类，04技术栈）';
COMMENT ON COLUMN iop_mc_inspect_category.sort_order IS '排序号';
COMMENT ON COLUMN iop_mc_inspect_category.status IS '状态';
COMMENT ON COLUMN iop_mc_inspect_category.res1 IS '预留字段1';
COMMENT ON COLUMN iop_mc_inspect_category.res2 IS '预留字段2';
COMMENT ON COLUMN iop_mc_inspect_category.res3 IS '预留字段3';
COMMENT ON COLUMN iop_mc_inspect_category.res4 IS '预留字段4';
COMMENT ON COLUMN iop_mc_inspect_category.res5 IS '预留字段5';
COMMENT ON COLUMN iop_mc_inspect_category.creator IS '创建人';
COMMENT ON COLUMN iop_mc_inspect_category.create_time IS '创建时间';
COMMENT ON COLUMN iop_mc_inspect_category.modifier IS '修改人';
COMMENT ON COLUMN iop_mc_inspect_category.modify_time IS '修改时间';
