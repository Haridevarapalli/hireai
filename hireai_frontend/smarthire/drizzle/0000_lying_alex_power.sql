CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`candidate_id` integer NOT NULL,
	`job_id` integer NOT NULL,
	`status` text DEFAULT 'Applied' NOT NULL,
	`match_score` integer,
	`applied_at` integer DEFAULT '"2026-06-02T19:43:31.486Z"' NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`company_name` text NOT NULL,
	`location` text NOT NULL,
	`salary` text NOT NULL,
	`type` text NOT NULL,
	`experience` text NOT NULL,
	`description` text NOT NULL,
	`requirements` text NOT NULL,
	`responsibilities` text NOT NULL,
	`benefits` text NOT NULL,
	`deadline` text NOT NULL,
	`recruiter_id` integer,
	`created_at` integer DEFAULT '"2026-06-02T19:43:31.486Z"' NOT NULL,
	FOREIGN KEY (`recruiter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`file_name` text,
	`extracted_name` text,
	`extracted_email` text,
	`extracted_phone` text,
	`education` text,
	`skills` text,
	`projects` text,
	`certifications` text,
	`overall_score` integer,
	`score_breakdown` text,
	`feedback` text,
	`raw_text` text,
	`created_at` integer DEFAULT '"2026-06-02T19:43:31.485Z"' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `saved_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`candidate_id` integer NOT NULL,
	`job_id` integer NOT NULL,
	`saved_at` integer DEFAULT '"2026-06-02T19:43:31.486Z"' NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`company_name` text,
	`created_at` integer DEFAULT '"2026-06-02T19:43:31.485Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);