CREATE TABLE "exercise_template" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"lastExerciseCreatedAt" timestamp with time zone,
	"name" varchar NOT NULL,
	"description" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD COLUMN "templateId" uuid;--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD CONSTRAINT "exercise_entity_templateId_exercise_template_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."exercise_template"("id") ON DELETE cascade ON UPDATE no action;