CREATE TABLE `global_news_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalTitle` varchar(500) NOT NULL,
	`originalSource` varchar(300) NOT NULL,
	`originalUrl` text NOT NULL,
	`rewrittenTitle` varchar(500),
	`rewrittenExcerpt` text,
	`rewrittenContent` text,
	`imageUrl` text,
	`category` varchar(100) NOT NULL DEFAULT 'GLOBAL',
	`isPublished` boolean NOT NULL DEFAULT false,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `global_news_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(320) NOT NULL,
	`status` enum('active','unsubscribed') NOT NULL DEFAULT 'active',
	`source` varchar(100) DEFAULT 'website',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
);
