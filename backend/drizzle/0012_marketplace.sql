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
INSERT INTO "organisation_membership" ("organisationId", "userId", "role")
select "id", "personalOrganisationOf", 'admin'
from "organisation" on conflict do nothing;
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
--> statement-breakpoint

ALTER TABLE "parallel_exercise" ADD COLUMN "templateStateString" json;
--> statement-breakpoint
UPDATE "parallel_exercise" pe
SET "templateStateString" = (
    SELECT
        ee."currentStateString"
    FROM
        "exercise_entity" ee
    WHERE
        ee."templateId" = pe."templateId"
);
--> statement-breakpoint
ALTER TABLE "parallel_exercise" ALTER COLUMN "templateStateString"
    SET NOT NULL;

--> statement-breakpoint

CREATE TYPE "public"."collection_visibility_enum" AS ENUM('public', 'private', 'embedded');--> statement-breakpoint
CREATE TABLE "collection_dependency_mapping" (
	"dependentCollectionEntityId" varchar NOT NULL,
	"dependentCollectionVersionId" varchar NOT NULL,
	"collectionEntityId" varchar NOT NULL,
	"collectionVersionId" varchar NOT NULL,
	CONSTRAINT "unique_collection_dependency" UNIQUE("dependentCollectionVersionId","collectionEntityId")
);
--> statement-breakpoint
CREATE TABLE "collection_join_codes" (
	"code" varchar PRIMARY KEY NOT NULL,
	"collection" varchar NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_organisation_mapping" (
	"collection" varchar NOT NULL,
	"organisationId" uuid NOT NULL,
	"owner" boolean DEFAULT false NOT NULL,
	CONSTRAINT "collection_organisation_mapping_collection_organisationId_pk" PRIMARY KEY("collection","organisationId")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"versionId" varchar PRIMARY KEY NOT NULL,
	"entityId" varchar NOT NULL,
	"version" integer NOT NULL,
	"stateVersion" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"editedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"title" varchar NOT NULL,
	"description" varchar NOT NULL,
	"visibility" "collection_visibility_enum" DEFAULT 'private' NOT NULL,
	"draftState" boolean NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	CONSTRAINT "collections_versionId_unique" UNIQUE("versionId"),
	CONSTRAINT "unique_collection_version" UNIQUE("entityId","version")
);
--> statement-breakpoint
CREATE TABLE "element_to_collection_mapping" (
	"collectionEntityId" varchar NOT NULL,
	"collectionVersionId" varchar NOT NULL,
	"elementEntityId" varchar NOT NULL,
	"elementVersionId" uuid NOT NULL,
	"isBaseReference" boolean DEFAULT false,
	CONSTRAINT "unique_element_collection_mapping" UNIQUE("collectionVersionId","elementVersionId"),
	CONSTRAINT "unique_element_collection_mapping_2" UNIQUE("collectionVersionId","elementEntityId")
);
--> statement-breakpoint
CREATE TABLE "elements" (
	"versionId" uuid PRIMARY KEY NOT NULL,
	"entityId" varchar NOT NULL,
	"version" integer NOT NULL,
	"stateVersion" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"editedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"title" varchar NOT NULL,
	"description" varchar NOT NULL,
	"content" json NOT NULL,
	CONSTRAINT "elements_versionId_unique" UNIQUE("versionId"),
	CONSTRAINT "unique_template_version" UNIQUE("entityId","version"),
	CONSTRAINT "unique_template_id" UNIQUE("entityId","versionId")
);
--> statement-breakpoint
ALTER TABLE "collection_dependency_mapping" ADD CONSTRAINT "collection_dependency_mapping_dependentCollectionVersionId_collections_versionId_fk" FOREIGN KEY ("dependentCollectionVersionId") REFERENCES "public"."collections"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_dependency_mapping" ADD CONSTRAINT "collection_dependency_mapping_collectionVersionId_collections_versionId_fk" FOREIGN KEY ("collectionVersionId") REFERENCES "public"."collections"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_organisation_mapping" ADD CONSTRAINT "collection_organisation_mapping_organisationId_organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_to_collection_mapping" ADD CONSTRAINT "element_to_collection_mapping_collectionVersionId_collections_versionId_fk" FOREIGN KEY ("collectionVersionId") REFERENCES "public"."collections"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_to_collection_mapping" ADD CONSTRAINT "element_to_collection_mapping_elementVersionId_elements_versionId_fk" FOREIGN KEY ("elementVersionId") REFERENCES "public"."elements"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
