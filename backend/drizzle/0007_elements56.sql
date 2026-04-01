CREATE TABLE "collection_dependency_mapping" (
	"collectionEntityId" varchar NOT NULL,
	"collectionVersionId" varchar NOT NULL,
	"dependentCollectionEntityId" varchar NOT NULL,
	"dependentCollectionVersionId" varchar NOT NULL,
	CONSTRAINT "unique_collection_dependency" UNIQUE("collectionVersionId","dependentCollectionVersionId")
);
--> statement-breakpoint
CREATE TABLE "collection_join_codes" (
	"code" char(12) PRIMARY KEY NOT NULL,
	"collection" varchar NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	CONSTRAINT "collection_join_codes_collection_unique" UNIQUE("collection")
);
--> statement-breakpoint
CREATE TABLE "exercise_element_sets" (
	"versionId" varchar PRIMARY KEY NOT NULL,
	"entityId" varchar NOT NULL,
	"version" integer NOT NULL,
	"stateVersion" integer NOT NULL,
	"createdBy" varchar DEFAULT 'unknown' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"title" varchar NOT NULL,
	"description" varchar NOT NULL,
	"visibility" varchar DEFAULT 'private' NOT NULL,
	"owner" varchar NOT NULL,
	"draftState" boolean NOT NULL,
	CONSTRAINT "exercise_element_sets_versionId_unique" UNIQUE("versionId"),
	CONSTRAINT "unique_set_version" UNIQUE("entityId","version"),
	CONSTRAINT "unique_set_id" UNIQUE("entityId","versionId")
);
--> statement-breakpoint
CREATE TABLE "exercise_element_to_set_mapping" (
	"setEntityId" varchar NOT NULL,
	"setVersionId" varchar NOT NULL,
	"elementEntityId" varchar NOT NULL,
	"elementVersionId" varchar NOT NULL,
	"isBaseReference" boolean DEFAULT false,
	CONSTRAINT "unique_element_set_mapping" UNIQUE("setVersionId","elementVersionId"),
	CONSTRAINT "unique_element_set_mapping_2" UNIQUE("setVersionId","elementEntityId")
);
--> statement-breakpoint
CREATE TABLE "exercise_element_templates" (
	"versionId" varchar PRIMARY KEY NOT NULL,
	"entityId" varchar NOT NULL,
	"version" integer NOT NULL,
	"stateVersion" integer NOT NULL,
	"createdBy" varchar DEFAULT 'unknown' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"title" varchar NOT NULL,
	"description" varchar NOT NULL,
	"content" json NOT NULL,
	CONSTRAINT "exercise_element_templates_versionId_unique" UNIQUE("versionId"),
	CONSTRAINT "unique_template_version" UNIQUE("entityId","version"),
	CONSTRAINT "unique_template_id" UNIQUE("entityId","versionId")
);
--> statement-breakpoint
ALTER TABLE "collection_dependency_mapping" ADD CONSTRAINT "collection_dependency_mapping_collectionVersionId_exercise_element_sets_versionId_fk" FOREIGN KEY ("collectionVersionId") REFERENCES "public"."exercise_element_sets"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_dependency_mapping" ADD CONSTRAINT "collection_dependency_mapping_dependentCollectionVersionId_exercise_element_sets_versionId_fk" FOREIGN KEY ("dependentCollectionVersionId") REFERENCES "public"."exercise_element_sets"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_element_to_set_mapping" ADD CONSTRAINT "exercise_element_to_set_mapping_setVersionId_exercise_element_sets_versionId_fk" FOREIGN KEY ("setVersionId") REFERENCES "public"."exercise_element_sets"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_element_to_set_mapping" ADD CONSTRAINT "exercise_element_to_set_mapping_elementVersionId_exercise_element_templates_versionId_fk" FOREIGN KEY ("elementVersionId") REFERENCES "public"."exercise_element_templates"("versionId") ON DELETE cascade ON UPDATE no action;