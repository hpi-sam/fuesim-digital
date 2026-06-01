ALTER TABLE "exercise_entity"
    ADD CONSTRAINT "exercise_entity_participantKey_unique" UNIQUE ("participantKey");--> statement-breakpoint
ALTER TABLE "exercise_entity"
    ADD CONSTRAINT "exercise_entity_trainerKey_unique" UNIQUE ("trainerKey");--> statement-breakpoint
ALTER TABLE "parallel_exercise"
    ADD CONSTRAINT "parallel_exercise_participantKey_unique" UNIQUE ("participantKey");

update exercise_entity
set "initialStateString" = jsonb_set(to_jsonb("initialStateString"), '{type}', '"template"'),
    "currentStateString" = jsonb_set(to_jsonb("currentStateString"), '{type}', '"template"')
where "templateId" IS NOT NULL;
