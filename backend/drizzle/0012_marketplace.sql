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
	"expiresAt" timestamp with time zone NOT NULL,
	CONSTRAINT "collection_join_codes_collection_unique" UNIQUE("collection")
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
	"visibility" varchar DEFAULT 'private' NOT NULL,
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
	"elementVersionId" varchar NOT NULL,
	"isBaseReference" boolean DEFAULT false,
	CONSTRAINT "unique_element_collection_mapping" UNIQUE("collectionVersionId","elementVersionId"),
	CONSTRAINT "unique_element_collection_mapping_2" UNIQUE("collectionVersionId","elementEntityId")
);
--> statement-breakpoint
CREATE TABLE "elements" (
	"versionId" varchar PRIMARY KEY NOT NULL,
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
ALTER TABLE "action_entity" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "exercise_entity" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "exercise_template" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organisation_invite_link" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organisation_membership" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organisation" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "parallel_exercise" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "collection_dependency_mapping" ADD CONSTRAINT "collection_dependency_mapping_dependentCollectionVersionId_collections_versionId_fk" FOREIGN KEY ("dependentCollectionVersionId") REFERENCES "public"."collections"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_dependency_mapping" ADD CONSTRAINT "collection_dependency_mapping_collectionVersionId_collections_versionId_fk" FOREIGN KEY ("collectionVersionId") REFERENCES "public"."collections"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_organisation_mapping" ADD CONSTRAINT "collection_organisation_mapping_organisationId_organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."organisation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_to_collection_mapping" ADD CONSTRAINT "element_to_collection_mapping_collectionVersionId_collections_versionId_fk" FOREIGN KEY ("collectionVersionId") REFERENCES "public"."collections"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_to_collection_mapping" ADD CONSTRAINT "element_to_collection_mapping_elementVersionId_elements_versionId_fk" FOREIGN KEY ("elementVersionId") REFERENCES "public"."elements"("versionId") ON DELETE cascade ON UPDATE no action;