CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `analysis` (
	`id` text PRIMARY KEY NOT NULL,
	`consultation_id` text NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`extracted` text,
	`ratios` text,
	`error` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`consultation_id`) REFERENCES `consultation`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `analysis_consultation_id_unique` ON `analysis` (`consultation_id`);--> statement-breakpoint
CREATE TABLE `answer` (
	`consultation_id` text NOT NULL,
	`question_id` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`consultation_id`, `question_id`),
	FOREIGN KEY (`consultation_id`) REFERENCES `consultation`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `appointment` (
	`id` text PRIMARY KEY NOT NULL,
	`consultant_id` text NOT NULL,
	`company_id` text NOT NULL,
	`consultation_id` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`status` text DEFAULT 'reservada' NOT NULL,
	`notes` text,
	`reminded_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`consultant_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`consultation_id`) REFERENCES `consultation`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `appointment_consultant_idx` ON `appointment` (`consultant_id`,`starts_at`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `availability` (
	`id` text PRIMARY KEY NOT NULL,
	`consultant_id` text NOT NULL,
	`weekday` integer NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	FOREIGN KEY (`consultant_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `company` (
	`id` text PRIMARY KEY NOT NULL,
	`nit` text NOT NULL,
	`name` text NOT NULL,
	`country` text DEFAULT 'CO' NOT NULL,
	`consent_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company_member` (
	`company_id` text NOT NULL,
	`user_id` text NOT NULL,
	PRIMARY KEY(`company_id`, `user_id`),
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `consultation` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`status` text DEFAULT 'clasificar' NOT NULL,
	`niif_group` integer,
	`group_reason` text,
	`classification_input` text,
	`flags` text NOT NULL,
	`diagnostic_score` real,
	`analysis_score` real,
	`final_score` real,
	`needs_consultant` integer,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `consultation_company_idx` ON `consultation` (`company_id`);--> statement-breakpoint
CREATE TABLE `finding` (
	`id` text PRIMARY KEY NOT NULL,
	`consultation_id` text NOT NULL,
	`source` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`niif_section` text NOT NULL,
	`severity` text NOT NULL,
	`recommendation` text NOT NULL,
	`lesson` text,
	FOREIGN KEY (`consultation_id`) REFERENCES `consultation`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `finding_consultation_idx` ON `finding` (`consultation_id`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`user_id` text NOT NULL,
	`lesson_slug` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_slug`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `question` (
	`id` text PRIMARY KEY NOT NULL,
	`dimension` text NOT NULL,
	`text` text NOT NULL,
	`help` text NOT NULL,
	`gap` text NOT NULL,
	`fix` text NOT NULL,
	`weight` integer NOT NULL,
	`requires_flag` text,
	`groups` text NOT NULL,
	`niif_section` text NOT NULL,
	`lesson` text NOT NULL,
	`sort_order` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `upload` (
	`id` text PRIMARY KEY NOT NULL,
	`consultation_id` text NOT NULL,
	`file_name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`consultation_id`) REFERENCES `consultation`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'empresa' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
