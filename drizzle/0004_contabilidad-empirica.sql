CREATE TABLE "accountant_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"consultation_id" text NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "accountant_invite_consultation_id_unique" UNIQUE("consultation_id"),
	CONSTRAINT "accountant_invite_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "source" text DEFAULT 'archivos' NOT NULL;--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "figures" jsonb;--> statement-breakpoint
ALTER TABLE "consultation" ADD COLUMN "eeff" text;--> statement-breakpoint
ALTER TABLE "consultation" ADD COLUMN "waiting_since" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consultation" ADD COLUMN "waiting_reminders" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "upload" ADD COLUMN "invite_id" text;--> statement-breakpoint
ALTER TABLE "accountant_invite" ADD CONSTRAINT "accountant_invite_consultation_id_consultation_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_invite_id_accountant_invite_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."accountant_invite"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- La pregunta de sí o no "¿Tiene estados financieros?" pasa a ser cómo lleva la contabilidad y qué tiene del último cierre
UPDATE "consultation" SET "eeff" = CASE "flags"->>'tieneEEFF' WHEN 'true' THEN 'completos' WHEN 'false' THEN 'empirica' END WHERE "flags" ? 'tieneEEFF';--> statement-breakpoint
UPDATE "consultation" SET "flags" = "flags" - 'tieneEEFF' WHERE "flags" ? 'tieneEEFF';
