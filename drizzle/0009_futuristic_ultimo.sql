ALTER TABLE `shorts` ADD `articleId` int;--> statement-breakpoint
ALTER TABLE `shorts` ADD `youtubeId` varchar(50);--> statement-breakpoint
ALTER TABLE `shorts` ADD `sourceType` enum('manual','article','youtube','ai') DEFAULT 'manual' NOT NULL;