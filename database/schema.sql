-- ============================================
-- KAMDHENU TRADING - DATABASE SCHEMA
-- Run this in phpMyAdmin or MySQL CLI
-- ============================================

CREATE DATABASE IF NOT EXISTS kamdhenu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kamdhenu_db;

-- Users / Firms
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firm_name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders (Vikri / Sales)
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_no VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    org_name VARCHAR(200) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    credit_date DATE,
    amount_credited DECIMAL(12,2) DEFAULT 0,
    tds_cut DECIMAL(12,2) DEFAULT 0,
    status ENUM('pending','partial','credited') DEFAULT 'pending',
    bill_path VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Kharidi (Purchases linked to orders)
CREATE TABLE kharidi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    paid_by VARCHAR(150) NOT NULL,
    vendor_name VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_kharidi_order ON kharidi(order_id);
CREATE INDEX idx_kharidi_user ON kharidi(user_id);
