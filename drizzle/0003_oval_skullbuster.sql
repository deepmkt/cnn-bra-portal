CREATE TABLE `article_similarity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`similarArticleId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `article_similarity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`iconEmoji` varchar(10) NOT NULL DEFAULT '🏆',
	`requirement` varchar(100) NOT NULL,
	`requiredValue` int NOT NULL DEFAULT 1,
	`pointsReward` int NOT NULL DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `badges_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `point_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` enum('read_article','post_comment','share_article','submit_ugc','ugc_approved','daily_login','streak_bonus','quiz_complete') NOT NULL,
	`points` int NOT NULL,
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `point_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ugc_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100) DEFAULT 'GERAL',
	`imageUrl` text,
	`videoUrl` text,
	`location` varchar(300),
	`status` enum('pending','approved','rejected','published') NOT NULL DEFAULT 'pending',
	`reviewNote` text,
	`reviewedBy` int,
	`publishedArticleId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ugc_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_article_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`articleId` int NOT NULL,
	`interactionType` enum('view','read_full','comment','share','like') NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_article_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`articlesRead` int NOT NULL DEFAULT 0,
	`commentsPosted` int NOT NULL DEFAULT 0,
	`sharesCount` int NOT NULL DEFAULT 0,
	`ugcSubmissions` int NOT NULL DEFAULT 0,
	`streak` int NOT NULL DEFAULT 0,
	`lastActiveDate` varchar(10),
	`level` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_points_userId_unique` UNIQUE(`userId`)
);
