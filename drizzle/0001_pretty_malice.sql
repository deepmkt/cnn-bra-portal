CREATE TABLE `ads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('google','custom') NOT NULL DEFAULT 'custom',
	`placement` enum('horizontal','lateral') NOT NULL DEFAULT 'horizontal',
	`imageUrl` text,
	`link` text,
	`sponsor` varchar(255),
	`duration` int NOT NULL DEFAULT 5000,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`excerpt` text,
	`content` text,
	`category` varchar(100) NOT NULL DEFAULT 'GERAL',
	`imageUrl` text,
	`status` enum('online','draft') NOT NULL DEFAULT 'draft',
	`isHero` boolean NOT NULL DEFAULT false,
	`authorId` int,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `ticker_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticker_items_id` PRIMARY KEY(`id`)
);
