CREATE TABLE "exercise_template" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastExerciseCreatedAt" timestamp with time zone,
	"name" varchar NOT NULL,
	"description" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD COLUMN "user" varchar;--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD COLUMN "lastUsedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD COLUMN "templateId" uuid;--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD COLUMN "baseTemplateId" uuid;--> statement-breakpoint
ALTER TABLE "exercise_template" ADD CONSTRAINT "exercise_template_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD CONSTRAINT "exercise_entity_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD CONSTRAINT "exercise_entity_templateId_exercise_template_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."exercise_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD CONSTRAINT "exercise_entity_baseTemplateId_exercise_template_id_fk" FOREIGN KEY ("baseTemplateId") REFERENCES "public"."exercise_template"("id") ON DELETE set null ON UPDATE no action;