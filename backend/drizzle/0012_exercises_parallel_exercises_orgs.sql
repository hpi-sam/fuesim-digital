ALTER TABLE "exercise_entity" DROP CONSTRAINT "exercise_entity_user_users_id_fk";
--> statement-breakpoint
ALTER TABLE "parallel_exercise" DROP CONSTRAINT "parallel_exercise_user_users_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD COLUMN "organisationId" uuid;--> statement-breakpoint
ALTER TABLE "parallel_exercise" ADD COLUMN "organisationId" uuid;--> statement-breakpoint
INSERT INTO "organisation" ("name", "personalOrganisationOf")
select 'Private Inhalte', "id"
from users on conflict do nothing;
--> statement-breakpoint
UPDATE "exercise_entity" SET "organisationId" = (select "id" from "organisation" where "personalOrganisationOf" = "exercise_entity"."user" limit 1) WHERE "exercise_entity"."user" IS NOT NULL;
--> statement-breakpoint
UPDATE "parallel_exercise" SET "organisationId" = (select "id" from "organisation" where "personalOrganisationOf" = "parallel_exercise"."user" limit 1);
--> statement-breakpoint
ALTER TABLE "parallel_exercise" ALTER COLUMN "organisationId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise_entity" ADD CONSTRAINT "exercise_entity_organisationId_organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parallel_exercise" ADD CONSTRAINT "parallel_exercise_organisationId_organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_entity" DROP COLUMN "user";--> statement-breakpoint
ALTER TABLE "parallel_exercise" DROP COLUMN "user";
