CREATE TABLE "chart_explanation" (
	"id" text PRIMARY KEY NOT NULL,
	"consultation_id" text NOT NULL,
	"chart_key" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "chart_explanation_consultation_id_chart_key_unique" UNIQUE("consultation_id","chart_key")
);
--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "plan" text DEFAULT 'gratis' NOT NULL;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "plan_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chart_explanation" ADD CONSTRAINT "chart_explanation_consultation_id_consultation_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultation"("id") ON DELETE cascade ON UPDATE no action;