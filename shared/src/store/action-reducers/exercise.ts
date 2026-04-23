import { Type } from 'class-transformer';
import {
    IsArray,
    ValidateNested,
    IsBoolean,
    IsInt,
    IsPositive,
    IsUUID,
} from 'class-validator';
import { WritableDraft } from 'immer';
import { changePosition } from '../../models/utils/position/position-helpers-mutable.js';
import { simulateAllRegions } from '../../simulation/utils/simulation.js';
import type { ExerciseState } from '../../state.js';
import type { ElementTypePluralMap } from '../../utils/element-type-plural-map.js';
import { elementTypePluralMap } from '../../utils/element-type-plural-map.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { getPatientVisibleStatus } from '../../models/patient.js';
import { createPersonnelTypeTag } from '../../models/utils/tag-helpers.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { IsLiteralUnion } from '../../utils/validators/is-literal-union.js';
import { PartialExport } from '../../export-import/file-format/partial-export.js';
import { getStatus } from '../../models/utils/health-points.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import type { Personnel } from '../../models/personnel.js';
import type { Vehicle } from '../../models/vehicle.js';
import {
    currentTransferOf,
    isInTransfer,
} from '../../models/utils/position/position-helpers.js';
import { type UUID, uuid, uuidValidationOptions } from '../../utils/uuid.js';
import { newTransferPositionFor } from '../../models/utils/position/transfer-position.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import { simulateAllTechnicalChallenges } from '../../models/technical-challenge/state-machine.js';
import { getTemplates } from '../../models/utils/template.js';
import { PatientUpdate } from './utils/patient-updates.js';
import {
    logPatientVisibleStatusChanged,
    logActive,
    logPatient,
} from './utils/log.js';
import { updateTreatments } from './utils/calculate-treatments.js';
import { letElementArrive } from './transfer.js';
import type { TransferableElementType } from './transfer.js';

export class PauseExerciseAction implements Action {
    @IsValue('[Exercise] Pause' as const)
    public readonly type = '[Exercise] Pause';
}

export class StartExerciseAction implements Action {
    @IsValue('[Exercise] Start' as const)
    public readonly type = '[Exercise] Start';
}

export class SetAutojoinViewportAction implements Action {
    @IsValue('[Exercise] Set autojoin viewport' as const)
    public readonly type = '[Exercise] Set autojoin viewport';

    @IsUUID(4, uuidValidationOptions)
    public readonly viewportId!: UUID;
}

export class ExerciseTickAction implements Action {
    @IsValue('[Exercise] Tick' as const)
    public readonly type = '[Exercise] Tick';

    @IsArray()
    @ValidateNested()
    @Type(() => PatientUpdate)
    public readonly patientUpdates!: readonly PatientUpdate[];

    /**
     * If true, it is updated which personnel and material treats which patient.
     * This shouldn't be done every tick, because else it could happen that personnel and material "jumps" too fast
     * between two patients. Keep in mind that the treatments are also updated e.g. if a patient/material/personnel etc.
     * is e.g. moved - completely independent from the ticks.
     * The performance optimization resulting from not refreshing the treatments every tick is probably very small in comparison
     * to skipping all patients that didn't change their status since the last treatment calculation
     * (via {@link Patient.visibleStatusChanged}).
     */
    @IsBoolean()
    public readonly refreshTreatments!: boolean;

    @IsInt()
    @IsPositive()
    public readonly tickInterval!: number;
}

export class ImportTemplatesAction implements Action {
    @IsValue('[Exercise] Import Templates' as const)
    public readonly type = '[Exercise] Import Templates';

    @IsLiteralUnion({ append: true, overwrite: true })
    public readonly mode!: 'append' | 'overwrite';

    @ValidateNested()
    @Type(() => PartialExport)
    public readonly partialExport!: PartialExport;
}

export namespace ExerciseActionReducers {
    export const pauseExercise: ActionReducer<PauseExerciseAction> = {
        action: PauseExerciseAction,
        reducer: (draftState) => {
            if (draftState.currentStatus !== 'running') {
                throw new ReducerError('Cannot pause not running exercise');
            }
            draftState.currentStatus = 'paused';
            return draftState;
        },
        rights: 'trainer',
    };

    export const startExercise: ActionReducer<StartExerciseAction> = {
        action: StartExerciseAction,
        reducer: (draftState) => {
            if (draftState.currentStatus === 'running') {
                throw new ReducerError('Cannot start already running exercise');
            }
            draftState.currentStatus = 'running';
            return draftState;
        },
        rights: 'trainer',
    };

