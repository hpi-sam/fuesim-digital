CREATE TABLE "migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" bigint NOT NULL,
	"name" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "action_wrapper_entity" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"emitterId" uuid,
	"index" bigint NOT NULL,
	"actionString" json NOT NULL,
	"exerciseId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_wrapper_entity" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"tickCounter" integer DEFAULT 0 NOT NULL,
	"initialStateString" json NOT NULL,
	"participantId" char(6) NOT NULL,
	"trainerId" char(8) NOT NULL,
	"currentStateString" json NOT NULL,
	"stateVersion" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_wrapper_entity" ADD CONSTRAINT "FK_180a58767f06b503216ba2b0982" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercise_wrapper_entity"("id") ON DELETE cascade ON UPDATE cascade;