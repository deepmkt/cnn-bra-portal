CREATE TABLE `article_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text,
	`editorId` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `article_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int,
	`authorName` varchar(200),
	`content` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`parentId` int,
	`likesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalUrl` text NOT NULL,
	`optimizedUrl` text NOT NULL,
	`width` int,
	`height` int,
	`format` varchar(20),
	`quality` int,
	`sizeBytes` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `image_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(500) NOT NULL,
	`url` text NOT NULL,
	`fileKey` text NOT NULL,
	`mimeType` varchar(100),
	`sizeBytes` bigint,
	`width` int,
	`height` int,
	`alt` text,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_library_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('breaking','new_article','comment_reply','system') NOT NULL DEFAULT 'system',
	`title` varchar(300) NOT NULL,
	`message` text,
	`articleId` int,
	`isGlobal` boolean NOT NULL DEFAULT false,
	`targetUserId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reading_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`articleId` int NOT NULL,
	`category` varchar(100),
	`readDurationSeconds` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reading_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`articleCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`favoriteCategories` text,
	`notificationsEnabled` boolean NOT NULL DEFAULT true,
	`breakingNewsAlerts` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `articles` MODIFY COLUMN `status` enum('online','draft','review','scheduled') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','editor','journalist') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `articles` ADD `slug` varchar(600);--> statement-breakpoint
ALTER TABLE `articles` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `videoUrl` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `isBreaking` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `reviewerId` int;--> statement-breakpoint
ALTER TABLE `articles` ADD `shareCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `commentCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `readTimeMinutes` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `scheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `articles` ADD `publishedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `articles` ADD CONSTRAINT `articles_slug_unique` UNIQUE(`slug`);