CREATE TABLE `short_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shortId` int NOT NULL,
	`userId` int,
	`authorName` varchar(200),
	`content` text NOT NULL,
	`likesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `short_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `short_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shortId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `short_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shorts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`category` varchar(100) NOT NULL DEFAULT 'GERAL',
	`duration` int NOT NULL DEFAULT 0,
	`authorId` int,
	`authorName` varchar(200),
	`status` enum('online','draft','review') NOT NULL DEFAULT 'draft',
	`viewCount` int NOT NULL DEFAULT 0,
	`likeCount` int NOT NULL DEFAULT 0,
	`shareCount` int NOT NULL DEFAULT 0,
	`commentCount` int NOT NULL DEFAULT 0,
	`isHighlight` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shorts_id` PRIMARY KEY(`id`)
);
