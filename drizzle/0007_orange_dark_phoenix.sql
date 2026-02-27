ALTER TABLE `ads` MODIFY COLUMN `placement` enum('horizontal','lateral','middle') NOT NULL DEFAULT 'horizontal';--> statement-breakpoint
ALTER TABLE `ads` ADD `adCode` text;--> statement-breakpoint
ALTER TABLE `ads` ADD `position` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `isFeatured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `articles` ADD `state` varchar(2);