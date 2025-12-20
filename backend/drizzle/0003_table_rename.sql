ALTER TABLE "action_wrapper_entity" RENAME TO "action_entity";--> statement-breakpoint
ALTER TABLE "exercise_wrapper_entity" RENAME TO "exercise_entity";--> statement-breakpoint
ALTER TABLE "action_entity" DROP CONSTRAINT "FK_180a58767f06b503216ba2b0982";
--> statement-breakpoint
ALTER TABLE "action_entity" ADD CONSTRAINT "FK_180a58767f06b503216ba2b0982" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercise_entity"("id") ON DELETE cascade ON UPDATE cascade;