CREATE TABLE `trending_topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(300) NOT NULL,
	`topicNormalized` varchar(300),
	`approxTraffic` varchar(50),
	`trafficValue` int DEFAULT 0,
	`imageUrl` text,
	`imageSource` varchar(200),
	`relatedArticleTitle` varchar(500),
	`relatedArticleUrl` text,
	`relatedArticleSource` varchar(200),
	`linkedArticleId` int,
	`pubDate` timestamp,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trending_topics_id` PRIMARY KEY(`id`)
);
