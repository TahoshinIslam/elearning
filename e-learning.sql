-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 02, 2026 at 10:50 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `e-learning`
--

-- --------------------------------------------------------

--
-- Table structure for table `affiliates`
--

CREATE TABLE `affiliates` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(32) NOT NULL,
  `commission_pct` int(10) UNSIGNED NOT NULL DEFAULT 10,
  `earnings` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `affiliates`
--

INSERT INTO `affiliates` (`id`, `name`, `code`, `commission_pct`, `earnings`, `is_active`, `created_at`) VALUES
(1, 'এডুকেশন ব্লগার', 'BLOG15', 15, 0, 1, '2026-07-06 19:49:54'),
(2, 'ইউটিউব পার্টনার', 'YT10', 10, 0, 1, '2026-07-06 19:49:54');

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_sales`
--

CREATE TABLE `affiliate_sales` (
  `id` int(10) UNSIGNED NOT NULL,
  `affiliate_id` int(10) UNSIGNED NOT NULL,
  `amount` int(10) UNSIGNED NOT NULL,
  `commission` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(10) UNSIGNED NOT NULL,
  `job_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `student_name` varchar(191) DEFAULT NULL,
  `status` enum('applied','shortlisted','interview','hired','rejected') NOT NULL DEFAULT 'applied',
  `applied_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`id`, `job_id`, `student_id`, `student_name`, `status`, `applied_at`) VALUES
(1, 1, 1, 'তানভীর আহমেদ', 'shortlisted', '2026-07-02');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `batch_id` int(10) UNSIGNED NOT NULL,
  `class_date` date NOT NULL,
  `title` varchar(191) DEFAULT NULL,
  `present` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `student_id`, `batch_id`, `class_date`, `title`, `present`) VALUES
(1, 1, 1, '2026-07-02', 'লাইভ ক্লাস — কাজ, শক্তি ও ক্ষমতা', 1),
(2, 1, 1, '2026-06-30', 'সাপোর্ট ক্লাস — মডিউল ৮', 1),
(3, 1, 1, '2026-06-29', 'লাইভ ক্লাস — ভেক্টর রিভিশন', 0),
(4, 1, 1, '2026-06-27', 'লাইভ ক্লাস — নিউটনের সূত্র', 1),
(5, 1, 1, '2026-06-25', 'মডেল টেস্ট ৭', 1),
(6, 1, 1, '2026-06-22', 'লাইভ ক্লাস — মহাকর্ষ ও অভিকর্ষ', 1),
(7, 2, 1, '2026-07-02', 'লাইভ ক্লাস — কাজ, শক্তি ও ক্ষমতা', 1),
(8, 5, 1, '2026-07-02', 'লাইভ ক্লাস — কাজ, শক্তি ও ক্ষমতা', 0);

-- --------------------------------------------------------

--
-- Table structure for table `batches`
--

CREATE TABLE `batches` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `course_id` int(10) UNSIGNED DEFAULT NULL,
  `students_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `fee` varchar(32) DEFAULT NULL,
  `schedule` varchar(191) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `batches`
--

INSERT INTO `batches` (`id`, `name`, `course_id`, `students_count`, `fee`, `schedule`, `created_at`) VALUES
(1, 'HSC ফিজিক্স — ব্যাচ ৩', 1, 32, '1,500', 'শনি-সোম-বুধ · সন্ধ্যা ৭টা', '2026-07-06 13:42:55'),
(2, 'SSC গণিত — সকাল', 2, 24, '1,200', 'রবি-মঙ্গল · সকাল ১০টা', '2026-07-06 13:42:55'),
(3, 'ফ্রি স্টার্টার — ওপেন', 3, 512, '0', 'সেল্ফ-পেসড · যেকোনো সময়', '2026-07-06 13:42:55'),
(4, 'php batch 1', 4, 0, '8000', 'Sun-Tue .8pm', '2026-07-07 04:02:49'),
(5, 'React batch 1', 6, 0, '8000', 'sun 6pm', '2026-07-07 09:55:13');

-- --------------------------------------------------------

--
-- Table structure for table `blog_posts`
--

CREATE TABLE `blog_posts` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `body` mediumtext DEFAULT NULL,
  `category` varchar(64) DEFAULT NULL,
  `cover` varchar(64) DEFAULT NULL,
  `author` varchar(191) DEFAULT NULL,
  `status` enum('draft','published') NOT NULL DEFAULT 'published',
  `published_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `blog_posts`
--

INSERT INTO `blog_posts` (`id`, `title`, `slug`, `excerpt`, `body`, `category`, `cover`, `author`, `status`, `published_at`, `created_at`) VALUES
(1, 'HSC ফিজিক্সে ভালো করার ৫টি কৌশল', 'hsc-physics-5-tips', 'পরীক্ষার আগে শেষ মুহূর্তের প্রস্তুতি কীভাবে নেবে — ৫টি কার্যকর কৌশল।', 'ফিজিক্স অনেকের কাছেই ভীতিকর একটি বিষয়। কিন্তু সঠিক কৌশল জানা থাকলে এই বিষয়েই সবচেয়ে ভালো নম্বর তোলা সম্ভব।\n\n১. সূত্রগুলো মুখস্থ না করে বোঝার চেষ্টা করো।\n২. প্রতিদিন অন্তত ৫টি গাণিতিক সমস্যা সমাধান করো।\n৩. বোর্ড প্রশ্নের প্যাটার্ন বিশ্লেষণ করো।\n৪. দুর্বল অধ্যায়গুলো আলাদা খাতায় নোট করো।\n৫. নিয়মিত মডেল টেস্ট দাও।', 'পড়াশোনা', 'physics', 'আবরার হায়দার', 'published', '2026-07-01', '2026-07-06 18:58:36'),
(2, 'অনলাইন ক্লাসে মনোযোগ ধরে রাখার উপায়', 'online-class-focus', 'ঘরে বসে ক্লাস করার সময় মনোযোগ ধরে রাখা কঠিন — এই টিপসগুলো কাজে লাগবে।', 'অনলাইন ক্লাসের সবচেয়ে বড় চ্যালেঞ্জ হলো মনোযোগ। কিছু সহজ অভ্যাস তোমাকে সাহায্য করতে পারে।\n\nএকটি নির্দিষ্ট পড়ার জায়গা তৈরি করো, ফোন দূরে রাখো, এবং প্রতি ৪৫ মিনিট পরপর ৫ মিনিট বিরতি নাও।', 'টিপস', 'laptop', 'মেহজাবিন রহমান', 'published', '2026-06-25', '2026-07-06 18:58:36'),
(3, 'ভর্তি পরীক্ষার জন্য সময় ব্যবস্থাপনা', 'admission-time-management', 'সীমিত সময়ে সর্বোচ্চ প্রস্তুতি — একটি বাস্তবসম্মত রুটিন।', 'ভর্তি পরীক্ষার প্রস্তুতিতে সময় ব্যবস্থাপনাই মূল চাবিকাঠি। একটি সাপ্তাহিক রুটিন তৈরি করো এবং তা কঠোরভাবে অনুসরণ করো।', 'ক্যারিয়ার', 'clock', 'Leo HQ', 'published', '2026-06-18', '2026-07-06 18:58:36');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(64) NOT NULL,
  `slug` varchar(64) NOT NULL,
  `icon` varchar(16) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `created_at`) VALUES
(1, 'একাডেমিক', 'academic', '📚', '2026-07-06 20:06:23'),
(2, 'স্কিল', 'skills', '💡', '2026-07-06 20:06:23'),
(3, 'ভর্তি প্রস্তুতি', 'admission', '🎯', '2026-07-06 20:06:23'),
(4, 'ফ্রি কোর্স', 'free', '🎁', '2026-07-06 20:06:23'),
(8, 'Web Development', 'web-development', '📗', '2026-07-07 08:02:29');

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `student_name` varchar(191) DEFAULT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `course_title` varchar(191) DEFAULT NULL,
  `issued_at` date DEFAULT NULL,
  `completion` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `cert_no` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `subject` varchar(191) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(64) NOT NULL,
  `type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `value` int(10) UNSIGNED NOT NULL,
  `expires_at` date DEFAULT NULL,
  `usage_limit` int(10) UNSIGNED DEFAULT NULL,
  `used_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `tenant_id` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `type`, `value`, `expires_at`, `usage_limit`, `used_count`, `tenant_id`, `is_active`, `created_at`) VALUES
(1, 'SAVE20', 'percent', 20, '2026-12-31', NULL, 0, 1, 1, '2026-07-06 18:41:35'),
(2, 'FLAT500', 'fixed', 500, '2026-12-31', 100, 0, 1, 1, '2026-07-06 18:41:35'),
(3, 'WELCOME10', 'percent', 10, NULL, NULL, 0, NULL, 1, '2026-07-06 18:41:35');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `published` tinyint(1) NOT NULL DEFAULT 0,
  `review_status` enum('draft','pending_review','published') NOT NULL DEFAULT 'draft',
  `review_note` text DEFAULT NULL,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `completion_threshold` tinyint(3) UNSIGNED NOT NULL DEFAULT 80,
  `category` varchar(64) DEFAULT NULL,
  `mode` enum('live','recorded','hybrid','free','workshop','webinar') DEFAULT 'live',
  `thumb` varchar(64) DEFAULT NULL,
  `thumbnail_key` varchar(255) DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `level` varchar(128) DEFAULT NULL,
  `language` varchar(64) DEFAULT 'বাংলা',
  `instructor` varchar(191) DEFAULT NULL,
  `instructor_id` int(10) UNSIGNED DEFAULT NULL,
  `price` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `old_price` int(10) UNSIGNED DEFAULT NULL,
  `rating` decimal(2,1) NOT NULL DEFAULT 0.0,
  `rating_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `duration` varchar(128) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `title`, `slug`, `published`, `review_status`, `review_note`, `featured`, `completion_threshold`, `category`, `mode`, `thumb`, `thumbnail_key`, `tagline`, `level`, `language`, `instructor`, `instructor_id`, `price`, `old_price`, `rating`, `rating_count`, `duration`, `description`, `created_at`, `updated_at`) VALUES
