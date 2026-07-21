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

