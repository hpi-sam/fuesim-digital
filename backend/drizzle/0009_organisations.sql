CREATE TYPE "organisation_membership_role" AS ENUM ('viewer', 'editor', 'admin');
CREATE TABLE "organisation_membership" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"userId" varchar NOT NULL,
	"organisationId" uuid NOT NULL,
	"role" "organisation_membership_role",
	"joinedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organisation_membership_userId_organisationId_unique" UNIQUE("userId","organisationId")
);
--> statement-breakpoint
CREATE TABLE "organisation" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organisation_membership" ADD CONSTRAINT "organisation_membership_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_membership" ADD CONSTRAINT "organisation_membership_organisationId_organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organisation_membership_organisationId_role_index" ON "organisation_membership" USING btree ("organisationId","role");