    export const setAutojoinViewport: ActionReducer<SetAutojoinViewportAction> =
        {
            action: SetAutojoinViewportAction,
            reducer: (draftState, { viewportId }) => {
                draftState.autojoinViewportId = viewportId;
                return draftState;
            },
            rights: 'trainer',
        };

    export const exerciseTick: ActionReducer<ExerciseTickAction> = {
        action: ExerciseTickAction,
        reducer: (draftState, { patientUpdates, tickInterval }) => {
            // Refresh the current time
            draftState.currentTime += tickInterval;

            // Refresh patient status
            patientUpdates.forEach((patientUpdate) => {
                const currentPatient = draftState.patients[patientUpdate.id]!;

                const visibleStatusBefore = getPatientVisibleStatus(
                    currentPatient,
                    draftState.configuration.pretriageEnabled,
                    draftState.configuration.bluePatientsEnabled
                );

                currentPatient.currentHealthStateId = patientUpdate.nextStateId;
                currentPatient.health = patientUpdate.nextHealthPoints;
                currentPatient.stateTime = patientUpdate.nextStateTime;
                currentPatient.treatmentTime = patientUpdate.treatmentTime;
                currentPatient.realStatus = getStatus(currentPatient.health);

                const visibleStatusAfter = getPatientVisibleStatus(
                    currentPatient,
                    draftState.configuration.pretriageEnabled,
                    draftState.configuration.bluePatientsEnabled
                );
                // Save this to the state because the treatments aren't refreshed in every tick
                currentPatient.visibleStatusChanged =
                    visibleStatusBefore !== visibleStatusAfter;
                if (
                    // We only want to do this expensive calculation, when it is really necessary
                    currentPatient.visibleStatusChanged
                ) {
                    updateTreatments(draftState, currentPatient);
                    logPatientVisibleStatusChanged(
                        draftState,
                        currentPatient.id
                    );
                }
            });

            // Refresh transfers
            refreshTransfer(draftState, 'vehicle', tickInterval);
            refreshTransfer(draftState, 'personnel', tickInterval);

            simulateAllRegions(draftState, tickInterval);

            simulateAllTechnicalChallenges(draftState, tickInterval);

            if (logActive(draftState)) {
                const newTreatmentAssignment =
                    calculateTreatmentAssignment(draftState);
                evaluateTreatmentReassignment(
                    draftState,
                    newTreatmentAssignment
                );
                draftState.previousTreatmentAssignment = newTreatmentAssignment;
            }

            return draftState;
        },
        rights: 'trainer',
    };

    export const templateImport: ActionReducer<ImportTemplatesAction> = {
        action: ImportTemplatesAction,
        reducer: (draftState, { mode, partialExport }) => {
            const mutablePartialExport = cloneDeepMutable(partialExport);
            if (mutablePartialExport.mapImageTemplates !== undefined) {
                if (mode !== 'append') {
                    // Remove all mapImageTemplates
                    draftState.templates = Object.fromEntries(
                        Object.entries(draftState.templates).filter(
                            ([_, template]) =>
                                template.type !== 'mapImageTemplate'
                        )
                    );
                }
                for (const mapImageTemplate of mutablePartialExport.mapImageTemplates) {
                    draftState.templates[mapImageTemplate.id] =
                        mapImageTemplate;
                }
            }
            if (mutablePartialExport.patientCategories !== undefined) {
                if (mode === 'append') {
                    draftState.patientCategories.push(
                        ...mutablePartialExport.patientCategories
                    );
                } else {
                    draftState.patientCategories =
                        mutablePartialExport.patientCategories;
                }
            }
            if (mutablePartialExport.vehicleTemplates !== undefined) {
                if (mode !== 'append') {
                    // Remove all vehicles from all alarm groups as all existing vehicle templates are being removed
                    for (const alarmGroup of Object.values(
                        draftState.alarmGroups
                    )) {
                        alarmGroup.alarmGroupVehicles = {};
                    }
                    // Remove all vehicle templates
                    draftState.templates = Object.fromEntries(
                        Object.entries(draftState.templates).filter(
                            ([_, template]) =>
                                template.type !== 'vehicleTemplate'
                        )
                    );
                }
                for (const vehicleTemplate of mutablePartialExport.vehicleTemplates) {
                    draftState.templates[vehicleTemplate.id] = vehicleTemplate;
                }
            }
            return draftState;
        },
        rights: 'trainer',
    };
}

