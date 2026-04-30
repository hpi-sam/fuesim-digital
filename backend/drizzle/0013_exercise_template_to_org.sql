INSERT INTO "organisation" ("name", "personalOrganisationOf")
select 'Private Inhalte', "id"
from users on conflict do nothing;
--> statement-breakpoint
ALTER TABLE "exercise_template" DROP CONSTRAINT "exercise_template_user_users_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_template"
    ADD COLUMN "organisationId" uuid;
--> statement-breakpoint
UPDATE "exercise_template" SET "organisationId" = (select "id" from "organisation" where "personalOrganisationOf" = "exercise_template"."user" limit 1);
--> statement-breakpoint
ALTER TABLE "exercise_template"
    ALTER COLUMN "organisationId" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "exercise_template"
    ADD CONSTRAINT "exercise_template_organisationId_organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisation" ("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "exercise_template" DROP COLUMN "user";

