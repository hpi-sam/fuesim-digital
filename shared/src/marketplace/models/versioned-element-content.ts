import z from "zod";
import { alarmGroupSchema } from "../../models/alarm-group.js";
import { vehicleTemplateSchema } from "../../models/vehicle-template.js";

export const versionedElementContentSchema = z.union([
    vehicleTemplateSchema,
    alarmGroupSchema,
]);

export type VersionedElementContent = z.infer<
    typeof versionedElementContentSchema
>;
