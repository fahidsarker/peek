CREATE TABLE "apps" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"icon_url" text NOT NULL,
	"public_url" text NOT NULL,
	"ping_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"last_ping_at" timestamp,
	"last_ping_status" text DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"allow_signups" boolean DEFAULT true NOT NULL,
	"weather_provider" text DEFAULT 'open-meteo' NOT NULL,
	"weather_lat" real,
	"weather_lon" real,
	"weather_city" text,
	"openweather_api_key" text,
	"weather_use_current_location" boolean DEFAULT false NOT NULL,
	"apps_compact_view" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"show_docker" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");