CREATE TABLE "collection_dependency_mapping" (
	"collectionEntityId" varchar NOT NULL,
	"collectionVersionId" varchar NOT NULL,
	"dependentCollectionEntityId" varchar NOT NULL,
	"dependentCollectionVersionId" varchar NOT NULL,
	CONSTRAINT "unique_collection_dependency" UNIQUE("collectionVersionId","dependentCollectionVersionId")
);
--> statement-breakpoint
CREATE TABLE "collection_join_codes" (
	"code" varchar PRIMARY KEY NOT NULL,
	"collection" varchar NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	CONSTRAINT "collection_join_codes_collection_unique" UNIQUE("collection")
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
	"elementCount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "collections_versionId_unique" UNIQUE("versionId"),
	CONSTRAINT "unique_set_version" UNIQUE("entityId","version"),
	CONSTRAINT "unique_set_id" UNIQUE("entityId","versionId")
);
--> statement-breakpoint
CREATE TABLE "collection_user_mapping" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"collection" varchar NOT NULL,
	"userId" varchar NOT NULL,
	"role" varchar NOT NULL,
	CONSTRAINT "unique_collection_user" UNIQUE("userId","collection")
);
--> statement-breakpoint
CREATE TABLE "element_to_collection_mapping" (
	"setEntityId" varchar NOT NULL,
	"setVersionId" varchar NOT NULL,
	"elementEntityId" varchar NOT NULL,
	"elementVersionId" varchar NOT NULL,
	"isBaseReference" boolean DEFAULT false,
	CONSTRAINT "unique_element_set_mapping" UNIQUE("setVersionId","elementVersionId"),
	CONSTRAINT "unique_element_set_mapping_2" UNIQUE("setVersionId","elementEntityId")
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
ALTER TABLE "collection_dependency_mapping" ADD CONSTRAINT "collection_dependency_mapping_collectionVersionId_collections_versionId_fk" FOREIGN KEY ("collectionVersionId") REFERENCES "public"."collections"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_dependency_mapping" ADD CONSTRAINT "collection_dependency_mapping_dependentCollectionVersionId_collections_versionId_fk" FOREIGN KEY ("dependentCollectionVersionId") REFERENCES "public"."collections"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_user_mapping" ADD CONSTRAINT "collection_user_mapping_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_to_collection_mapping" ADD CONSTRAINT "element_to_collection_mapping_setVersionId_collections_versionId_fk" FOREIGN KEY ("setVersionId") REFERENCES "public"."collections"("versionId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_to_collection_mapping" ADD CONSTRAINT "element_to_collection_mapping_elementVersionId_elements_versionId_fk" FOREIGN KEY ("elementVersionId") REFERENCES "public"."elements"("versionId") ON DELETE cascade ON UPDATE no action;