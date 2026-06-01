CREATE TYPE "public"."log_level" AS ENUM('debug', 'info', 'warn', 'error');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('ios', 'android');--> statement-breakpoint
CREATE TABLE "apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon_url" varchar(500),
	"api_key" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "apps_slug_unique" UNIQUE("slug"),
	CONSTRAINT "apps_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "download_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" integer NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"downloaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" integer NOT NULL,
	"trace_id" varchar(64) NOT NULL,
	"span_id" varchar(64) NOT NULL,
	"parent_span_id" varchar(64),
	"level" "log_level" NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_data" jsonb,
	"app_version" varchar(50),
	"device_id" varchar(128) NOT NULL,
	"os" varchar(20),
	"os_version" varchar(20),
	"device_model" varchar(100),
	"status" varchar(10),
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" integer NOT NULL,
	"version" varchar(50) NOT NULL,
	"platform" "platform" NOT NULL,
	"download_url" varchar(1000) NOT NULL,
	"file_size" integer,
	"changelog" text,
	"is_active" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "download_stats" ADD CONSTRAINT "download_stats_version_id_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versions" ADD CONSTRAINT "versions_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_logs_app_id" ON "logs" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "idx_logs_trace_id" ON "logs" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "idx_logs_level" ON "logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_logs_created_at" ON "logs" USING btree ("created_at");