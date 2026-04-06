ALTER TABLE "exercise_entity" RENAME COLUMN "user" TO "userId";--> statement-breakpoint
ALTER TABLE "exercise_template" RENAME COLUMN "user" TO "userId";--> statement-breakpoint
ALTER TABLE "parallel_exercise" RENAME COLUMN "user" TO "userId";--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "createdAt" SET DATA TYPE timestamp(3) USING "createdAt"::timestamp(3);--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "expiresAt" SET DATA TYPE timestamp(3) USING "expiresAt"::timestamp(3);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp(3) USING "updatedAt"::timestamp(3);