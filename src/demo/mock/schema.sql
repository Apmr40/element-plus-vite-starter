-- 应用配置巡检系统数据库设计
-- 创建时间: 2026-01-XX
-- 作者: Apmr40

-- ============================================
-- 1. 规则配置表
-- ============================================
CREATE TABLE `rule_config` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '规则ID',
  `name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `tech_stack` JSON COMMENT '技术栈列表 ["java","python","go","nodejs"]',
  `tags` JSON COMMENT '标签列表 ["security","performance","standard"]',
  `status` ENUM('enabled', 'disabled') DEFAULT 'disabled' COMMENT '状态',
  `version` VARCHAR(20) DEFAULT 'V1.0' COMMENT '版本号',
  `description` TEXT COMMENT '规则描述',
  `config` JSON COMMENT '规则配置 {type, fields, logic}',
  `has_association` TINYINT(1) DEFAULT 0 COMMENT '是否有关联任务',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_tech_stack` ((CAST(`tech_stack` AS CHAR(100) ARRAY)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规则配置表';

-- ============================================
-- 2. 巡检结果表
-- ============================================
CREATE TABLE `inspection_result` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '巡检ID',
  `app_name` VARCHAR(100) NOT NULL COMMENT '应用名称',
  `tech_stack` VARCHAR(50) NOT NULL COMMENT '技术栈',
  `inspected_at` DATETIME NOT NULL COMMENT '巡检时间',
  `compliant` INT DEFAULT 0 COMMENT '合规数量',
  `non_compliant` INT DEFAULT 0 COMMENT '不合规数量',
  `status` ENUM('compliant', 'non-compliant') DEFAULT 'compliant' COMMENT '状态',
  `compliance_rate` DECIMAL(5,2) DEFAULT 100.00 COMMENT '合规率',
  `data_source` VARCHAR(255) COMMENT '数据源文件',
  `rule_version` VARCHAR(20) COMMENT '规则版本',
  `deadline_remaining` VARCHAR(50) COMMENT '整改时效',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_app_name` (`app_name`),
  INDEX `idx_tech_stack` (`tech_stack`),
  INDEX `idx_status` (`status`),
  INDEX `idx_inspected_at` (`inspected_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='巡检结果表';

-- ============================================
-- 3. 巡检检查项表
-- ============================================
CREATE TABLE `inspection_check` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '检查项ID',
  `inspection_id` VARCHAR(32) NOT NULL COMMENT '巡检结果ID',
  `rule_name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `rule_version` VARCHAR(20) COMMENT '规则版本',
  `status` ENUM('passed', 'failed') DEFAULT 'passed' COMMENT '状态',
  `reason` TEXT COMMENT '原因',
  `data_source` VARCHAR(255) COMMENT '数据源文件',
  `current_value` VARCHAR(255) COMMENT '当前值',
  `require_value` VARCHAR(255) COMMENT '要求值',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_inspection_id` (`inspection_id`),
  FOREIGN KEY (`inspection_id`) REFERENCES `inspection_result`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='巡检检查项表';

-- ============================================
-- 4. 不合规项表
-- ============================================
CREATE TABLE `non_compliant_item` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '不合规项ID',
  `inspection_id` VARCHAR(32) NOT NULL COMMENT '巡检结果ID',
  `instance_id` VARCHAR(100) NOT NULL COMMENT '实例ID',
  `rule_name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `rule_version` VARCHAR(20) COMMENT '规则版本',
  `reason` TEXT NOT NULL COMMENT '不合规原因',
  `risk_level` ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '风险等级',
  `data_source` VARCHAR(255) COMMENT '数据源文件',
  `current_value` VARCHAR(255) COMMENT '当前值',
  `require_value` VARCHAR(255) COMMENT '要求值',
  `deadline_remaining` VARCHAR(50) COMMENT '剩余时效',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_inspection_id` (`inspection_id`),
  INDEX `idx_risk_level` (`risk_level`),
  FOREIGN KEY (`inspection_id`) REFERENCES `inspection_result`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='不合规项表';

-- ============================================
-- 5. 整改工单表
-- ============================================
CREATE TABLE `rectification_order` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '工单ID',
  `app_name` VARCHAR(100) NOT NULL COMMENT '应用名称',
  `non_compliant_item` VARCHAR(255) NOT NULL COMMENT '不合规项',
  `risk_level` ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '风险等级',
  `remaining_time_ms` BIGINT DEFAULT 0 COMMENT '剩余时效(毫秒)',
  `status` ENUM('pending-confirm', 'pending-rectify', 'pending-review', 'closed', 'rejected') 
    DEFAULT 'pending-confirm' COMMENT '状态',
  `handler` VARCHAR(100) COMMENT '处理人',
  `rule_name` VARCHAR(100) COMMENT '规则名称',
  `check_item` VARCHAR(255) COMMENT '检查项',
  `reason` TEXT COMMENT '不合规原因',
  `instance_id` VARCHAR(100) COMMENT '实例ID',
  `data_source` VARCHAR(255) COMMENT '数据源',
  `tech_stack` VARCHAR(50) COMMENT '技术栈',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_app_name` (`app_name`),
  INDEX `idx_status` (`status`),
  INDEX `idx_risk_level` (`risk_level`),
  INDEX `idx_handler` (`handler`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='整改工单表';

-- ============================================
-- 6. 工单处理记录表
-- ============================================
CREATE TABLE `order_history` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '记录ID',
  `order_id` VARCHAR(32) NOT NULL COMMENT '工单ID',
  `time` DATETIME NOT NULL COMMENT '操作时间',
  `content` TEXT NOT NULL COMMENT '操作内容',
  `user` VARCHAR(100) NOT NULL COMMENT '操作人',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_order_id` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `rectification_order`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单处理记录表';

-- ============================================
-- 7. 角色表
-- ============================================
CREATE TABLE `role` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '角色ID',
  `name` VARCHAR(100) NOT NULL COMMENT '角色名称',
  `type` ENUM('superadmin', 'tech-admin', 'one-line-admin', 'two-line-admin', 'custom') 
    DEFAULT 'custom' COMMENT '角色类型',
  `description` TEXT COMMENT '角色描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- ============================================
-- 8. 角色权限表
-- ============================================
CREATE TABLE `role_permission` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '权限ID',
  `role_id` VARCHAR(32) NOT NULL COMMENT '角色ID',
  `rule_permissions` JSON COMMENT '规则权限 ["view","create","edit","delete"]',
  `inspection_permissions` JSON COMMENT '巡检权限 ["view","export"]',
  `order_permissions` JSON COMMENT '工单权限 ["view","handle","create"]',
  `system_permissions` JSON COMMENT '系统权限 ["role","config","audit"]',
  `tech_stack_scope` JSON COMMENT '技术栈范围 ["java","python"] 或 ["all"]',
  `app_scope` JSON COMMENT '应用范围 ["app-a","app-b"] 或 ["all"]',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_role_id` (`role_id`),
  FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限表';

-- ============================================
-- 9. 用户表
-- ============================================
CREATE TABLE `user` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '用户名称',
  `email` VARCHAR(100) COMMENT '邮箱',
  `department` VARCHAR(100) COMMENT '部门',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================
-- 10. 用户角色关联表
-- ============================================
CREATE TABLE `user_role` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '关联ID',
  `user_id` VARCHAR(32) NOT NULL COMMENT '用户ID',
  `role_id` VARCHAR(32) NOT NULL COMMENT '角色ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_role_id` (`role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- ============================================
-- 11. CSV 文件上传记录表
-- ============================================
CREATE TABLE `uploaded_file` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '文件ID',
  `original_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
  `file_name` VARCHAR(255) NOT NULL COMMENT '存储文件名',
  `size` BIGINT NOT NULL COMMENT '文件大小(字节)',
  `columns` JSON COMMENT '列名列表',
  `rows` INT NOT NULL COMMENT '行数',
  `alias` VARCHAR(100) COMMENT '别名',
  `expanded` TINYINT(1) DEFAULT 0 COMMENT '是否展开',
  `status` ENUM('uploading', 'success', 'error') DEFAULT 'uploading' COMMENT '状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='CSV文件上传记录表';

-- ============================================
-- 12. 测试结果表
-- ============================================
CREATE TABLE `test_result` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '测试结果ID',
  `rule_id` VARCHAR(32) COMMENT '规则ID',
  `passed` INT DEFAULT 0 COMMENT '通过数量',
  `total` INT DEFAULT 0 COMMENT '总数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rule_id` (`rule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='测试结果表';

-- ============================================
-- 13. 测试结果详情表
-- ============================================
CREATE TABLE `test_result_detail` (
  `id` VARCHAR(32) PRIMARY KEY COMMENT '详情ID',
  `test_result_id` VARCHAR(32) NOT NULL COMMENT '测试结果ID',
  `rule_name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `status` ENUM('pass', 'fail') DEFAULT 'pass' COMMENT '状态',
  `message` TEXT COMMENT '详情信息',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_test_result_id` (`test_result_id`),
  FOREIGN KEY (`test_result_id`) REFERENCES `test_result`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='测试结果详情表';
