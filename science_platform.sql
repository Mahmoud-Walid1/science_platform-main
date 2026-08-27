-- --------------------------------------------------------
-- Database Schema: `science_platform`
-- Fully updated for user account subscriptions, one-time vouchers, academic freeze, & performance indexing.
-- --------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for `system_settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('global_freeze', '0')
ON DUPLICATE KEY UPDATE `setting_key`=`setting_key`;

-- --------------------------------------------------------
-- Table structure for `packages`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_key` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `duration_months` int(11) NOT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `store_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `package_key` (`package_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `packages` (`id`, `package_key`, `name`, `duration_months`, `is_active`, `store_url`) VALUES
(1, 'teacher_classic', 'معلم', 4, 1, NULL),
(2, 'teacher_pro', 'معلم برو', 12, 1, NULL)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- --------------------------------------------------------
-- Table structure for `user_subscriptions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `package_id` int(11) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_frozen` tinyint(4) NOT NULL DEFAULT 0 COMMENT '1=مجمد, 0=نشط',
  `frozen_days_remaining` int(11) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'active, frozen, cancelled, expired',
  `admin_message` text DEFAULT NULL COMMENT 'رسالة الأدمن المخصصة للمعلم',
  `message_show_once` tinyint(4) DEFAULT 1 COMMENT '1=عدم التكرار بعد العرض',
  `message_read` tinyint(4) DEFAULT 0 COMMENT '1=تمت القراءة والعرض',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  KEY `fk_sub_package` (`package_id`),
  CONSTRAINT `fk_sub_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for `teachers`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for `access_codes`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `access_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(30) NOT NULL,
  `package_id` int(11) NOT NULL,
  `is_active` tinyint(4) DEFAULT 1 COMMENT '1=فعال, 0=معطل',
  `is_used` tinyint(4) DEFAULT 0 COMMENT '0=غير مستخدم, 1=تم الشحن',
  `used_by_user_id` int(11) DEFAULT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code_lookup` (`code`, `is_used`, `is_active`),
  KEY `fk_access_codes_package` (`package_id`),
  CONSTRAINT `fk_access_codes_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for `experiments`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `experiments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code_name` varchar(50) NOT NULL,
  `title` varchar(100) NOT NULL,
  `page_url` varchar(100) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1 COMMENT '1=نشطة, 0=معطلة, 2=قيد التنفيذ/قريباً',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_name` (`code_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `experiments` (`id`, `code_name`, `title`, `page_url`, `is_active`) VALUES
(1, 'matter_states', 'حالات المادة', 'experiments/matter.php', 1),
(2, 'electric_circuits', 'الدوائر الكهربائية', 'experiments/circuits.php', 1),
(3, 'electromagnet', 'المغناطيس الكهربائي', 'experiments/magnet.php', 1),
(4, 'newton_laws', 'قوانين نيوتن للحركة', 'experiments/newton.php', 1),
(5, 'light_prism', 'تحليل الضوء بالمنشور', 'experiments/prism.php', 1),
(6, 'mixture_separation', 'فصل المخاليط', 'experiments/separation_v2.php', 1),
(7, 'ph_measurement', 'قياس الأس الهيدروجيني (pH)', 'experiments/ph_v2.php', 1)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- --------------------------------------------------------
-- Table structure for `access_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `access_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(30) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `access_time` datetime DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'success',
  PRIMARY KEY (`id`),
  KEY `idx_access_logs_user` (`user_id`),
  KEY `idx_access_logs_time` (`access_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for `admin_users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `admin_users` (`id`, `username`, `password_hash`) VALUES
(1, 'admin', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1z7U9kZ64hE6U3Dk7sVn1jJ2O4J66/i')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- --------------------------------------------------------
-- Table structure for `visitors`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `visitors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `first_visit` datetime NOT NULL,
  `last_visit` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_visitor_session` (`session_id`),
  KEY `idx_visitor_date` (`first_visit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;
