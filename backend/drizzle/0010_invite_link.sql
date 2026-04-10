CREATE TABLE "organisation_invite_link" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"token" varchar NOT NULL,
	"organisationId" uuid NOT NULL,
	"expirationDate" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organisation_membership" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organisation_invite_link" ADD CONSTRAINT "organisation_invite_link_organisationId_organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisation"("id") ON DELETE cascade ON UPDATE no action;