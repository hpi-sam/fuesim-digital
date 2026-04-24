import { z } from 'zod';
import { measureSchema } from '../../models/measure/measures.js';
import type { ActionReducer } from '../action-reducer.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { DrawingActionReducers } from './drawing.js';
import { EmergencyOperationCenterActionReducers } from './emergency-operation-center.js';
import { getMeasureTemplate } from './utils/measures.js';
import { logMeasure } from './utils/log.js';

export const addMeasureActionSchema = z.strictObject({
    type: z.literal('[Measure] Add Measure'),
    measure: measureSchema,
});
export type AddMeasureAction = z.infer<typeof addMeasureActionSchema>;

export namespace MeasureActionReducers {
    export const addMeasure: ActionReducer<AddMeasureAction> = {
        type: '[Measure] Add Measure',
        actionSchema: addMeasureActionSchema,
        reducer: (draftState, { measure }) => {
            let newDraftState = draftState;
            const template = getMeasureTemplate(draftState, measure.templateId);
            if (template.replacePrevious) {
                const previousInstances = Object.values(newDraftState.measures)
                    .filter((m) => m.templateId === measure.templateId)
                    .flatMap((m) => m.instances);

                for (const instance of previousInstances) {
                    if (instance.type === 'drawingInstance') {
                        newDraftState =
                            DrawingActionReducers.removeDrawing.reducer(
                                newDraftState,
                                {
                                    type: '[Drawing] Remove drawing',
                                    drawingId: instance.id,
                                }
                            );
                    }
                }
            }
            measure.instances.forEach((instance) => {
                switch (instance.type) {
                    case 'alarmInstance':
                        newDraftState =
                            EmergencyOperationCenterActionReducers.sendAlarmGroup.reducer(
                                newDraftState,
                                {
                                    type: '[Emergency Operation Center] Send Alarm Group',
                                    alarmGroupId: instance.alarmGroup,
                                    clientName: measure.clientName,
                                    sortedVehicleParameters:
                                        instance.vehicleParameters,
                                    targetTransferPointId:
                                        instance.targetTransferPointId,
                                    firstVehiclesCount: 0,
                                    firstVehiclesTargetTransferPointId:
                                        undefined,
                                }
                            );
                        break;
                    case 'eocLogInstance':
                        newDraftState =
                            EmergencyOperationCenterActionReducers.addLogEntry.reducer(
                                newDraftState,
                                {
                                    type: '[Emergency Operation Center] Add Log Entry',
                                    name: measure.clientName,
                                    isPrivate: false,
                                    message: instance.message,
                                }
                            );
                        break;
                    case 'drawingInstance':
                        break;
                }
            });
            newDraftState.measures[measure.id] = cloneDeepMutable(measure);
            logMeasure(newDraftState, measure.id);
            return newDraftState;
        },
        rights: 'participant',
    };
}
