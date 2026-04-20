import { z } from 'zod';
import { newGenerateReportActivityState } from '../activities/generate-report.js';
import { nextUUID } from '../utils/randomness.js';
import { addActivity } from '../activities/utils.js';
import { newCollectInformationEvent } from '../events/collect.js';
import { newPublishRadiogramActivityState } from '../activities/publish-radiogram.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
import { uuid, uuidSchema } from '../../utils/uuid.js';
import { newRadiogramUnpublishedStatus } from '../../models/radiogram/status/radiogram-unpublished-status.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { newTreatmentStatusRadiogram } from '../../models/radiogram/treatment-status-radiogram.js';
import { newTransferCategoryCompletedRadiogram } from '../../models/radiogram/transfer-category-completed-radiogram.js';
import type { SimulationBehavior } from './simulation-behavior.js';
import { simulationBehaviorStateSchema } from './simulation-behavior.js';
import { createRadiogramMap, reportableInformationSchema } from './utils.js';

export const reportBehaviorStateSchema = z.strictObject({
    ...simulationBehaviorStateSchema.shape,
    type: z.literal('reportBehavior'),
    activityIds: z.partialRecord(
        reportableInformationSchema,
        uuidSchema.optional()
    ),
    reportTreatmentProgressChanges: z.boolean(),
    reportTransferOfCategoryInSingleRegionCompleted: z.boolean(),
    reportTransferOfCategoryInMultipleRegionsCompleted: z.boolean(),
});

export type ReportBehaviorState = z.infer<typeof reportBehaviorStateSchema>;

export function newReportBehaviorState(): ReportBehaviorState {
    return {
        type: 'reportBehavior',
        id: uuid(),
        activityIds: {},
        reportTreatmentProgressChanges: true,
        reportTransferOfCategoryInSingleRegionCompleted: false,
        reportTransferOfCategoryInMultipleRegionsCompleted: true,
    };
}

export const reportBehavior: SimulationBehavior<ReportBehaviorState> = {
    behaviorStateSchema: reportBehaviorStateSchema,
    newBehaviorState: newReportBehaviorState,
    handleEvent: (draftState, simulatedRegion, behaviorState, event) => {
        switch (event.type) {
            case 'startCollectingInformationEvent': {
                const activityId = nextUUID(draftState);

                addActivity(
                    simulatedRegion,
                    newGenerateReportActivityState(
                        activityId,
                        createRadiogramMap[event.informationType](
                            nextUUID(draftState),
                            simulatedRegion.id,
                            event.interfaceSignallerKey,
                            newRadiogramUnpublishedStatus()
                        ),
                        newCollectInformationEvent(
                            activityId,
                            event.informationType
                        )
                    )
                );
                break;
            }
            case 'treatmentProgressChangedEvent': {
                if (!behaviorState.reportTreatmentProgressChanges) return;

                if (event.newProgress === 'noTreatment') {
                    // No treatment indicates that there is no leader
                    // Therefore, the radiogram can't be sent
                    return;
                }

                const radiogram = cloneDeepMutable(
                    newTreatmentStatusRadiogram(
                        nextUUID(draftState),
                        simulatedRegion.id,
                        null,
                        newRadiogramUnpublishedStatus()
                    )
                );
                radiogram.treatmentStatus = event.newProgress;
                radiogram.treatmentStatusChanged = true;
                radiogram.informationAvailable = true;

                addActivity(
                    simulatedRegion,
                    newPublishRadiogramActivityState(
                        nextUUID(draftState),
                        radiogram
                    )
                );
                break;
            }
            case 'patientCategoryTransferToHospitalFinishedEvent': {
                if (
                    (event.isRelatedOnlyToOwnRegion &&
                        behaviorState.reportTransferOfCategoryInSingleRegionCompleted) ||
                    (!event.isRelatedOnlyToOwnRegion &&
                        behaviorState.reportTransferOfCategoryInMultipleRegionsCompleted)
                ) {
                    const radiogram = cloneDeepMutable(
                        newTransferCategoryCompletedRadiogram(
                            nextUUID(draftState),
                            simulatedRegion.id,
                            newRadiogramUnpublishedStatus()
                        )
                    );
                    radiogram.completedCategory = event.patientCategory;
                    radiogram.scope = event.isRelatedOnlyToOwnRegion
                        ? 'singleRegion'
                        : 'transportManagement';
                    radiogram.informationAvailable = true;

                    addActivity(
                        simulatedRegion,
                        newPublishRadiogramActivityState(
                            nextUUID(draftState),
                            radiogram
                        )
                    );
                }

                break;
            }
            default:
            // Ignore event
        }
    },
    onRemove(_draftState, simulatedRegion, behaviorState) {
        TypeAssertedObject.values(behaviorState.activityIds)
            .filter((activityId) => activityId !== undefined)
            .forEach((activityId) => {
                delete simulatedRegion.activities[activityId];
            });
    },
};