type TransferTypePluralMap = Pick<
    ElementTypePluralMap,
    TransferableElementType
>;

function refreshTransfer(
    draftState: WritableDraft<ExerciseState>,
    type: keyof TransferTypePluralMap,
    tickInterval: number
): void {
    const elements = draftState[elementTypePluralMap[type]];
    Object.values(elements).forEach(
        (element: WritableDraft<Personnel | Vehicle>) => {
            if (!isInTransfer(element)) {
                return;
            }
            if (currentTransferOf(element).isPaused) {
                const newTransfer = cloneDeepMutable(
                    currentTransferOf(element)
                );
                newTransfer.endTimeStamp += tickInterval;
                changePosition(
                    element,
                    newTransferPositionFor(newTransfer),
                    draftState
                );
                return;
            }
            // Not transferred yet
            if (
                currentTransferOf(element).endTimeStamp > draftState.currentTime
            ) {
                return;
            }
            letElementArrive(draftState, type, element.id);
        }
    );
}

/**
 * Prepare a {@link PartialExport} for import.
 *
 * This includes resetting UUIDs as this cannot be done in the reducer.
 * @param partialExport The {@link PartialExport} to prepare.
 */
export function preparePartialExportForImport(
    partialExport: PartialExport
): PartialExport {
    const copy = cloneDeepMutable(partialExport);
    // `patientCategories` don't have an `id`...
    const templateTypes = ['mapImageTemplates', 'vehicleTemplates'] as const;
    for (const templateType of templateTypes) {
        const templates = copy[templateType];
        if (templates !== undefined) {
            for (const template of templates) {
                template.id = uuid();
            }
        }
    }
    // ...but the contained `PatientTemplate`s do
    if (copy.patientCategories !== undefined) {
        for (const category of copy.patientCategories) {
            for (const template of category.patientTemplates) {
                template.id = uuid();
            }
        }
    }
    return copy;
}

export interface TreatmentAssignment {
    [patientId: UUID]: ResourceDescription;
}

function calculateTreatmentAssignment(
    draftState: WritableDraft<ExerciseState>
): TreatmentAssignment {
    const treatmentAssignment = Object.fromEntries(
        Object.keys(draftState.patients).map((patientId) => [
            patientId,
            Object.fromEntries(
                Object.values(
                    getTemplates(draftState, 'personnelTemplate')
                ).map((template) => [template.id, 0])
            ),
        ])
    ) as TreatmentAssignment;

    Object.values(draftState.personnel).forEach((personnel) => {
        const assignedPatientCount = Object.keys(
            personnel.assignedPatientIds
        ).length;
        Object.keys(personnel.assignedPatientIds)
            .filter((patientId) => treatmentAssignment[patientId])
            .forEach((patientId) => {
                treatmentAssignment[patientId]![personnel.templateId]! +=
                    1 / assignedPatientCount;
            });
    });

    return treatmentAssignment;
}

function evaluateTreatmentReassignment(
    draftState: WritableDraft<ExerciseState>,
    newTreatmentAssignment: TreatmentAssignment
) {
    if (!draftState.previousTreatmentAssignment) return;
    Object.keys(newTreatmentAssignment)
        .filter((patientId) =>
            Object.values(getTemplates(draftState, 'personnelTemplate')).some(
                (personnelTemplate) =>
                    newTreatmentAssignment[patientId]![personnelTemplate.id] !==
                    draftState.previousTreatmentAssignment![patientId]?.[
                        personnelTemplate.id
                    ]
            )
        )
        .forEach((patientId) => {
            logPatient(
                draftState,
                Object.entries(newTreatmentAssignment[patientId]!)
                    .filter(([, count]) => count > 0)
                    .map(([personnelTemplateId]) =>
                        createPersonnelTypeTag(
                            draftState,
                            getTemplates(draftState, 'personnelTemplate')[
                                personnelTemplateId
                            ]!
                        )
                    ),
                `Diese Einsatzkräfte wurden dem Patienten neu zugeteilt: ${
                    Object.entries(newTreatmentAssignment[patientId]!)
                        .filter(([, count]) => count > 0)
                        .map(
                            ([personnelTemplateId, count]) =>
                                `${+count.toFixed(2)} ${
                                    draftState.templates[personnelTemplateId]!
                                        .name
                                }`
                        )
                        .join(', ') || 'Keine Einsatzkräfte'
                }.`,
                patientId
            );
        });
}
