-- phpMyAdmin SQL Dump
-- version 4.5.1
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Jul 29, 2018 at 06:48 PM
-- Server version: 10.1.13-MariaDB
-- PHP Version: 7.0.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `waiter`
--
CREATE DATABASE IF NOT EXISTS `waitr` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `waitr`;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `categoryId` varchar(11) NOT NULL,
  `menuId` varchar(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` varchar(50) NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `active` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `categories`:
--   `menuId`
--       `menus` -> `menuId`
--

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `itemId` varchar(11) NOT NULL,
  `categoryId` varchar(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` varchar(500) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `items`:
--   `categoryId`
--       `categories` -> `categoryId`
--

-- --------------------------------------------------------

--
-- Table structure for table `menus`
--

CREATE TABLE `menus` (
  `menuId` varchar(11) NOT NULL,
  `name` varchar(20) NOT NULL,
  `restaurantId` varchar(11) NOT NULL,
  `daysOpen` varchar(15) NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  `openingTime` time NOT NULL DEFAULT '06:00:00',
  `closingTime` time NOT NULL DEFAULT '00:00:00',
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `menus`:
--   `restaurantId`
--       `restaurants` -> `restaurantId`
--

-- --------------------------------------------------------

--
-- Table structure for table `orderitems`
--

CREATE TABLE `orderitems` (
  `Id` int(11) NOT NULL,
  `itemId` varchar(11) NOT NULL,
  `orderId` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `orderitems`:
--   `itemId`
--       `items` -> `itemId`
--   `orderId`
--       `orders` -> `orderId`
--

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `orderId` varchar(100) NOT NULL,
  `customerId` varchar(11) NOT NULL,
  `restaurantId` varchar(11) NOT NULL,
  `tableNo` int(11) NOT NULL DEFAULT '0',
  `price` decimal(10,2) NOT NULL,
  `status` int(9) NOT NULL DEFAULT '100',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `orders`:
--   `customerId`
--       `users` -> `userId`
--   `restaurantId`
--       `restaurants` -> `restaurantId`
--

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `orderId` varchar(50) NOT NULL,
  `chargeId` varchar(200) NOT NULL,
  `source` varchar(200) NOT NULL,
  `destination` varchar(200) NOT NULL,
  `amount` int(9) NOT NULL,
  `currency` varchar(20) NOT NULL,
  `customerEmail` varchar(200) NOT NULL,
  `paid` tinyint(4) NOT NULL DEFAULT '0',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `payments`:
--   `orderId`
--       `orders` -> `orderId`
--

-- --------------------------------------------------------

--
-- Table structure for table `refunds`
--

CREATE TABLE `refunds` (
  `id` int(11) NOT NULL,
  `refundId` varchar(200) NOT NULL,
  `chargeId` varchar(200) NOT NULL,
  `amount` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `refunds`:
--   `chargeId`
--       `payments` -> `chargeId`
--

-- --------------------------------------------------------

--
-- Table structure for table `restaurantdetails`
--

CREATE TABLE `restaurantdetails` (
  `id` int(11) NOT NULL,
  `restaurantId` varchar(100) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` varchar(200) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `restaurantdetails`:
--   `restaurantId`
--       `restaurants` -> `restaurantId`
--

-- --------------------------------------------------------

--
-- Table structure for table `restaurantdetailspayment`
--

CREATE TABLE `restaurantdetailspayment` (
  `id` int(11) NOT NULL,
  `restaurantId` varchar(100) NOT NULL,
  `stripeAccountId` varchar(200) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'GBP',
  `hasProvidedDetails` tinyint(4) NOT NULL DEFAULT '0',
  `isVerified` tinyint(4) NOT NULL DEFAULT '0',
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `restaurantdetailspayment`:
--   `restaurantId`
--       `restaurants` -> `restaurantId`
--

-- --------------------------------------------------------

--
-- Table structure for table `restaurants`
--

CREATE TABLE `restaurants` (
  `restaurantId` varchar(11) NOT NULL,
  `ownerId` varchar(11) NOT NULL,
  `name` varchar(70) NOT NULL,
  `description` varchar(140) NOT NULL,
  `location` varchar(200) NOT NULL,
  `phoneNumber` varchar(15) NOT NULL,
  `emailAddress` varchar(50) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `active` tinyint(4) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `restaurants`:
--   `ownerId`
--       `users` -> `userId`
--

-- --------------------------------------------------------

--
-- Table structure for table `socketscustomers`
--

CREATE TABLE `socketscustomers` (
  `id` int(11) NOT NULL,
  `socketId` varchar(100) NOT NULL,
  `customerId` varchar(100) NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `socketscustomers`:
--   `customerId`
--       `users` -> `userId`
--

-- --------------------------------------------------------

--
-- Table structure for table `socketsrestaurants`
--

CREATE TABLE `socketsrestaurants` (
  `id` int(11) NOT NULL,
  `socketId` varchar(100) NOT NULL,
  `restaurantId` varchar(100) NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `socketsrestaurants`:
--   `restaurantId`
--       `restaurants` -> `restaurantId`
--

-- --------------------------------------------------------

--
-- Table structure for table `tableusers`
--

CREATE TABLE `tableusers` (
  `id` int(11) NOT NULL,
  `restaurantId` varchar(100) NOT NULL,
  `customerId` varchar(100) NOT NULL,
  `tableNo` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `tableusers`:
--   `customerId`
--       `users` -> `userId`
--   `restaurantId`
--       `restaurants` -> `restaurantId`
--

-- --------------------------------------------------------

--
-- Table structure for table `userroles`
--

CREATE TABLE `userroles` (
  `userId` varchar(11) NOT NULL,
  `roleId` int(11) NOT NULL,
  `startDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `endDate` datetime NOT NULL DEFAULT '2050-01-01 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `userroles`:
--   `userId`
--       `users` -> `userId`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verified` tinyint(4) NOT NULL DEFAULT '0',
  `active` tinyint(4) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- RELATIONS FOR TABLE `users`:
--

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`categoryId`),
  ADD KEY `menuId` (`menuId`),

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`itemId`),
  ADD KEY `categoryId` (`categoryId`),

--
-- Indexes for table `menus`
--
ALTER TABLE `menus`
  ADD PRIMARY KEY (`menuId`),
  ADD KEY `restaurantId` (`restaurantId`);

--
-- Indexes for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD PRIMARY KEY (`Id`),
  ADD KEY `transactionId` (`orderId`),
  ADD KEY `itemId` (`itemId`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`orderId`),
  ADD KEY `customerId` (`customerId`),
  ADD KEY `restaurantId` (`restaurantId`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orderId` (`orderId`),
  ADD KEY `chargeId` (`chargeId`);

--
-- Indexes for table `refunds`
--
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `refundId_uc` (`refundId`),
  ADD KEY `chargeId` (`chargeId`);

--
-- Indexes for table `restaurantdetails`
--
ALTER TABLE `restaurantdetails`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_restaurantId-key` (`restaurantId`,`key`);

--
-- Indexes for table `restaurantdetailspayment`
--
ALTER TABLE `restaurantdetailspayment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurantId` (`restaurantId`);

--
-- Indexes for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`restaurantId`),
  ADD KEY `ownerId` (`ownerId`);

--
-- Indexes for table `socketscustomers`
--
ALTER TABLE `socketscustomers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customerId` (`customerId`),
  ADD KEY `socketId` (`socketId`);

--
-- Indexes for table `socketsrestaurants`
--
ALTER TABLE `socketsrestaurants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurantId` (`restaurantId`);

--
-- Indexes for table `tableusers`
--
ALTER TABLE `tableusers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customerId` (`customerId`),
  ADD KEY `restaurantId` (`restaurantId`);

--
-- Indexes for table `userroles`
--
ALTER TABLE `userroles`
  ADD PRIMARY KEY (`userId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `Email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `orderitems`
--
ALTER TABLE `orderitems`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `refunds`
--
ALTER TABLE `refunds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `restaurantdetails`
--
ALTER TABLE `restaurantdetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `restaurantdetailspayment`
--
ALTER TABLE `restaurantdetailspayment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `socketscustomers`
--
ALTER TABLE `socketscustomers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `socketsrestaurants`
--
ALTER TABLE `socketsrestaurants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `tableusers`
--
ALTER TABLE `tableusers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_menuId_menus_menuId` FOREIGN KEY (`menuId`) REFERENCES `menus` (`menuId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `fk_items_categoryId_categories_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `menus`
--
ALTER TABLE `menus`
  ADD CONSTRAINT `fk_menus_restaurantId_restaurants_restaurantId` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`restaurantId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orderitems`
--
ALTER TABLE `orderitems`
  ADD CONSTRAINT `fk_orderitems_itemId_items_itemId` FOREIGN KEY (`itemId`) REFERENCES `items` (`itemId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orderitems_orderId_orders_orderId` FOREIGN KEY (`orderId`) REFERENCES `orders` (`orderId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_customerId_users_userId` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_restaurantId_restaurants_restaurantId` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`restaurantId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_orderId_orders_orderId` FOREIGN KEY (`orderId`) REFERENCES `orders` (`orderId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `refunds`
--
ALTER TABLE `refunds`
  ADD CONSTRAINT `fk_refunds_chargeId_payments_chargeId` FOREIGN KEY (`chargeId`) REFERENCES `payments` (`chargeId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `restaurantdetails`
--
ALTER TABLE `restaurantdetails`
  ADD CONSTRAINT `fk_rd_restaurantId_restaurants_restaurantId` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`restaurantId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `restaurantdetailspayment`
--
ALTER TABLE `restaurantdetailspayment`
  ADD CONSTRAINT `fk_rdp_restaurantId_restaurants_restaurantId` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`restaurantId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD CONSTRAINT `fk_restaurants_ownerId_users_userId` FOREIGN KEY (`ownerId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `socketscustomers`
--
ALTER TABLE `socketscustomers`
  ADD CONSTRAINT `fk_customerId_users_userId` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `socketsrestaurants`
--
ALTER TABLE `socketsrestaurants`
  ADD CONSTRAINT `fk_restaurantId_restaurants_restaurantId` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`restaurantId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tableusers`
--
ALTER TABLE `tableusers`
  ADD CONSTRAINT `fk_tu_customerId_users_userId` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tu_restaurantId_restaurants_restaurantId` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`restaurantId`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `userroles`
--
ALTER TABLE `userroles`
  ADD CONSTRAINT `fk_userroles_userId_users_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
