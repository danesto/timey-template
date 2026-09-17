CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`staff_id` integer NOT NULL,
	`service_id` integer NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_note` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`blocked_until` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_token` ON `bookings` (`token`);--> statement-breakpoint
CREATE INDEX `bookings_staff_window` ON `bookings` (`staff_id`,`starts_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_no_double_booking` ON `bookings` (`staff_id`,`starts_at`) WHERE status = 'confirmed';--> statement-breakpoint
CREATE TABLE `business` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`timezone` text NOT NULL,
	`slot_step_minutes` integer DEFAULT 15 NOT NULL,
	`cancellation_window_minutes` integer DEFAULT 120 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_staff` (
	`service_id` integer NOT NULL,
	`staff_id` integer NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_staff_pair` ON `service_staff` (`service_id`,`staff_id`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`duration_minutes` integer NOT NULL,
	`buffer_minutes` integer DEFAULT 0 NOT NULL,
	`price_cents` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`role` text
);
--> statement-breakpoint
CREATE TABLE `time_off` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_id` integer NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`reason` text,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `time_off_staff` ON `time_off` (`staff_id`,`starts_at`);--> statement-breakpoint
CREATE TABLE `working_hours` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staff_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`start_minute` integer NOT NULL,
	`end_minute` integer NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `working_hours_staff` ON `working_hours` (`staff_id`,`weekday`);