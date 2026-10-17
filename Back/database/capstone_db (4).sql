-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 17, 2026 at 09:40 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `capstone_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `budget_categories`
--

CREATE TABLE `budget_categories` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `spent_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `budget_categories`
--

INSERT INTO `budget_categories` (`id`, `name`, `percentage`, `allocated_amount`, `spent_amount`, `created_at`) VALUES
(1, 'Category 1', 55.00, 12361332.50, 44125.00, '2026-10-13 09:33:21'),
(2, 'Category 2', 20.00, 4495030.00, 10000.00, '2026-10-13 09:33:21'),
(3, 'Category 3', 10.00, 2247515.00, 0.00, '2026-10-13 09:33:21'),
(4, 'Category 4', 5.00, 1123757.50, 0.00, '2026-10-13 09:33:21'),
(5, 'Category 5', 5.00, 1123757.50, 432123.00, '2026-10-13 09:33:21'),
(6, 'Category 6', 5.00, 1123757.50, 0.00, '2026-10-13 09:33:21');

-- --------------------------------------------------------

--
-- Table structure for table `budget_subcategories`
--

CREATE TABLE `budget_subcategories` (
  `id` bigint UNSIGNED NOT NULL,
  `category_id` int UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL,
  `spent_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `budget_subcategories`
--

INSERT INTO `budget_subcategories` (`id`, `category_id`, `name`, `allocated_amount`, `spent_amount`, `created_at`) VALUES
(1, 1, 'kagawad salary', 45000.00, 44000.00, '2026-10-13 09:40:40'),
(2, 2, 'SK Honoraria', 15000.00, 10000.00, '2026-10-15 02:23:08');

-- --------------------------------------------------------

--
-- Table structure for table `expenditures`
--

CREATE TABLE `expenditures` (
  `id` int UNSIGNED NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `fund_allocation` varchar(100) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `category_id` int UNSIGNED DEFAULT NULL,
  `subcategory_id` bigint UNSIGNED DEFAULT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_mime` varchar(100) DEFAULT NULL,
  `attachment_size` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `expenditures`
--

INSERT INTO `expenditures` (`id`, `amount`, `description`, `fund_allocation`, `created_by`, `created_at`, `category_id`, `subcategory_id`) VALUES
(1, 250.00, 'City Hall', 'Bongbong marcos', 14, '2026-10-02 12:34:51', NULL, NULL),
(2, 2750.00, 'Gastos para sa baon ni dayan', 'Hehe', 14, '2026-10-02 12:56:41', NULL, NULL),
(3, 3570.00, 'Gastos para sa baon ni dayan 2', 'hehe', 14, '2026-10-02 12:57:17', NULL, NULL),
(4, 25000.00, 'fdsafdafads', NULL, 14, '2026-10-13 09:41:02', 1, 1),
(5, 5500.00, 'fdasfdas', NULL, 14, '2026-10-13 09:44:14', 1, 1),
(6, 125.00, 'ghugu', NULL, 26, '2026-10-14 16:34:54', 1, NULL),
(7, 5555.00, 'retr', NULL, 26, '2026-10-14 16:35:53', 1, 1),
(8, 3424.00, 'fsafd', NULL, 26, '2026-10-14 17:12:35', 1, 1),
(9, 3424.00, 'fsafd', NULL, 26, '2026-10-14 17:12:44', 1, 1),
(10, 432123.00, 'fdasa', NULL, 26, '2026-10-14 17:13:19', 5, NULL),
(11, 500.00, 'fdadfa', NULL, 26, '2026-10-14 17:15:32', 1, 1),
(12, 597.00, 'Kagawad salary again', NULL, 14, '2026-10-14 17:18:45', 1, 1),
(13, 10000.00, 'fdafdafda', NULL, 14, '2026-10-15 02:24:33', 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `fund_balances`
--

CREATE TABLE `fund_balances` (
  `id` int NOT NULL,
  `fund_name` varchar(100) NOT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `fund_balances`
--

INSERT INTO `fund_balances` (`id`, `fund_name`, `balance`) VALUES
(1, 'fdsafdsa', 27500.00),
(2, 'fdsaf', 15645.00),
(3, 'BBM Scholarship Program', 123.00),
(4, 'Bongbong marcos', 750.00),
(5, 'hehe', 3680.00);

-- --------------------------------------------------------

--
-- Table structure for table `invite_codes`
--

CREATE TABLE `invite_codes` (
  `id` int NOT NULL,
  `code` varchar(20) NOT NULL,
  `role` enum('staff','treasurer','admin') NOT NULL DEFAULT 'staff',
  `recipient_email` varchar(255) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `delivery_status` enum('pending','sent','failed') NOT NULL DEFAULT 'sent',
  `sent_at` datetime DEFAULT NULL,
  `failed_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `used_by` int DEFAULT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `invite_codes`
--

INSERT INTO `invite_codes` (`id`, `code`, `role`, `recipient_email`, `expires_at`, `delivery_status`, `sent_at`, `failed_at`, `created_by`, `used_by`, `used_at`, `created_at`) VALUES
(24, 'SAL1-CF28-1C02', 'staff', NULL, '2026-10-16 10:09:54', 'sent', NULL, NULL, 14, 30, '2026-10-15 10:12:48', '2026-10-15 10:09:54');

-- --------------------------------------------------------

--
-- Table structure for table `revenues`
--

CREATE TABLE `revenues` (
  `id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `source` varchar(100) NOT NULL,
  `fund_allocation` varchar(100) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `request_key` char(36) DEFAULT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_mime` varchar(100) DEFAULT NULL,
  `attachment_size` int UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `revenues`
--

INSERT INTO `revenues` (`id`, `amount`, `source`, `fund_allocation`, `created_by`, `created_at`, `request_key`) VALUES
(1, 2500.00, 'City Hall', 'fdsafdsa', 14, '2026-09-30 20:39:55', NULL),
(2, 25000.00, 'City Hall', 'fdsafdsa', 14, '2026-09-30 20:40:35', NULL),
(3, 15645.00, 'City Hall', 'fdsaf', 14, '2026-09-30 20:50:55', NULL),
(4, 123.00, 'car', 'BBM Scholarship Program', 14, '2026-09-30 21:04:40', NULL),
(5, 1000.00, 'Sourcesogon', 'Bongbong marcos', 14, '2026-10-01 14:39:09', NULL),
(6, 500.00, 'baon ko', NULL, 24, '2026-10-01 14:39:54', NULL),
(7, 10000.00, 'baon ni dayan', 'hehe', 22, '2026-10-01 14:40:32', NULL),
(8, 25000.00, 'DFASFDA', NULL, 14, '2026-10-13 09:33:40', '518255e6-ac44-4e55-b305-915210b5c1dd'),
(9, 450000.00, 'City Hall', NULL, 14, '2026-10-13 09:39:40', '52190f7f-95a3-4c49-9442-5e9ce93248ac'),
(10, 22000000.00, 'City Hall', NULL, 14, '2026-10-14 10:11:05', 'b1f0a6e1-b4fa-4efb-b177-c39129e3addd'),
(11, 150.00, 'hjkhjk', NULL, 26, '2026-10-14 16:35:20', 'a126ae41-e266-4388-a54a-6f718d6ca0ce');

-- --------------------------------------------------------

--
-- Table structure for table `revenue_allocations`
--

CREATE TABLE `revenue_allocations` (
  `id` bigint UNSIGNED NOT NULL,
  `revenue_id` int NOT NULL,
  `category_id` int UNSIGNED NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `revenue_allocations`
--

INSERT INTO `revenue_allocations` (`id`, `revenue_id`, `category_id`, `amount`, `created_at`) VALUES
(1, 8, 1, 13750.00, '2026-10-13 09:33:40'),
(2, 8, 2, 5000.00, '2026-10-13 09:33:40'),
(3, 8, 3, 2500.00, '2026-10-13 09:33:40'),
(4, 8, 4, 1250.00, '2026-10-13 09:33:40'),
(5, 8, 5, 1250.00, '2026-10-13 09:33:40'),
(6, 8, 6, 1250.00, '2026-10-13 09:33:40'),
(7, 9, 1, 247500.00, '2026-10-13 09:39:40'),
(8, 9, 2, 90000.00, '2026-10-13 09:39:40'),
(9, 9, 3, 45000.00, '2026-10-13 09:39:40'),
(10, 9, 4, 22500.00, '2026-10-13 09:39:40'),
(11, 9, 5, 22500.00, '2026-10-13 09:39:40'),
(12, 9, 6, 22500.00, '2026-10-13 09:39:40'),
(13, 10, 1, 12100000.00, '2026-10-14 10:11:05'),
(14, 10, 2, 4400000.00, '2026-10-14 10:11:05'),
(15, 10, 3, 2200000.00, '2026-10-14 10:11:05'),
(16, 10, 4, 1100000.00, '2026-10-14 10:11:05'),
(17, 10, 5, 1100000.00, '2026-10-14 10:11:05'),
(18, 10, 6, 1100000.00, '2026-10-14 10:11:05'),
(19, 11, 1, 82.50, '2026-10-14 16:35:20'),
(20, 11, 2, 30.00, '2026-10-14 16:35:20'),
(21, 11, 3, 15.00, '2026-10-14 16:35:20'),
(22, 11, 4, 7.50, '2026-10-14 16:35:20'),
(23, 11, 5, 7.50, '2026-10-14 16:35:20'),
(24, 11, 6, 7.50, '2026-10-14 16:35:20');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `role` enum('staff','treasurer','admin') NOT NULL DEFAULT 'staff',
  `status` enum('pending','active','rejected') NOT NULL DEFAULT 'active',
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `role`, `status`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES
(14, 'Jierumie_12345', 'geromeemmanuel.param@cvsu.edu.ph', '$2y$10$Qel3GTp.o8IV8d3Dwu6MIuouuBKoXM4JOTUdlCRJR3BRerKYFt.5y', 'Gerome', 'Lovato', 'admin', 'active', NULL, NULL, '2026-10-01 01:28:51', '2026-10-01 21:03:32'),
(22, 'dayanajin3', 'dayanajin@gmail.com', '$2y$10$B8WLmC4C7TsrbVtfeG72I.NPaXom4xXdkfm6aJnbshJw4GKh91E0e', 'Dayana', 'Jin', 'treasurer', 'active', 21, '2026-10-01 19:52:57', '2026-10-01 19:52:52', '2026-10-01 21:34:29'),
(24, 'Miaka18', 'miakamae18@gmail.com', '$2y$10$d1oE9TabdPVNkGYvLCjxdOGpJBaEHPy8uDEQtqjHNq9LcedaRwJXW', 'Miaka', 'Mae', 'staff', 'active', 22, '2026-10-01 20:33:37', '2026-10-01 20:32:59', '2026-10-01 20:33:37'),
(26, 'MariahCarey123', 'param.geromeemmanuel092405@gmail.com', '$2y$10$XfUS9fgWDj5.aUrPtZmSMesbOH6HQ.xo1gs2EBaDl38w2IKDJ394S', 'Mariah', 'Carey', 'staff', 'active', 14, '2026-10-15 00:33:53', '2026-10-15 00:33:31', '2026-10-15 00:33:53'),
(30, 'Gerome123', 'paramgeromeemannuel@gmail.com', '$2y$10$tHTUpvzkLZrM6R3jSptscOWaGRD7kuK3PHhb6wJdSTAi57tZrMpai', 'Gerome', 'Emmanuel', 'staff', 'active', 14, '2026-10-15 10:13:10', '2026-10-15 10:12:48', '2026-10-15 10:13:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `budget_categories`
--
ALTER TABLE `budget_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `budget_subcategories`
--
ALTER TABLE `budget_subcategories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_subcategory` (`category_id`,`name`);

--
-- Indexes for table `expenditures`
--
ALTER TABLE `expenditures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expenditures_created_at` (`created_at`);

--
-- Indexes for table `fund_balances`
--
ALTER TABLE `fund_balances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `fund_name` (`fund_name`);

--
-- Indexes for table `invite_codes`
--
ALTER TABLE `invite_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_invite_codes_recipient` (`recipient_email`),
  ADD KEY `idx_invite_codes_status` (`delivery_status`,`expires_at`,`used_by`);

--
-- Indexes for table `revenues`
--
ALTER TABLE `revenues`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_revenue_request_key` (`request_key`),
  ADD KEY `fk_revenues_created_by` (`created_by`);

--
-- Indexes for table `revenue_allocations`
--
ALTER TABLE `revenue_allocations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_revenue_category` (`revenue_id`,`category_id`),
  ADD KEY `fk_revenue_allocations_category` (`category_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `budget_categories`
--
ALTER TABLE `budget_categories`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `budget_subcategories`
--
ALTER TABLE `budget_subcategories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `expenditures`
--
ALTER TABLE `expenditures`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `fund_balances`
--
ALTER TABLE `fund_balances`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `invite_codes`
--
ALTER TABLE `invite_codes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `revenues`
--
ALTER TABLE `revenues`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `revenue_allocations`
--
ALTER TABLE `revenue_allocations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `budget_subcategories`
--
ALTER TABLE `budget_subcategories`
  ADD CONSTRAINT `fk_budget_subcategories_category` FOREIGN KEY (`category_id`) REFERENCES `budget_categories` (`id`);

--
-- Constraints for table `revenues`
--
ALTER TABLE `revenues`
  ADD CONSTRAINT `fk_revenues_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `revenue_allocations`
--
ALTER TABLE `revenue_allocations`
  ADD CONSTRAINT `fk_revenue_allocations_category` FOREIGN KEY (`category_id`) REFERENCES `budget_categories` (`id`),
  ADD CONSTRAINT `fk_revenue_allocations_revenue` FOREIGN KEY (`revenue_id`) REFERENCES `revenues` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
