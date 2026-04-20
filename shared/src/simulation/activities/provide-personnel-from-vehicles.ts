import { z } from 'zod';
import type { ExerciseState } from '../../state.js';
import { sendSimulationEvent } from '../events/utils.js';
import {
    addResourceDescription,
    greaterEqualResourceDescription,
    type ResourceDescription,
    resourceDescriptionSchema,
} from '../../models/utils/resource-description.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
import { newResourceRequiredEvent } from '../events/resources-required.js';
import { newVehicleResource } from '../../models/utils/rescue-resource.js';
import type { SimulatedRegion } from '../../models/simulated-region.js';
import { tryGetElement } from '../../store/action-reducers/utils/get-element.js';
import type { UnloadVehicleActivityState } from './unload-vehicle.js';
import { simulationActivityStateSchema } from './simulation-activity.js';
import type { SimulationActivity } from './simulation-activity.js';

export const providePersonnelFromVehiclesActivitySchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('providePersonnelFromVehicleActivity'),
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
        type: 'providePersonnelFromVehicleActivity',
        requiredPersonnelCounts,
        vehiclePriorities,
        key,
    };
}

export const providePersonnelFromVehicleActivity: SimulationActivity<ProvidePersonnelFromVehiclesActivityState> =
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
                const minRequiredVehiclePriorities = TypeAssertedObject.entries(
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
    TypeAssertedObject.values(simulatedRegion.activities)
        .filter(
            (a): a is UnloadVehicleActivityState =>
                a.type === 'unloadVehicleActivity'
        )
        .flatMap((activity) =>
            TypeAssertedObject.keys(
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
