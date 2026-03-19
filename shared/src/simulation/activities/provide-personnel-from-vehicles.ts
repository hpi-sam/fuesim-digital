import { z } from 'zod';
import type {
    SimulatedRegion,
    ResourceDescription,
} from '../../models/index.js';
import {
    newVehicleResource,
    resourceDescriptionSchema,
    addResourceDescription,
    greaterEqualResourceDescription,
} from '../../models/index.js';
import type { ExerciseState } from '../../state.js';
import type { UUID } from '../../utils/index.js';
import { uuidSchema, StrictObject } from '../../utils/index.js';
import { newResourceRequiredEvent } from '../events/index.js';
import { sendSimulationEvent } from '../events/utils.js';
import { tryGetElement } from '../../store/action-reducers/utils/index.js';
import type { SimulationActivity } from './simulation-activity.js';
import { simulationActivityStateSchema } from './simulation-activity.js';
import type { UnloadVehicleActivityState } from './unload-vehicle.js';

export const providePersonnelFromVehiclesActivitySchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('providePersonnelFromVehiclesActivity'),
    requiredPersonnelCounts: resourceDescriptionSchema,
    vehiclePriorities: z.array(uuidSchema),
    key: z.string(),
});
export type ProvidePersonnelFromVehiclesActivityState = z.infer<
    typeof providePersonnelFromVehiclesActivitySchema
>;

export function newProvidePersonnelFromVehiclesActivityState(
    id: UUID,
    requiredPersonnelCounts: ResourceDescription,
    vehiclePriorities: UUID[],
    key: string
): ProvidePersonnelFromVehiclesActivityState {
    return {
        id,
        type: 'providePersonnelFromVehiclesActivity',
        requiredPersonnelCounts,
        vehiclePriorities,
        key,
    };
}

export const providePersonnelFromVehiclesActivity: SimulationActivity<ProvidePersonnelFromVehiclesActivityState> =
    {
        activityStateSchema: providePersonnelFromVehiclesActivitySchema,
        tick(
            draftState,
            simulatedRegion,
            activityState,
            _tickInterval,
            terminate
        ) {
            // We count personnel of unloading vehicles as provided because it should be available shortly.
            let availablePersonnel = personnelInUnloadingVehicles(
                draftState,
                simulatedRegion
            );
            const missingPersonnel = activityState.requiredPersonnelCounts;

            const vehiclePriorities = activityState.vehiclePriorities
                .map((id) => personnelInVehicleTemplate(draftState, id))
                .filter(
                    (
                        priority
                    ): priority is {
                        vehicleType: string;
                        vehiclePersonnel: ResourceDescription;
                    } => priority.vehicleType !== undefined
                );
            const missingVehicleCounts: ResourceDescription = {};

            const personnelStillMissing = ([personnelType, personnelCount]: [
                string,
                number,
            ]) => personnelCount > (availablePersonnel[personnelType] ?? 0);

            while (
                !greaterEqualResourceDescription(
                    availablePersonnel,
                    missingPersonnel
                )
            ) {
                const minRequiredVehiclePriorities = StrictObject.entries(
                    missingPersonnel
                )
                    .filter(personnelStillMissing)
                    .map(([personnelType]) =>
                        vehiclePriorities.findIndex(
                            // Match requested personnel type exactly, no better personnel is accepted as substitute
                            ({ vehiclePersonnel: personnel }) =>
                                (personnel[personnelType] ?? 0) > 0
                        )
                    );
                // We use max here because we need the vehicle with the highest value in this list anyways and might
                // save 'smaller' vehicles of higher priority that would be extra if we used min
                const selectedTemplateIndex = Math.max(
                    ...minRequiredVehiclePriorities
                );
                if (selectedTemplateIndex === -1) {
                    // The rest of the personnel needs cannot be satisfied with the allowed vehicle templates. They are ignored for now.
                    break;
                }
                const { vehicleType, vehiclePersonnel } =
                    vehiclePriorities[selectedTemplateIndex]!;
                missingVehicleCounts[vehicleType] =
                    (missingVehicleCounts[vehicleType] ?? 0) + 1;
                availablePersonnel = addResourceDescription(
                    availablePersonnel,
                    vehiclePersonnel
                );
            }

            const event = newResourceRequiredEvent(
                simulatedRegion.id,
                newVehicleResource(missingVehicleCounts),
                activityState.key
            );
            sendSimulationEvent(simulatedRegion, event);

            terminate();
        },
    };

function personnelInVehicleTemplate(
    draftState: ExerciseState,
    templateId: UUID
): {
    vehicleType: string | undefined;
    vehiclePersonnel: ResourceDescription;
} {
    const resource: ResourceDescription = {};
    const template = draftState.vehicleTemplates[templateId];
    if (template) {
        template.personnelTemplateIds.forEach((personnelTemplateId) => {
            const personnelTemplate =
                draftState.personnelTemplates[personnelTemplateId];
            if (!personnelTemplate) return;
            resource[personnelTemplate.personnelType] ??= 0;
            resource[personnelTemplate.personnelType]!++;
        });
    }
    return { vehicleType: template?.vehicleType, vehiclePersonnel: resource };
}

function personnelInUnloadingVehicles(
    draftState: ExerciseState,
    simulatedRegion: SimulatedRegion
): ResourceDescription {
    const resource: ResourceDescription = {};
    StrictObject.values(simulatedRegion.activities)
        .filter(
            (a): a is UnloadVehicleActivityState =>
                a.type === 'unloadVehicleActivity'
        )
        .flatMap((activity) =>
            StrictObject.keys(
                tryGetElement(draftState, 'vehicle', activity.vehicleId)
                    ?.personnelIds ?? {}
            )
        )
        .map(
            (personnelId) =>
                tryGetElement(draftState, 'personnel', personnelId)
                    ?.personnelType
        )
        .filter((personnelType) => personnelType !== undefined)
        .forEach((personnelType) => {
            resource[personnelType] ??= 0;
            resource[personnelType]++;
        });
    return resource;
}
