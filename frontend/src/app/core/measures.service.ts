import { inject, Injectable, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    createVehicleParameters,
    MeasureProperty,
    MeasurePropertyInstance,
    MeasureTemplate,
    newDrawing,
    newMapCoordinatesAt,
    StrictObject,
    uuid,
} from 'fuesim-digital-shared';
import { AppState } from '../state/app.state';
import { selectLastClientName } from '../state/application/selectors/application.selectors';
import {
    openAlarmModal,
    openEocLogModal,
} from '../pages/exercises/exercise/shared/measure-modals/open-measure-modals';
import { selectStateSnapshot } from '../state/get-state-snapshot';
import {
    selectAlarmGroups,
    selectMaterialTemplates,
    selectPersonnelTemplates,
    selectVehicleTemplates,
} from '../state/application/selectors/exercise.selectors';
import { MessageService } from './messages/message.service';
import { ConfirmationModalService } from './confirmation-modal/confirmation-modal.service';
import { ExerciseService } from './exercise.service';
import { DrawingInteractionService } from './drawing-interaction.service';

@Injectable({
    providedIn: 'root',
})
export class MeasureService {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly messageService = inject(MessageService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    private readonly drawingInteractionService = inject(
        DrawingInteractionService
    );

    private readonly clientName = this.store.selectSignal(selectLastClientName);

    public readonly activeMeasure = signal<MeasureTemplate | null>(null);
    public readonly activeProperty = signal<MeasureProperty | null>(null);

    /**
     * Handles the execution of a single property for a measure.
     * @param template The template this property is being executed for.
     * @param property The property being executed.
     * @returns - false if user canceled the measure
     *          - true if property was executed successfully but returns no instance
     *          - MeasurePropertyInstance if property executed successfully and returns an instance
     */
    private async handle(
        template: MeasureTemplate,
        property: MeasureProperty
    ): Promise<MeasurePropertyInstance | boolean> {
        this.activeProperty.set(property);
        switch (property.type) {
            case 'delay':
                await new Promise((resolve) => {
                    setTimeout(() => resolve(null), property.delay * 1000);
                });
                return true;
            case 'response':
                await this.confirmationModalService.confirm({
                    title: template.name,
                    description: property.response,
                    confirmationString: '',
                });
                return true;
            case 'manualConfirm': {
                const res = await this.confirmationModalService.confirm({
                    title: template.name,
                    description: property.prompt,
                    confirmationString: property.confirmationString,
                });
                return res ?? false;
            }
            case 'alarm': {
                const modalRef = openAlarmModal(
                    this.ngbModalService,
                    property.alarmGroups,
                    property.targetTransferPointIds
                );
                try {
                    const result = await modalRef.result;
                    return {
                        type: 'alarmInstance',
                        alarmGroup: result.alarmGroup,
                        targetTransferPointId: result.targetTransferPointId,
                    };
                } catch {
                    return false;
                }
            }
            case 'eocLog': {
                let message: string;
                if (property.confirm) {
                    const modalRef = openEocLogModal(
                        this.ngbModalService,
                        property.message,
                        property.editable
                    );
                    try {
                        const result = await modalRef.result;
                        message = result.message;
                    } catch {
                        return false;
                    }
                } else {
                    // The zod schema enforces that the message is editable
                    // when it is empty, and that it has to be confirmed when
                    // it is editable. Thus, message must be defined here.
                    message = property.message!;
                }

                return {
                    type: 'eocLogInstance',
                    message,
                };
            }
            case 'drawFreehand': {
                const result =
                    await this.drawingInteractionService.requestDrawing({
                        drawingType: 'freehand',
                        strokeColor: property.strokeColor,
                        fillColor: property.fillColor,
                    });
                if (!result) return false;
                const drawing = newDrawing(
                    'freehand',
                    result.points,
                    property.strokeColor,
                    property.fillColor
                );
                this.exerciseService.proposeAction({
                    type: '[Drawing] Add drawing',
                    drawing,
                });
                return {
                    type: 'drawingInstance',
                    id: drawing.id,
                };
            }
            case 'drawLine': {
                const result =
                    await this.drawingInteractionService.requestDrawing({
                        drawingType: 'line',
                        strokeColor: property.strokeColor,
                    });
                if (!result) return false;
                const drawing = newDrawing(
                    'line',
                    result.points,
                    property.strokeColor,
                    undefined
                );
                this.exerciseService.proposeAction({
                    type: '[Drawing] Add drawing',
                    drawing,
                });
                return {
                    type: 'drawingInstance',
                    id: drawing.id,
                };
            }
        }
    }

    private resetActive() {
        this.activeMeasure.set(null);
        this.activeProperty.set(null);
    }

    public async executeMeasure(template: MeasureTemplate) {
        this.activeMeasure.set(template);

        const instances = [];
        for (const property of template.properties) {
            // eslint-disable-next-line no-await-in-loop
            const result = await this.handle(template, property);

            if (result === false) {
                this.resetActive();
                this.abort(instances);
                return;
            } else if (result === true) continue;

            instances.push(result);
        }

        this.resetActive();
        this.confirm(instances);
    }

    private confirm(instances: MeasurePropertyInstance[]) {
        for (const instance of instances) {
            switch (instance.type) {
                case 'alarmInstance': {
                    const vehicleTemplates = selectStateSnapshot(
                        selectVehicleTemplates,
                        this.store
                    );

                    const materialTemplates = selectStateSnapshot(
                        selectMaterialTemplates,
                        this.store
                    );

                    const personnelTemplates = selectStateSnapshot(
                        selectPersonnelTemplates,
                        this.store
                    );

                    const alarmGroup = selectStateSnapshot(
                        selectAlarmGroups,
                        this.store
                    )[instance.alarmGroup]!;

                    const sortedAlarmGroupVehicles = StrictObject.values(
                        alarmGroup.alarmGroupVehicles
                    ).sort((a, b) => a.time - b.time);

                    const placeholderPosition = newMapCoordinatesAt(0, 0);

                    const vehicleParameters = sortedAlarmGroupVehicles.map(
                        (alarmGroupVehicle) =>
                            createVehicleParameters(
                                uuid(),
                                {
                                    ...vehicleTemplates[
                                        alarmGroupVehicle.vehicleTemplateId
                                    ]!,
                                    name: alarmGroupVehicle.name,
                                },
                                materialTemplates,
                                personnelTemplates,
                                placeholderPosition
                            )
                    );

                    this.exerciseService.proposeAction({
                        type: '[Emergency Operation Center] Send Alarm Group',
                        alarmGroupId: instance.alarmGroup,
                        clientName: this.clientName() ?? 'Unknown',
                        sortedVehicleParameters: vehicleParameters,
                        targetTransferPointId: instance.targetTransferPointId,
                        firstVehiclesCount: 0,
                        firstVehiclesTargetTransferPointId: undefined,
                    });
                    break;
                }
                case 'eocLogInstance': {
                    this.exerciseService.proposeAction({
                        type: '[Emergency Operation Center] Add Log Entry',
                        name: this.clientName() ?? 'Unknown',
                        isPrivate: false,
                        message: instance.message,
                    });
                    break;
                }
                case 'drawingInstance': {
                    break;
                }
            }
        }
    }

    private abort(instances: MeasurePropertyInstance[]) {
        for (const instance of instances) {
            switch (instance.type) {
                case 'drawingInstance': {
                    this.exerciseService.proposeAction({
                        type: '[Drawing] Remove drawing',
                        drawingId: instance.id,
                    });
                    break;
                }
                default:
                    break;
            }
        }
    }
}
