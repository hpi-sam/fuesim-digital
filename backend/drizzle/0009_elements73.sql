ALTER TABLE "collections" ADD COLUMN "editedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "elements" ADD COLUMN "editedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "createdBy";--> statement-breakpoint
ALTER TABLE "elements" DROP COLUMN "createdBy";