(1, 'HSC পদার্থবিজ্ঞান — সম্পূর্ণ কোর্স', 'hsc-physics', 1, 'published', NULL, 1, 80, 'physics', 'hybrid', 'ফিজিক্স', NULL, 'HSC পদার্থবিজ্ঞানের সম্পূর্ণ সিলেবাস — লাইভ ক্লাস, সাপ্তাহিক টেস্ট আর অ্যাসাইনমেন্টসহ।', 'HSC (একাদশ–দ্বাদশ)', 'বাংলা', 'আবরার হায়দার', 1, 1500, 2500, 4.8, 214, '৪ মাস · ৪৮টি লাইভ ক্লাস', 'এই কোর্সে HSC পদার্থবিজ্ঞানের পুরো সিলেবাস ধাপে ধাপে কভার করা হবে। প্রতিটি অধ্যায়ে লাইভ ক্লাস, প্র্যাকটিস শিট, সাপ্তাহিক মডেল টেস্ট এবং ব্যক্তিগত ফিডব্যাক থাকবে। ক্লাস মিস করলে রেকর্ডিং দেখে নেওয়া যাবে।', '2026-07-06 13:42:55', '2026-09-02 08:10:48'),
(2, 'SSC উচ্চতর গণিত — লাইভ ব্যাচ', 'ssc-higher-math', 1, 'published', NULL, 1, 80, 'math', 'live', 'ম্যাথ', NULL, 'SSC উচ্চতর গণিতের প্রতিটি অধ্যায় সহজভাবে — লাইভ ক্লাস ও প্র্যাকটিসসহ।', 'SSC (নবম–দশম)', 'বাংলা', 'মেহজাবিন রহমান', 3, 1200, 1800, 4.6, 96, '৩ মাস · ৩৬টি ক্লাস', 'SSC উচ্চতর গণিতের সেট, ফাংশন, বীজগণিত ও জ্যামিতি — প্রতিটি অধ্যায় লাইভ ক্লাসে বিস্তারিতভাবে শেখানো হবে।', '2026-07-06 13:42:55', '2026-09-02 08:10:48'),
(3, 'ফ্রি স্টার্টার — পড়াশোনার হাতেখড়ি', 'free-starter', 1, 'published', NULL, 0, 80, 'skills', 'recorded', 'ফ্রি', NULL, 'একদম বিনামূল্যে শুরু করুন — পড়াশোনার বেসিক কৌশল ও গাইডলাইন।', 'সকল শ্রেণি', 'বাংলা', 'Leo HQ', NULL, 0, 0, 4.9, 512, '২ সপ্তাহ · ৬টি লেসন', 'একটি সম্পূর্ণ বিনামূল্যের কোর্স যেখানে পড়াশোনার কার্যকর কৌশল, সময় ব্যবস্থাপনা ও পরীক্ষার প্রস্তুতির গাইডলাইন শেখানো হবে। এনরোল করলে অগ্রগতি ট্র্যাক হবে এবং সার্টিফিকেট পাওয়া যাবে।', '2026-07-06 13:42:55', '2026-09-02 08:10:48'),
(4, 'php', 'php', 1, 'published', NULL, 0, 80, NULL, 'live', NULL, NULL, NULL, 'Beginner', 'বাংলা', 'Tahoshin', NULL, 8000, 10000, 0.0, 0, '10 hour', NULL, '2026-07-06 20:26:48', '2026-09-02 08:10:48'),
(6, 'React Full Course', 'react-full-course', 1, 'published', NULL, 0, 80, 'web-development', 'live', NULL, NULL, NULL, 'Advanced', 'বাংলা', 'Leotach', NULL, 10000, 12000, 0.0, 0, '100 hours', 'A complete React course from the ground up.', '2026-07-07 08:06:23', '2026-09-02 08:20:09');

-- --------------------------------------------------------

--
-- Table structure for table `course_faqs`
--

