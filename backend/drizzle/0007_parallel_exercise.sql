CREATE TABLE "parallel_exercise" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"templateId" uuid NOT NULL,
	"participantKey" char(7) NOT NULL,
	"joinViewportId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parallel_exercise" ADD CONSTRAINT "parallel_exercise_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parallel_exercise" ADD CONSTRAINT "parallel_exercise_templateId_exercise_template_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."exercise_template"("id") ON DELETE cascade ON UPDATE no action;