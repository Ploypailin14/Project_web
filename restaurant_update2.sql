-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Sep 03, 2026 at 08:26 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `restaurant_update2`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin') NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`username`, `password`, `role`) VALUES
('admin', '$argon2id$v=19$m=19456,t=2,p=1$GfhzjqPSzrbl7uE/m0NKaw$zmvsX6vZ5WJdVawAr01hgloXT8zbaQG6SsHyJjAzbhI', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `cook`
--

CREATE TABLE `cook` (
  `cook_id` int(11) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `role` enum('cook') NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cook`
--

INSERT INTO `cook` (`cook_id`, `password`, `status`, `role`) VALUES
(1, '$2b$10$R.Y/MRq1/V3GTZ/ECa8cr.LxNeP/bSxaSVJ6BLsQEA5tBP1/USAJi', 'active', 'cook');

-- --------------------------------------------------------

--
-- Table structure for table `customer_session`
--

CREATE TABLE `customer_session` (
  `customer_id` int(11) NOT NULL,
  `table_id` int(11) NOT NULL,
  `login_time` datetime DEFAULT current_timestamp(),
  `status` enum('active','closed') DEFAULT 'active'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer_session`
--

INSERT INTO `customer_session` (`customer_id`, `table_id`, `login_time`, `status`) VALUES
(1, 10, '2026-03-29 22:10:44', ''),
(2, 10, '2026-03-29 22:15:24', 'active'),
(3, 15, '2026-03-29 22:15:33', 'active'),
(4, 15, '2026-03-30 00:27:19', 'active'),
(5, 15, '2026-03-30 00:29:11', 'active'),
(6, 15, '2026-09-04 00:08:51', 'active'),
(7, 10, '2026-09-04 00:09:11', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `menu_item`
--

CREATE TABLE `menu_item` (
  `menu_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` enum('food','dessert','drink','snack') NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('available','unavailable') DEFAULT 'available',
  `image` varchar(511) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_item`
--

INSERT INTO `menu_item` (`menu_id`, `name`, `description`, `category`, `price`, `status`, `image`) VALUES
(1, 'ต้มยำกุ้งน้ำข้น', 'soup', 'food', 120.50, 'available', 'https://www.ajinomoto.co.th/storage/photos/shares/Recipe/Menu/3-13Stirfriedkale/61a8f1623ee0a.jpg'),
(2, 'ต้มยำกุ้งน้ำข้น', 'soup', 'food', 120.50, 'available', 'jpg');

-- --------------------------------------------------------

--
-- Table structure for table `order_item`
--

CREATE TABLE `order_item` (
  `order_item_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `detail` text DEFAULT NULL,
  `extra` text DEFAULT NULL,
  `extra_price` decimal(10,2) DEFAULT 0.00,
  `customer_id` int(11) NOT NULL,
  `order_id` varchar(100) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_item`
--

INSERT INTO `order_item` (`order_item_id`, `menu_id`, `quantity`, `detail`, `extra`, `extra_price`, `customer_id`, `order_id`) VALUES
(5, 1, 1, '', '', 0.00, 0, '5'),
(6, 1, 2, NULL, NULL, 0.00, 1, '999'),
(7, 2, 1, NULL, NULL, 0.00, 1, '999'),
(8, 1, 1, '-', '', 0.00, 7, '1000'),
(9, 1, 1, '-', '', 0.00, 7, '1001');

-- --------------------------------------------------------

--
-- Table structure for table `order_table`
--

CREATE TABLE `order_table` (
  `customer_id` int(11) NOT NULL,
  `cook_id` int(11) DEFAULT NULL,
  `order_time` datetime DEFAULT current_timestamp(),
  `status` enum('pending','cooking','served','paid','cancel') DEFAULT 'pending',
  `custom_total` decimal(10,2) DEFAULT NULL,
  `order_id` int(100) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_table`
--

INSERT INTO `order_table` (`customer_id`, `cook_id`, `order_time`, `status`, `custom_total`, `order_id`) VALUES
(1, NULL, '2026-03-30 00:29:37', 'served', NULL, 5),
(1, NULL, '2026-03-31 05:23:56', 'served', NULL, 999),
(7, NULL, '2026-09-04 00:10:24', 'pending', NULL, 1000),
(7, NULL, '2026-09-04 01:18:59', 'pending', NULL, 1001);

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `payment_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` datetime DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`payment_id`, `order_id`, `amount`, `payment_date`) VALUES
(1, 5, 40.00, '2026-03-30 00:53:56');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_table`
--

CREATE TABLE `restaurant_table` (
  `table_id` int(11) NOT NULL,
  `table_number` int(11) NOT NULL,
  `status` enum('available','occupied') DEFAULT 'available'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `restaurant_table`
--

INSERT INTO `restaurant_table` (`table_id`, `table_number`, `status`) VALUES
(1, 1, 'available'),
(2, 2, 'available'),
(3, 3, 'available'),
(4, 4, 'available'),
(5, 5, 'available'),
(6, 6, 'available'),
(7, 7, 'available'),
(8, 8, 'available'),
(9, 9, 'available'),
(10, 10, 'occupied'),
(11, 11, 'available'),
(12, 12, 'available'),
(13, 13, 'available'),
(14, 14, 'available'),
(15, 15, 'occupied');

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

CREATE TABLE `review` (
  `review_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `rating` float DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `review_time` datetime DEFAULT current_timestamp(),
  `is_hidden` tinyint(1) DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `review`
--

INSERT INTO `review` (`review_id`, `order_id`, `rating`, `comment`, `review_time`, `is_hidden`) VALUES
(1, 5, 5, 'ลำขนาด', '2026-03-30 01:04:46', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `cook`
--
ALTER TABLE `cook`
  ADD PRIMARY KEY (`cook_id`);

--
-- Indexes for table `customer_session`
--
ALTER TABLE `customer_session`
  ADD PRIMARY KEY (`customer_id`),
  ADD KEY `table_id` (`table_id`);

--
-- Indexes for table `menu_item`
--
ALTER TABLE `menu_item`
  ADD PRIMARY KEY (`menu_id`);

--
-- Indexes for table `order_item`
--
ALTER TABLE `order_item`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `menu_id` (`menu_id`),
  ADD KEY `customer_id` (`customer_id`) USING BTREE,
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `order_table`
--
ALTER TABLE `order_table`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `cook_id` (`cook_id`),
  ADD KEY `customer_id` (`customer_id`) USING BTREE;

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD UNIQUE KEY `order_id` (`order_id`);

--
-- Indexes for table `restaurant_table`
--
ALTER TABLE `restaurant_table`
  ADD PRIMARY KEY (`table_id`);

--
-- Indexes for table `review`
--
ALTER TABLE `review`
  ADD PRIMARY KEY (`review_id`),
  ADD UNIQUE KEY `order_id` (`order_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cook`
--
ALTER TABLE `cook`
  MODIFY `cook_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customer_session`
--
ALTER TABLE `customer_session`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `menu_item`
--
ALTER TABLE `menu_item`
  MODIFY `menu_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_item`
--
ALTER TABLE `order_item`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `order_table`
--
ALTER TABLE `order_table`
  MODIFY `order_id` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1002;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `restaurant_table`
--
ALTER TABLE `restaurant_table`
  MODIFY `table_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `review`
--
ALTER TABLE `review`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
