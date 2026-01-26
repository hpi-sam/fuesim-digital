ALTER TABLE "exercise_entity" ADD COLUMN "user" varchar;--> statement-breakpoint
ALTER TABLE "exercise_template" ADD COLUMN "user" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD CONSTRAINT "exercise_entity_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_template" ADD CONSTRAINT "exercise_template_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;