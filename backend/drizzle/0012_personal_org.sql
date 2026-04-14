ALTER TABLE "users" DROP CONSTRAINT "users_personalOrganisationId_organisation_id_fk";
--> statement-breakpoint
ALTER TABLE "organisation" ADD COLUMN "personalOrganisationOf" varchar;--> statement-breakpoint
ALTER TABLE "organisation" ADD CONSTRAINT "organisation_personalOrganisationOf_users_id_fk" FOREIGN KEY ("personalOrganisationOf") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "personalOrganisationId";--> statement-breakpoint
ALTER TABLE "organisation" ADD CONSTRAINT "organisation_personalOrganisationOf_unique" UNIQUE("personalOrganisationOf");