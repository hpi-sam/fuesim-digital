CREATE TYPE "organisation_membership_role" AS ENUM ('viewer', 'editor', 'admin');
--> statement-breakpoint
CREATE TABLE "organisation_invite_link" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"token" varchar NOT NULL,
	"organisationId" uuid NOT NULL,
	"expirationDate" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisation_membership" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"userId" varchar NOT NULL,
	"organisationId" uuid NOT NULL,
	"role" "organisation_membership_role" NOT NULL,
	"joinedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organisation_membership_userId_organisationId_unique" UNIQUE("userId","organisationId")
);
--> statement-breakpoint
CREATE TABLE "organisation" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"personalOrganisationOf" varchar,
	CONSTRAINT "organisation_personalOrganisationOf_unique" UNIQUE("personalOrganisationOf")
);
--> statement-breakpoint
ALTER TABLE "exercise_template" DROP CONSTRAINT "exercise_template_user_users_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_template" ADD COLUMN "organisationId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "organisation_invite_link" ADD CONSTRAINT "organisation_invite_link_organisationId_organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_membership" ADD CONSTRAINT "organisation_membership_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_membership" ADD CONSTRAINT "organisation_membership_organisationId_organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation" ADD CONSTRAINT "organisation_personalOrganisationOf_users_id_fk" FOREIGN KEY ("personalOrganisationOf") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organisation_membership_organisationId_role_index" ON "organisation_membership" USING btree ("organisationId","role");--> statement-breakpoint
ALTER TABLE "exercise_template" ADD CONSTRAINT "exercise_template_organisationId_organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "organisation" ("name", "personalOrganisationOf")
select 'Private Inhalte', "id"
from users on conflict do nothing;
--> statement-breakpoint
UPDATE "exercise_template" SET "organisationId" = (select "id" from "organisation" where "personalOrganisationOf" = "exercise_template"."user" limit 1);
--> statement-breakpoint
ALTER TABLE "exercise_template" DROP COLUMN "user";
