CREATE TABLE "collection_user_mapping" (
	"collectionEntityId" varchar NOT NULL,
	"userId" varchar NOT NULL,
	"role" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collection_user_mapping" ADD CONSTRAINT "collection_user_mapping_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;