CREATE TABLE `course_faqs` (
  `id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `question` varchar(255) NOT NULL,
  `answer` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_faqs`
--

INSERT INTO `course_faqs` (`id`, `course_id`, `question`, `answer`) VALUES
(7, 1, 'ক্লাস মিস হলে কী হবে?', 'প্রতিটি ক্লাসের রেকর্ডিং পাওয়া যাবে, যেকোনো সময় দেখতে পারবেন।'),
(8, 1, 'পেমেন্ট কীভাবে করব?', 'bKash/নগদ বা কার্ডের মাধ্যমে একবার কোর্স ফি পরিশোধ করলেই আজীবন এক্সেস পাওয়া যাবে।'),
(9, 1, 'সার্টিফিকেট পাব?', 'কোর্স ৮০% সম্পন্ন করলে সার্টিফিকেট পাওয়া যাবে।'),
(10, 2, 'ক্লাসের সময় কখন?', 'সপ্তাহে ৩ দিন সন্ধ্যায় লাইভ ক্লাস হবে।'),
(11, 2, 'রেকর্ডিং পাব?', 'হ্যাঁ, প্রতিটি ক্লাসের রেকর্ডিং পাওয়া যাবে।'),
(12, 3, 'এটা কি সত্যিই ফ্রি?', 'হ্যাঁ, সম্পূর্ণ বিনামূল্যে — কোনো পেমেন্ট লাগবে না। শুধু এনরোল করলেই হবে।');

-- --------------------------------------------------------

--
-- Table structure for table `course_learning_points`
--

CREATE TABLE `course_learning_points` (
  `id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `text` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_learning_points`
--

INSERT INTO `course_learning_points` (`id`, `course_id`, `text`) VALUES
(11, 1, 'ভেক্টর, বলবিদ্যা ও গতিবিদ্যার শক্ত ভিত্তি'),
(12, 1, 'বোর্ড ও ভর্তি পরীক্ষার সমস্যা সমাধানের কৌশল'),
(13, 1, 'প্রতি অধ্যায়ে মডেল টেস্ট ও বিশ্লেষণ'),
(14, 1, 'CQ ও MCQ — দুই ধরনের প্রশ্নেই দক্ষতা'),
(15, 2, 'সেট ও ফাংশনের মৌলিক ধারণা'),
(16, 2, 'বীজগণিতের সমস্যা সমাধান'),
(17, 2, 'বোর্ড পরীক্ষার প্রস্তুতি'),
(18, 3, 'কার্যকর পড়ার কৌশল'),
(19, 3, 'সময় ব্যবস্থাপনা'),
(20, 3, 'পরীক্ষার প্রস্তুতির পরিকল্পনা');

-- --------------------------------------------------------

--
-- Table structure for table `course_requirements`
--

CREATE TABLE `course_requirements` (
  `id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `text` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_requirements`
--

INSERT INTO `course_requirements` (`id`, `course_id`, `text`) VALUES
(8, 1, 'একাদশ/দ্বাদশ শ্রেণির শিক্ষার্থী'),
(9, 1, 'বেসিক গণিতের ধারণা'),
(10, 1, 'স্মার্টফোন/কম্পিউটার ও ইন্টারনেট'),
(11, 2, 'নবম/দশম শ্রেণির শিক্ষার্থী'),
(12, 2, 'সাধারণ গণিতের ধারণা'),
(13, 3, 'শেখার আগ্রহ'),
(14, 3, 'স্মার্টফোন/কম্পিউটার');

-- --------------------------------------------------------

--
-- Table structure for table `course_reviews`
--

CREATE TABLE `course_reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL DEFAULT 5,
  `text` text NOT NULL,
  `status` enum('pending','approved','hidden') NOT NULL DEFAULT 'approved',
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `student_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_reviews`
--

INSERT INTO `course_reviews` (`id`, `course_id`, `name`, `rating`, `text`, `status`, `featured`, `student_id`, `created_at`) VALUES
(5, 1, 'সুমাইয়া ইসলাম', 5, 'ছোট গ্রুপে পড়ানোর কারণে প্রতিটা প্রশ্ন করার সুযোগ পেয়েছি।', 'approved', 1, NULL, '2026-07-06 18:49:37'),
(6, 1, 'রাকিব হাসান', 4, 'রেকর্ডিং আর সাপোর্ট ক্লাস খুবই সহায়ক ছিল।', 'approved', 0, NULL, '2026-07-06 18:49:37'),
(7, 2, 'নুসরাত জাহান', 5, 'গণিতের ভয় কেটে গেছে এই কোর্সে এসে।', 'approved', 0, NULL, '2026-07-06 18:49:37'),
(8, 3, 'আরিফ হোসেন', 5, 'ফ্রি হলেও কনটেন্ট দারুণ। শুরুর জন্য পারফেক্ট।', 'approved', 0, NULL, '2026-07-06 18:49:37'),
(10, 6, 'তানভীর আহমেদ', 5, 'hello', 'pending', 0, 1, '2026-07-07 10:05:11');

-- --------------------------------------------------------

--
-- Table structure for table `demo_classes`
--

CREATE TABLE `demo_classes` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `category` varchar(32) DEFAULT NULL,
  `instructor` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `schedule` varchar(128) DEFAULT NULL,
  `status` enum('upcoming','recorded') NOT NULL DEFAULT 'upcoming',
  `video_url` varchar(255) DEFAULT NULL,
  `learners` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `demo_classes`
--

INSERT INTO `demo_classes` (`id`, `title`, `slug`, `category`, `instructor`, `description`, `schedule`, `status`, `video_url`, `learners`, `created_at`) VALUES
(1, 'ভেক্টর: এক ক্লাসে বেসিক ক্লিয়ার', 'vector-basics-live', 'phy', 'আবরার হায়দার', 'ভেক্টরের যোগ-বিয়োগ, উপাংশ ও প্রয়োগ — এক ক্লাসেই পুরো বেসিক পরিষ্কার হয়ে যাবে। লাইভ ক্লাসে সরাসরি প্রশ্ন করার সুযোগ থাকবে।', 'শুক্রবার, ৪ জুলাই · রাত ৯:০০', 'upcoming', NULL, 713, '2026-07-06 19:58:58'),
(2, 'ক্যালকুলাস শুরুর আগে যা জানতেই হবে', 'pre-calculus-live', 'math', 'মেহজাবিন রহমান', 'লিমিট ও ধারাবাহিকতার ধারণা সহজ ভাষায়। ক্যালকুলাস শুরু করার আগে ভিত্তি মজবুত করে নাও।', 'শনিবার, ৫ জুলাই · রাত ৮:০০', 'upcoming', NULL, 926, '2026-07-06 19:58:58'),
(3, 'জৈব রসায়ন: ভয় নয়, মজায় শিখি', 'organic-chem-live', 'chem', 'সৌরভ বড়ুয়া', 'জৈব রসায়নের রিয়েকশন মনে রাখার সহজ কৌশল ও প্যাটার্ন। মুখস্থ নয়, বুঝে শেখা।', 'রবিবার, ৬ জুলাই · রাত ৯:০০', 'upcoming', NULL, 1139, '2026-07-06 19:58:58'),
(4, 'নিউটনের সূত্র দিয়ে সমস্যা সমাধান', 'newton-problems-recorded', 'phy', 'আবরার হায়দার', 'নিউটনের তিন সূত্র প্রয়োগ করে ধাপে ধাপে সমস্যা সমাধানের রেকর্ডেড ক্লাস।', 'সোমবার, ৩০ জুন · রাত ৯:০০', 'recorded', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 1543, '2026-07-06 19:58:58'),
(5, 'লগারিদম: বেসিক থেকে বোর্ড প্রশ্ন', 'logarithm-recorded', 'math', 'মেহজাবিন রহমান', 'লগারিদমের সূত্র, প্রয়োগ ও বিগত বছরের বোর্ড প্রশ্নের সমাধান।', 'বৃহস্পতিবার, ২৬ জুন · রাত ৮:০০', 'recorded', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 1288, '2026-07-06 19:58:58'),
(6, 'পর্যায় সারণি মনে রাখার কৌশল', 'periodic-table-recorded', 'chem', 'সৌরভ বড়ুয়া', 'পর্যায় সারণির গ্রুপ ও পিরিয়ড সহজে মনে রাখার কৌশল ও শর্টকাট।', 'মঙ্গলবার, ২৪ জুন · রাত ৯:০০', 'recorded', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 1002, '2026-07-06 19:58:58');

-- --------------------------------------------------------

--
-- Table structure for table `demo_class_registrations`
--

CREATE TABLE `demo_class_registrations` (
  `demo_class_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `demo_class_registrations`
--

INSERT INTO `demo_class_registrations` (`demo_class_id`, `user_id`, `created_at`) VALUES
(1, 1, '2026-07-06 20:14:17'),
(2, 1, '2026-07-06 20:08:16');

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `batch_id` int(10) UNSIGNED DEFAULT NULL,
  `course_id` int(10) UNSIGNED DEFAULT NULL,
  `enrolled_at` date DEFAULT NULL,
  `status` enum('active','cancelled') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`id`, `student_id`, `batch_id`, `course_id`, `enrolled_at`, `status`) VALUES
(1, 1, 1, 1, '2026-06-01', 'active'),
(2, 2, 1, 1, '2026-06-01', 'active'),
(3, 5, 1, 1, '2026-06-03', 'active'),
(9, 1, 4, 4, '2026-07-07', 'active'),
(10, 1, 5, 6, '2026-07-07', 'active'),
(11, 1, 2, 2, '2026-07-07', 'active'),
(19, 1, NULL, 3, '2026-09-02', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `homepage_content`
--

CREATE TABLE `homepage_content` (
  `section` varchar(32) NOT NULL,
  `data` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(191) NOT NULL,
  `company` varchar(191) DEFAULT NULL,
  `location` varchar(128) DEFAULT NULL,
  `type` enum('full-time','part-time','internship') NOT NULL DEFAULT 'full-time',
  `salary` varchar(64) DEFAULT NULL,
  `posted_at` date DEFAULT NULL,
  `is_open` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `title`, `company`, `location`, `type`, `salary`, `posted_at`, `is_open`) VALUES
(1, 'জুনিয়র ফিজিক্স টিউটর', 'আলোর পথ কোচিং', 'ঢাকা', 'full-time', '২৫,০০০', '2026-07-01', 1),
(2, 'কন্টেন্ট রাইটার (গণিত)', 'মেধা একাডেমি', 'রিমোট', 'part-time', '১৫,০০০', '2026-06-28', 1),
(3, 'ল্যাব অ্যাসিস্ট্যান্ট', 'জ্ঞানকোষ সেন্টার', 'চট্টগ্রাম', 'internship', '১০,০০০', '2026-06-20', 0);

-- --------------------------------------------------------

--
-- Table structure for table `job_skills`
--

CREATE TABLE `job_skills` (
  `id` int(10) UNSIGNED NOT NULL,
  `job_id` int(10) UNSIGNED NOT NULL,
  `skill` varchar(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `job_skills`
--

INSERT INTO `job_skills` (`id`, `job_id`, `skill`) VALUES
(6, 1, 'ফিজিক্স'),
(7, 1, 'HSC'),
(8, 2, 'গণিত'),
(9, 2, 'লেখালেখি'),
(10, 3, 'কেমিস্ট্রি');

-- --------------------------------------------------------

--
-- Table structure for table `learning_paths`
--

CREATE TABLE `learning_paths` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `thumb` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `learning_paths`
--

INSERT INTO `learning_paths` (`id`, `title`, `slug`, `description`, `thumb`, `created_at`) VALUES
(1, 'HSC সায়েন্স ফুল ট্র্যাক', 'hsc-science-track', 'ফিজিক্স থেকে গণিত — HSC সায়েন্সের সম্পূর্ণ প্রস্তুতি এক ট্র্যাকে।', 'track', '2026-07-06 19:37:01'),
(3, 'FullStack Web Development', 'fullstack-web-development', NULL, 'track', '2026-07-07 08:04:11');

-- --------------------------------------------------------

--
-- Table structure for table `lessons`
--

CREATE TABLE `lessons` (
  `id` int(10) UNSIGNED NOT NULL,
  `module_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(191) NOT NULL,
  `type` enum('video','pdf','quiz','assignment') NOT NULL DEFAULT 'video',
  `duration` varchar(64) DEFAULT NULL,
  `is_free` tinyint(1) NOT NULL DEFAULT 0,
  `position` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lessons`
--

INSERT INTO `lessons` (`id`, `module_id`, `title`, `type`, `duration`, `is_free`, `position`) VALUES
(111, 11, 'ভেক্টর ও স্কেলারের ধারণা', 'video', '৪২ মিনিট', 1, 0),
(112, 11, 'ভেক্টর যোগ, বিয়োগ ও গুণন', 'video', '৩৮ মিনিট', 1, 1),
(113, 11, 'অধ্যায় ১ — শিট (PDF)', 'pdf', NULL, 0, 2),
(114, 11, 'অধ্যায় ১ কুইজ', 'quiz', NULL, 0, 3),
(115, 11, 'অ্যাসাইনমেন্ট ১.১ — ভেক্টর সমস্যা', 'assignment', NULL, 0, 4),
(121, 12, 'গতির তিনটি সূত্র', 'video', '৫০ মিনিট', 0, 1),
(122, 12, 'ঘর্ষণ ও টান', 'video', '৩৫ মিনিট', 0, 2),
(123, 12, 'অ্যাসাইনমেন্ট ১ — বলবিদ্যা', 'assignment', NULL, 0, 3),
(211, 21, 'সেটের ধারণা', 'video', '৪০ মিনিট', 1, 1),
(212, 21, 'ফাংশন ও তার প্রকারভেদ', 'video', '৪৫ মিনিট', 0, 2),
(311, 31, 'কীভাবে পড়লে মনে থাকে', 'video', '১৮ মিনিট', 1, 1),
(312, 31, 'রুটিন তৈরির সহজ নিয়ম', 'video', '২২ মিনিট', 1, 2),
(313, 32, 'Core Engine defaults.', 'pdf', NULL, 0, 1),
(314, 32, 'date: Timezone and date handling.', 'pdf', NULL, 0, 2),
(315, 32, 'filter: Data validation and sanitization.', 'pdf', NULL, 0, 3),
(316, 32, 'hash: Cryptographic hashing tools.', 'pdf', NULL, 0, 4),
(317, 32, 'openssl: TLS/SSL secure communications', 'pdf', NULL, 0, 5),
(318, 33, 'PDO: PHP Data Objects framework.', 'video', '—', 1, 1),
(319, 33, 'pdo_mysql: MySQL driver for PDO.mysqli:', 'video', '—', 1, 2),
(320, 33, 'Improved MySQL interface', 'video', '—', 1, 3),
(321, 33, '.pdo_sqlite: SQLite driver for PDO', 'video', '—', 1, 4),
(325, 32, 'QUIZ 1', 'quiz', NULL, 0, 6),
(378, 34, 'Intro to React', 'video', '—', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `lesson_answers`
--

CREATE TABLE `lesson_answers` (
  `id` int(10) UNSIGNED NOT NULL,
  `question_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `author_name` varchar(191) DEFAULT NULL,
  `role` varchar(16) DEFAULT NULL,
  `body` varchar(1000) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_progress`
--

CREATE TABLE `lesson_progress` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `lesson_id` int(10) UNSIGNED NOT NULL,
  `watched_seconds` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `duration_seconds` int(10) UNSIGNED DEFAULT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `completed_at` timestamp NULL DEFAULT NULL,
  `last_activity_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_questions`
--

CREATE TABLE `lesson_questions` (
  `id` int(10) UNSIGNED NOT NULL,
  `lesson_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `author_name` varchar(191) DEFAULT NULL,
  `role` varchar(16) DEFAULT NULL,
  `body` varchar(1000) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `live_classes`
--

CREATE TABLE `live_classes` (
  `id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED DEFAULT NULL,
  `batch_id` int(10) UNSIGNED DEFAULT NULL,
  `instructor_id` int(10) UNSIGNED DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `class_date` date DEFAULT NULL,
  `start_time` varchar(64) DEFAULT NULL,
  `end_time` varchar(64) DEFAULT NULL,
  `zoom_url` varchar(255) DEFAULT NULL,
  `status` enum('scheduled','live','ended') NOT NULL DEFAULT 'scheduled',
  `recording_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `live_classes`
--

INSERT INTO `live_classes` (`id`, `course_id`, `batch_id`, `instructor_id`, `title`, `class_date`, `start_time`, `end_time`, `zoom_url`, `status`, `recording_url`) VALUES
(1, 1, 1, 1, 'নিউটনিয়ান বলবিদ্যা — কাজ, শক্তি ও ক্ষমতা', '2026-07-06', 'সন্ধ্যা ৭:০০', 'রাত ৯:০০', 'https://zoom.us/j/1112223334', 'ended', 'https://recordings.leolearning.app/1'),
(2, 1, 1, 1, 'পর্যাবৃত্ত গতি — সরল ছন্দিত স্পন্দন', '2026-07-08', 'সন্ধ্যা ৭:০০', 'রাত ৯:০০', 'https://zoom.us/j/2223334445', 'scheduled', NULL),
(3, 1, 1, 1, 'ভেক্টর রিভিশন ক্লাস', '2026-06-29', 'সন্ধ্যা ৭:০০', 'রাত ৯:০০', 'https://zoom.us/j/3334445556', 'ended', 'https://recordings.leolearning.app/vec-rev'),
(5, 3, 3, 1, 'VVVVV', '2026-07-07', '7.00', '9.00', 'https://us05web.zoom.us/j/9205323025?pwd=fXjx22KaaABMJJuUs3dJ6p87u3seoO.1', 'ended', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `mentor_students`
--

CREATE TABLE `mentor_students` (
  `mentor_user_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mentor_students`
--

INSERT INTO `mentor_students` (`mentor_user_id`, `student_id`) VALUES
(13, 1),
(13, 2),
(13, 5);

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(191) NOT NULL,
  `position` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `modules`
--

INSERT INTO `modules` (`id`, `course_id`, `title`, `position`) VALUES
(11, 1, 'মডিউল ১: ভেক্টর ও স্কেলার', 1),
(12, 1, 'মডিউল ২: নিউটনীয় বলবিদ্যা', 2),
(21, 2, 'মডিউল ১: সেট ও ফাংশন', 1),
(31, 3, 'মডিউল ১: শুরুর গাইড', 1),
(32, 4, 'Core & UtilitiesCore', 1),
(33, 4, 'Database Extensions', 2),
(34, 6, 'Introduction', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(191) NOT NULL,
  `body` varchar(500) DEFAULT NULL,
  `kind` enum('announcement','grade','class','payment','system') NOT NULL DEFAULT 'announcement',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `body`, `kind`, `is_read`, `created_at`) VALUES
(4, 1, 'অ্যাসাইনমেন্ট গ্রেড হয়েছে', 'আপনি পেয়েছেন 18/20', 'grade', 1, '2026-07-07 07:02:56');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `status` enum('pending','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `amount` int(10) UNSIGNED NOT NULL,
  `currency` varchar(8) NOT NULL DEFAULT 'BDT',
  `coupon_code` varchar(64) DEFAULT NULL,
  `affiliate_code` varchar(64) DEFAULT NULL,
  `gateway` enum('bkash','none') NOT NULL DEFAULT 'bkash',
  `gateway_payment_id` varchar(64) DEFAULT NULL,
  `gateway_trx_id` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `student_id`, `status`, `amount`, `currency`, `coupon_code`, `affiliate_code`, `gateway`, `gateway_payment_id`, `gateway_trx_id`, `created_at`, `updated_at`) VALUES
(11, 1, 'paid', 0, 'BDT', NULL, NULL, 'none', NULL, NULL, '2026-09-02 07:38:25', '2026-09-02 07:38:25');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `unit_price` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `course_id`, `unit_price`) VALUES
(11, 11, 3, 0);

-- --------------------------------------------------------

--
-- Table structure for table `path_courses`
--

CREATE TABLE `path_courses` (
  `path_id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `position` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `path_courses`
--

INSERT INTO `path_courses` (`path_id`, `course_id`, `position`) VALUES
(1, 1, 1),
(1, 2, 2),
(3, 4, 1);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED DEFAULT NULL,
  `student_name` varchar(191) DEFAULT NULL,
  `course_id` int(10) UNSIGNED DEFAULT NULL,
  `batch_id` int(10) UNSIGNED DEFAULT NULL,
  `amount` int(10) UNSIGNED NOT NULL,
  `method` enum('bkash','nagad','card') NOT NULL DEFAULT 'bkash',
  `type` enum('enrollment','fee') NOT NULL DEFAULT 'enrollment',
  `status` enum('success','refunded') NOT NULL DEFAULT 'success',
  `trx_id` varchar(64) NOT NULL,
  `invoice_no` varchar(64) NOT NULL,
  `created_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `student_id`, `student_name`, `course_id`, `batch_id`, `amount`, `method`, `type`, `status`, `trx_id`, `invoice_no`, `created_at`) VALUES
(1, 1, 'তানভীর আহমেদ', 1, 1, 1500, 'bkash', 'enrollment', 'success', 'TRX9GK4A2LX', 'INV-2026-0001', '2026-06-01'),
(2, 2, 'সুমাইয়া ইসলাম', 1, 1, 1500, 'bkash', 'fee', 'success', 'TRX7HL2B93K', 'INV-2026-0002', '2026-06-05'),
(7, 1, 'তানভীর আহমেদ', 6, 5, 10000, 'bkash', 'enrollment', 'success', 'TRXV1KPJD5F', 'INV-2026-0007', '2026-07-07'),
(8, 1, 'তানভীর আহমেদ', 2, 2, 1200, 'bkash', 'enrollment', 'success', 'TRX6BKGEDX0', 'INV-2026-0008', '2026-07-07');

-- --------------------------------------------------------

--
-- Table structure for table `payment_events`
--

CREATE TABLE `payment_events` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `gateway` varchar(16) NOT NULL,
  `event_type` enum('create','execute','callback_failed') NOT NULL,
  `gateway_payment_id` varchar(64) DEFAULT NULL,
  `gateway_trx_id` varchar(64) DEFAULT NULL,
  `status` varchar(32) DEFAULT NULL,
  `raw_payload` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_answers`
--

CREATE TABLE `quiz_answers` (
  `id` int(10) UNSIGNED NOT NULL,
  `attempt_id` int(10) UNSIGNED NOT NULL,
  `question_id` int(10) UNSIGNED NOT NULL,
  `option_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_answers`
--

INSERT INTO `quiz_answers` (`id`, `attempt_id`, `question_id`, `option_id`) VALUES
(4, 2, 7, 25),
(5, 2, 8, 29),
(6, 2, 9, 34);

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `id` int(10) UNSIGNED NOT NULL,
  `lesson_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `student_name` varchar(191) DEFAULT NULL,
  `score` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `max_score` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_attempts`
--

INSERT INTO `quiz_attempts` (`id`, `lesson_id`, `student_id`, `student_name`, `score`, `max_score`, `submitted_at`) VALUES
(2, 114, 1, 'তানভীর আহমেদ', 2, 3, '2026-07-07 01:27:40'),
(4, 325, 1, 'তানভীর আহমেদ', 1, 2, '2026-07-07 13:19:03');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_options`
--

CREATE TABLE `quiz_options` (
  `id` int(10) UNSIGNED NOT NULL,
  `question_id` int(10) UNSIGNED NOT NULL,
  `text` varchar(500) NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `position` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_options`
--

INSERT INTO `quiz_options` (`id`, `question_id`, `text`, `is_correct`, `position`) VALUES
(25, 7, 'নিউটন', 0, 0),
(26, 7, 'জুল', 1, 1),
(27, 7, 'ওয়াট', 0, 2),
(28, 7, 'প্যাসকেল', 0, 3),
(29, 8, 'ওয়াট', 1, 0),
(30, 8, 'জুল', 0, 1),
(31, 8, 'নিউটন', 0, 2),
(32, 8, 'অ্যাম্পিয়ার', 0, 3),
(33, 9, 'mgh', 0, 0),
(34, 9, '½mv²', 1, 1),
(35, 9, 'mv', 0, 2),
(36, 9, 'Fd', 0, 3),
(73, 20, 'int my_var = 10;', 0, 0),
(74, 20, '$my_var = 10;', 1, 1),
(75, 20, 'declare my_var = 10;', 0, 2),
(76, 20, 'var my_var = 10;', 0, 3),
(77, 21, '<php>', 0, 0),
(78, 21, '<?php', 1, 1),
(79, 21, '<!php>', 0, 2),
(80, 21, '<?', 0, 3);

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` int(10) UNSIGNED NOT NULL,
  `lesson_id` int(10) UNSIGNED NOT NULL,
  `question` varchar(500) NOT NULL,
  `position` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`id`, `lesson_id`, `question`, `position`) VALUES
(7, 114, 'কাজের একক কোনটি?', 0),
(8, 114, 'ক্ষমতার একক কোনটি?', 1),
(9, 114, 'গতিশক্তির সূত্র কোনটি?', 2),
(20, 325, 'Which of the following is the correct way to declare a variable in PHP?', 0),
(21, 325, 'Which of the following is the correct way to start a standard PHP code block?', 1);

-- --------------------------------------------------------

--
-- Table structure for table `referrals`
--

CREATE TABLE `referrals` (
  `id` int(10) UNSIGNED NOT NULL,
  `referrer_user_id` int(10) UNSIGNED NOT NULL,
  `referred_user_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `skey` varchar(64) NOT NULL,
  `svalue` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`skey`, `svalue`, `updated_at`) VALUES
('maintenance', '0', '2026-07-07 06:25:47'),
('maintenanceMsg', 'সাইটটি সাময়িকভাবে রক্ষণাবেক্ষণের জন্য বন্ধ আছে। শীঘ্রই ফিরে আসছি!', '2026-07-07 03:51:13'),
('seoDescription', 'Bangladeshi coaching center — live classes, recorded courses, exams and more.', '2026-07-07 03:51:13'),
('siteTitle', 'Leo Learning', '2026-07-07 03:51:15'),
('supportEmail', 'support@leolearning.app', '2026-07-07 03:51:13'),
('supportPhone', '01712-334455', '2026-07-07 03:51:13');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `batch_id` int(10) UNSIGNED DEFAULT NULL,
  `amount` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `paid` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `name`, `phone`, `batch_id`, `amount`, `paid`, `created_at`) VALUES
(1, 'তানভীর আহমেদ', '01712-334455', 1, 1500, 0, '2026-07-06 13:42:55'),
(2, 'সুমাইয়া ইসলাম', '01818-990011', 1, 1500, 1, '2026-07-06 13:42:55'),
(3, 'রাকিব হাসান', '01917-556677', 2, 1200, 0, '2026-07-06 13:42:55'),
(4, 'নুসরাত জাহান', '01611-223344', 2, 1200, 1, '2026-07-06 13:42:55'),
(5, 'মেহেদী হাসান', '01715-887799', 1, 1500, 1, '2026-07-06 13:42:55'),
(7, 'Taho', 'm@gmail.com', NULL, 0, 0, '2026-09-02 07:15:49'),
(8, 'Leo', 'm@gmail.com', NULL, 0, 0, '2026-09-02 07:15:49'),
(9, 'taho', '01788853871', NULL, 0, 0, '2026-09-02 07:15:49');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `lesson_id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED DEFAULT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `student_name` varchar(191) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `submitted_at` date DEFAULT NULL,
  `status` enum('submitted','graded') NOT NULL DEFAULT 'submitted',
  `marks` int(10) UNSIGNED DEFAULT NULL,
  `max_marks` int(10) UNSIGNED NOT NULL DEFAULT 20,
  `feedback` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `lesson_id`, `course_id`, `student_id`, `student_name`, `content`, `submitted_at`, `status`, `marks`, `max_marks`, `feedback`) VALUES
(1, 123, 1, 1, 'তানভীর আহমেদ', 'বলবিদ্যার সমস্যাগুলোর সমাধান সংযুক্ত করা হলো।', '2026-07-02', 'graded', 18, 20, ''),
(2, 123, 1, 2, 'সুমাইয়া ইসলাম', 'সমাধান জমা দিলাম।', '2026-07-04', 'submitted', NULL, 20, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `subject` varchar(191) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `title` varchar(191) DEFAULT NULL,
  `rating` decimal(2,1) NOT NULL DEFAULT 0.0,
  `rating_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `students_taught` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `bio` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`id`, `name`, `subject`, `phone`, `title`, `rating`, `rating_count`, `students_taught`, `bio`, `created_at`) VALUES
(1, 'আবরার হায়দার', 'ফিজিক্স', '01712-889900', 'সিনিয়র ফিজিক্স ইন্সট্রাক্টর', 4.8, 214, 1240, '১০ বছরের বেশি সময় ধরে HSC ও ভর্তি পরীক্ষার শিক্ষার্থীদের পড়াচ্ছেন। জটিল ধারণা সহজ উদাহরণে বোঝানোই তাঁর বিশেষত্ব।', '2026-07-06 13:42:55'),
(2, 'সৌরভ বড়ুয়া', 'ফিজিক্স (সাপোর্ট)', '01815-667788', 'সাপোর্ট ইন্সট্রাক্টর', 4.6, 88, 430, 'সাপোর্ট ক্লাস ও হোমওয়ার্ক রিভিউতে বিশেষজ্ঞ, শিক্ষার্থীদের দুর্বলতা ধরে ধরে ঠিক করেন।', '2026-07-06 13:42:55'),
(3, 'মেহজাবিন রহমান', 'গণিত', '01911-223300', 'সিনিয়র গণিত ইন্সট্রাক্টর', 4.7, 132, 760, 'SSC উচ্চতর গণিতে দীর্ঘদিনের অভিজ্ঞ শিক্ষক। ধাপে ধাপে সমাধান শেখানোই তাঁর পদ্ধতি।', '2026-07-06 13:42:55'),
(4, 'নতুন শিক্ষক', 'বিষয়', '—', NULL, 0.0, 0, 0, NULL, '2026-07-07 04:05:11');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_batches`
--

CREATE TABLE `teacher_batches` (
  `teacher_id` int(10) UNSIGNED NOT NULL,
  `batch_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teacher_batches`
--

INSERT INTO `teacher_batches` (`teacher_id`, `batch_id`) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 4);

-- --------------------------------------------------------

--
-- Table structure for table `teacher_expertise`
--

CREATE TABLE `teacher_expertise` (
  `id` int(10) UNSIGNED NOT NULL,
  `teacher_id` int(10) UNSIGNED NOT NULL,
  `skill` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teacher_expertise`
--

INSERT INTO `teacher_expertise` (`id`, `teacher_id`, `skill`) VALUES
(9, 1, 'বলবিদ্যা'),
(10, 1, 'তড়িৎ ও চুম্বকত্ব'),
(11, 1, 'আধুনিক পদার্থবিজ্ঞান'),
(12, 2, 'সমস্যা সমাধান'),
(13, 2, 'MCQ কৌশল'),
(14, 3, 'বীজগণিত'),
(15, 3, 'জ্যামিতি'),
(16, 3, 'ত্রিকোণমিতি');

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `sub` varchar(64) NOT NULL,
  `plan` enum('Trial','Basic','Pro') NOT NULL DEFAULT 'Trial',
  `students` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `mrr` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `status` enum('active','trial','suspended') NOT NULL DEFAULT 'trial',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tenants`
--

INSERT INTO `tenants` (`id`, `name`, `sub`, `plan`, `students`, `mrr`, `status`, `created_at`) VALUES
(1, 'আলোর পথ কোচিং', 'alorpath', 'Pro', 128, 1500, 'active', '2026-07-06 13:42:55'),
(2, 'মেধা একাডেমি', 'medha', 'Basic', 46, 800, 'active', '2026-07-06 13:42:55'),
(3, 'সাফল্য কেয়ার', 'safollo', 'Trial', 19, 0, 'active', '2026-07-06 13:42:55'),
(4, 'জ্ঞানকোষ সেন্টার', 'gyankosh', 'Pro', 210, 1500, 'active', '2026-07-06 13:42:55'),
(5, 'দিগন্ত টিউটোরিয়াল', 'diganta', 'Basic', 33, 800, 'suspended', '2026-07-06 13:42:55');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','teacher','owner','superadmin') NOT NULL DEFAULT 'student',
  `tenant_id` int(10) UNSIGNED DEFAULT NULL,
  `student_id` int(10) UNSIGNED DEFAULT NULL,
  `teacher_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `sections` text DEFAULT NULL,
  `referral_code` varchar(16) DEFAULT NULL,
  `reset_token` varchar(128) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `tenant_id`, `student_id`, `teacher_id`, `status`, `sections`, `referral_code`, `reset_token`, `reset_expires`, `created_at`) VALUES
(1, 'তানভীর আহমেদ', 'student@leolearning.app', NULL, 'scrypt$7a3ecfe1f4cf6397019eecba495e3359$5178f2ec22c0697118b518773d3e43790e0a2abf6227f7f5346c0d91f6d45185b6ede30dc02d4dc319deccc6b635991ac625142002aa025bffec54e6f4800295', 'student', 1, 1, NULL, 'active', NULL, 'LEO4B76BC', NULL, NULL, '2026-07-06 16:23:46'),
(2, 'আবরার হায়দার', 'teacher@leolearning.app', NULL, 'scrypt$a9e4115f3d045bc43300b8a25296c4b0$9d8652c0dcb6c2aefaf0bfd21e741e4d4ae554b3b4504d7f886035496aecfb4f0f80325ff2c84f1abd0ae1258d7f7a8401532cff9f3826b7f0a347838f3d82f8', 'teacher', 1, NULL, 1, 'active', 'dash,students,classes,attendance,submissions,quizzes,announce', NULL, NULL, NULL, '2026-07-06 16:23:46'),
(3, 'তানভীরের অভিভাবক', 'parent@leolearning.app', NULL, 'scrypt$dc6152c38f57ba36bb0bdab956b03308$b2d5fa6e4b24abea06f196b1f5e564a8016cbbeb8ea756674dd9d4b03c09bc6a5d7b832f626152ea01934798fe42972ba4f193485be3617df8f70addb8e1aec2', 'student', 1, 1, NULL, 'active', NULL, NULL, NULL, NULL, '2026-07-06 16:23:46'),
(4, 'কেন্দ্র অ্যাডমিন', 'owner@leolearning.app', NULL, 'scrypt$ae6ef8014f3544ea13485ee53ce7e676$57049ac3a9a1eebf54f5898ed1b6a19ce914eacbb628995524347e8535ee1fb178be4f6616cbe4a3271350af5af469bfadd91be0d5aef6d4aa3f2887b72a02b0', 'owner', 1, NULL, NULL, 'active', NULL, 'LEOB73B33', NULL, NULL, '2026-07-06 16:23:46'),
(5, 'Leo HQ', 'superadmin@leolearning.app', NULL, 'scrypt$c69591e0175a8078d6e9a122da0f6585$f43d85fec91f01fb6af109aabb9c7ad6dc2bae83aa632ad5f5659085eba43396deed877242752d6108fd44be4c707d3173b16209b1887e5332e0619fe47d136c', 'superadmin', NULL, NULL, NULL, 'active', NULL, NULL, NULL, NULL, '2026-07-06 16:23:46'),
(8, 'Taho', 'm@gmail.com', 'm@gmail.com', 'scrypt$3457353b7231bf36956b1bdc18acb8f0$6d22a2e26b57c411ea8da885d3fc05a8e7bee8ee168e1df020b02bf39989085b6b19849fce702cfd364169f4cc647081a9daf1bb3a4123be07999ec8b3b2f6d3', 'student', NULL, 7, NULL, 'active', NULL, NULL, NULL, NULL, '2026-07-06 17:16:43'),
(9, 'Leo', 'leo@gmail.com', 'm@gmail.com', 'scrypt$93318df773d2811f0f1f782f9640b5de$15877f9f54bca164ac233d88bcdaaf1c49bb591130b411b4b64a57556fb7ebbab0782fafc19f403cafb86f5ba6c692c4f64c38ed6039eea5bb2f83466e525102', 'student', NULL, 8, NULL, 'active', NULL, NULL, NULL, NULL, '2026-07-06 17:18:05'),
(10, 'taho', 'yoyo23102000@gmail.com', '01788853871', 'scrypt$b0ab1d289dd533269f8d33467da73f01$b34cc0049d7974c09df145ae0574e1a8102eccc34ed5a585c3114f9f8e78421fd5a5f273334afcc96e19ee4e0afe7cfd4cf4763d3ad1a6509b6d247317d5de9f', 'student', NULL, 9, NULL, 'active', NULL, NULL, '446e3218b789e05f943b57d5ee343c346764a1ecb77601b6', '2026-07-07 02:04:57', '2026-07-06 19:04:36'),
(13, 'রাফিয়া মেন্টর', 'mentor@leolearning.app', NULL, 'scrypt$05bfe216d985f91add6077824e8d3ef4$b17d002b69f224dfd01ba51646a4ec2ec1593483047d49d2b140225d291971e759057e8178e5b0e5c3875fca926d6781fc48a55baf9c10633b56b4ef9e56f22f', 'teacher', 1, NULL, NULL, 'active', 'dash,students,classes,attendance,submissions,quizzes,announce', NULL, NULL, NULL, '2026-07-06 19:07:37');

-- --------------------------------------------------------

--
-- Table structure for table `video_assets`
--

CREATE TABLE `video_assets` (
  `id` int(10) UNSIGNED NOT NULL,
  `lesson_id` int(10) UNSIGNED NOT NULL,
  `provider` enum('s3','r2') NOT NULL,
  `storage_key` varchar(255) NOT NULL,
  `duration_seconds` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('pending','ready','failed') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `course_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `affiliates`
--
ALTER TABLE `affiliates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `affiliate_sales`
--
ALTER TABLE `affiliate_sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_as_affiliate` (`affiliate_id`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_application` (`job_id`,`student_id`),
  ADD KEY `fk_app_student` (`student_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_attendance` (`student_id`,`batch_id`,`class_date`),
  ADD KEY `fk_att_batch` (`batch_id`);

--
-- Indexes for table `batches`
--
ALTER TABLE `batches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_batch_course` (`course_id`);

--
-- Indexes for table `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cert_no` (`cert_no`),
  ADD UNIQUE KEY `uq_certificate` (`student_id`,`course_id`),
  ADD KEY `fk_cert_course` (`course_id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_coupon_tenant` (`tenant_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_course_instructor` (`instructor_id`);

--
-- Indexes for table `course_faqs`
--
ALTER TABLE `course_faqs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_faq_course` (`course_id`);

--
-- Indexes for table `course_learning_points`
--
ALTER TABLE `course_learning_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_lp_course` (`course_id`);

--
-- Indexes for table `course_requirements`
--
ALTER TABLE `course_requirements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_req_course` (`course_id`);

--
-- Indexes for table `course_reviews`
--
ALTER TABLE `course_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_review_course` (`course_id`);

--
-- Indexes for table `demo_classes`
--
ALTER TABLE `demo_classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `demo_class_registrations`
--
ALTER TABLE `demo_class_registrations`
  ADD PRIMARY KEY (`demo_class_id`,`user_id`),
  ADD KEY `fk_dcr_user` (`user_id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_enrollment` (`student_id`,`batch_id`),
  ADD UNIQUE KEY `uq_enrollment_course` (`student_id`,`course_id`),
  ADD KEY `fk_enr_batch` (`batch_id`),
  ADD KEY `fk_enr_course` (`course_id`);

--
-- Indexes for table `homepage_content`
--
ALTER TABLE `homepage_content`
  ADD PRIMARY KEY (`section`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_skills`
--
ALTER TABLE `job_skills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_skill_job` (`job_id`);

--
-- Indexes for table `learning_paths`
--
ALTER TABLE `learning_paths`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `lessons`
--
ALTER TABLE `lessons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_lesson_module` (`module_id`);

--
-- Indexes for table `lesson_answers`
--
ALTER TABLE `lesson_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_la_question` (`question_id`),
  ADD KEY `fk_la_user` (`user_id`);

--
-- Indexes for table `lesson_progress`
--
ALTER TABLE `lesson_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_progress_student_lesson` (`student_id`,`lesson_id`),
  ADD KEY `fk_progress_lesson` (`lesson_id`);

--
-- Indexes for table `lesson_questions`
--
ALTER TABLE `lesson_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lq_lesson` (`lesson_id`),
  ADD KEY `fk_lq_user` (`user_id`);

--
-- Indexes for table `live_classes`
--
ALTER TABLE `live_classes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_lc_course` (`course_id`),
  ADD KEY `fk_lc_batch` (`batch_id`),
  ADD KEY `fk_lc_instructor` (`instructor_id`);

--
-- Indexes for table `mentor_students`
--
ALTER TABLE `mentor_students`
  ADD PRIMARY KEY (`mentor_user_id`,`student_id`),
  ADD KEY `fk_ms_student` (`student_id`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_module_course` (`course_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notif_user` (`user_id`,`is_read`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_order_gateway_payment` (`gateway_payment_id`),
  ADD KEY `fk_order_student` (`student_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_order_item` (`order_id`,`course_id`),
  ADD KEY `fk_item_course` (`course_id`);

--
-- Indexes for table `path_courses`
--
ALTER TABLE `path_courses`
  ADD PRIMARY KEY (`path_id`,`course_id`),
  ADD KEY `fk_pc_course` (`course_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_no` (`invoice_no`),
  ADD KEY `fk_pay_student` (`student_id`),
  ADD KEY `fk_pay_course` (`course_id`),
  ADD KEY `fk_pay_batch` (`batch_id`);

--
-- Indexes for table `payment_events`
--
ALTER TABLE `payment_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payment_event` (`gateway_payment_id`,`event_type`),
  ADD KEY `fk_event_order` (`order_id`);

--
-- Indexes for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_answer` (`attempt_id`,`question_id`),
  ADD KEY `fk_ans_question` (`question_id`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_attempt` (`lesson_id`,`student_id`),
  ADD KEY `fk_qa_student` (`student_id`);

--
-- Indexes for table `quiz_options`
--
ALTER TABLE `quiz_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_qo_question` (`question_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_qq_lesson` (`lesson_id`);

--
-- Indexes for table `referrals`
--
ALTER TABLE `referrals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `referred_user_id` (`referred_user_id`),
  ADD KEY `fk_ref_referrer` (`referrer_user_id`);

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`skey`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_student_batch` (`batch_id`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_submission` (`lesson_id`,`student_id`),
  ADD KEY `fk_sub_student` (`student_id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `teacher_batches`
--
ALTER TABLE `teacher_batches`
  ADD PRIMARY KEY (`teacher_id`,`batch_id`),
  ADD KEY `fk_tb_batch` (`batch_id`);

--
-- Indexes for table `teacher_expertise`
--
ALTER TABLE `teacher_expertise`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_expertise_teacher` (`teacher_id`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sub` (`sub`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `referral_code` (`referral_code`),
  ADD KEY `fk_user_tenant` (`tenant_id`),
  ADD KEY `fk_user_student` (`student_id`),
  ADD KEY `fk_user_teacher` (`teacher_id`);

--
-- Indexes for table `video_assets`
--
ALTER TABLE `video_assets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_video_lesson` (`lesson_id`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_wishlist` (`student_id`,`course_id`),
  ADD KEY `fk_wish_course` (`course_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `affiliates`
--
ALTER TABLE `affiliates`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `affiliate_sales`
--
ALTER TABLE `affiliate_sales`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `batches`
--
ALTER TABLE `batches`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `blog_posts`
--
ALTER TABLE `blog_posts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `course_faqs`
--
ALTER TABLE `course_faqs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `course_learning_points`
--
ALTER TABLE `course_learning_points`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `course_requirements`
--
ALTER TABLE `course_requirements`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `course_reviews`
--
ALTER TABLE `course_reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `demo_classes`
--
ALTER TABLE `demo_classes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `job_skills`
--
ALTER TABLE `job_skills`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `learning_paths`
--
ALTER TABLE `learning_paths`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `lessons`
--
ALTER TABLE `lessons`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=386;

--
-- AUTO_INCREMENT for table `lesson_answers`
--
ALTER TABLE `lesson_answers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `lesson_progress`
--
ALTER TABLE `lesson_progress`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `lesson_questions`
--
ALTER TABLE `lesson_questions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `live_classes`
--
ALTER TABLE `live_classes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `modules`
--
ALTER TABLE `modules`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `payment_events`
--
ALTER TABLE `payment_events`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `quiz_options`
--
ALTER TABLE `quiz_options`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `referrals`
--
ALTER TABLE `referrals`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `teacher_expertise`
--
ALTER TABLE `teacher_expertise`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT for table `video_assets`
--
ALTER TABLE `video_assets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `affiliate_sales`
--
ALTER TABLE `affiliate_sales`
  ADD CONSTRAINT `fk_as_affiliate` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `fk_app_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_app_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `fk_att_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_att_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `batches`
--
ALTER TABLE `batches`
  ADD CONSTRAINT `fk_batch_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `fk_cert_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cert_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `coupons`
--
ALTER TABLE `coupons`
  ADD CONSTRAINT `fk_coupon_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `fk_course_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `course_faqs`
--
ALTER TABLE `course_faqs`
  ADD CONSTRAINT `fk_faq_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_learning_points`
--
ALTER TABLE `course_learning_points`
  ADD CONSTRAINT `fk_lp_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_requirements`
--
ALTER TABLE `course_requirements`
  ADD CONSTRAINT `fk_req_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_reviews`
--
ALTER TABLE `course_reviews`
  ADD CONSTRAINT `fk_review_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `demo_class_registrations`
--
ALTER TABLE `demo_class_registrations`
  ADD CONSTRAINT `fk_dcr_class` FOREIGN KEY (`demo_class_id`) REFERENCES `demo_classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dcr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `fk_enr_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_enr_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_enr_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `job_skills`
--
ALTER TABLE `job_skills`
  ADD CONSTRAINT `fk_skill_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lessons`
--
ALTER TABLE `lessons`
  ADD CONSTRAINT `fk_lesson_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_answers`
--
ALTER TABLE `lesson_answers`
  ADD CONSTRAINT `fk_la_question` FOREIGN KEY (`question_id`) REFERENCES `lesson_questions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_la_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `lesson_progress`
--
ALTER TABLE `lesson_progress`
  ADD CONSTRAINT `fk_progress_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_progress_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_questions`
--
ALTER TABLE `lesson_questions`
  ADD CONSTRAINT `fk_lq_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_lq_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `live_classes`
--
ALTER TABLE `live_classes`
  ADD CONSTRAINT `fk_lc_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lc_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lc_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `mentor_students`
--
ALTER TABLE `mentor_students`
  ADD CONSTRAINT `fk_ms_mentor` FOREIGN KEY (`mentor_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ms_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `modules`
--
ALTER TABLE `modules`
  ADD CONSTRAINT `fk_module_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_order_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_item_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  ADD CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `path_courses`
--
ALTER TABLE `path_courses`
  ADD CONSTRAINT `fk_pc_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pc_path` FOREIGN KEY (`path_id`) REFERENCES `learning_paths` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_pay_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pay_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pay_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payment_events`
--
ALTER TABLE `payment_events`
  ADD CONSTRAINT `fk_event_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  ADD CONSTRAINT `fk_ans_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ans_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD CONSTRAINT `fk_qa_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_qa_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_options`
--
ALTER TABLE `quiz_options`
  ADD CONSTRAINT `fk_qo_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `fk_qq_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `referrals`
--
ALTER TABLE `referrals`
  ADD CONSTRAINT `fk_ref_referred` FOREIGN KEY (`referred_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ref_referrer` FOREIGN KEY (`referrer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_student_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `fk_sub_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sub_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teacher_batches`
--
ALTER TABLE `teacher_batches`
  ADD CONSTRAINT `fk_tb_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tb_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teacher_expertise`
--
ALTER TABLE `teacher_expertise`
  ADD CONSTRAINT `fk_expertise_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_user_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_user_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_user_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `video_assets`
--
ALTER TABLE `video_assets`
  ADD CONSTRAINT `fk_video_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `fk_wish_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wish_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
