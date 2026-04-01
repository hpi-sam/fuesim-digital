ALTER TABLE "collection_user_mapping" RENAME COLUMN "collectionEntityId" TO "collection";--> statement-breakpoint
ALTER TABLE "collection_user_mapping" DROP CONSTRAINT "unique_collection_user";--> statement-breakpoint
ALTER TABLE "collection_user_mapping" ADD CONSTRAINT "unique_collection_user" UNIQUE("userId","collection");