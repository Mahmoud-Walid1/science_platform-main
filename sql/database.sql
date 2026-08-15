-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS science_platform;
USE science_platform;

-- جدول التجارب
CREATE TABLE experiments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code_name VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    page_url VARCHAR(100) NOT NULL,
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الأكواد
CREATE TABLE access_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    experiment_id INT NOT NULL,
    used TINYINT DEFAULT 0,
    used_at DATETIME NULL,
    used_by_ip VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id)
);

-- جدول سجلات الدخول
CREATE TABLE access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    experiment_id INT NOT NULL,
    access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    status ENUM('success', 'invalid', 'used', 'expired') DEFAULT 'success'
);

-- إدخال التجارب الخمس
INSERT INTO experiments (code_name, title, page_url) VALUES
('matter_states', 'حالات المادة', 'experiments/matter.php'),
('electric_circuits', 'الدوائر الكهربائية', 'experiments/circuits.php'),
('electromagnet', 'المغناطيس الكهربائي', 'experiments/magnet.php'),
('newton_laws', 'قوانين نيوتن للحركة', 'experiments/newton.php'),
('light_prism', 'تحليل الضوء بالمنشور', 'experiments/prism.php');

-- أكواد تجريبية (يمكن تعديلها من لوحة التحكم)
INSERT INTO access_codes (code, experiment_id) VALUES
('SCI-MATTER-001', 1),
('SCI-CIRCUIT-001', 2),
('SCI-MAGNET-001', 3),
('SCI-NEWTON-001', 4),
('SCI-PRISM-001', 5);