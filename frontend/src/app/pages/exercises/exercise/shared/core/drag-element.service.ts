import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Element,
    ImageProperties,
    MapImageTemplate,
    PatientCategory,
    TechnicalChallenge,
    TechnicalChallengeTemplate,
    VehicleTemplate,
    VersionedElementModel,
} from 'fuesim-digital-shared';
import {
    uuid,
    createVehicleParameters,
    normalZoom,
    newMapPositionAt,
    newSimulatedRegionPositionIn,
    newMapImageFromTemplate,
    newViewport,
    defaultViewportSize,
    newTransferPoint,
    newPatientFromTemplate,
    CreateTechnicalChallengeAction,
    newTechnicalChallengeFromTemplate,
    hasEntityProperties,
} from 'fuesim-digital-shared';
import type { Feature } from 'ol';
import type VectorLayer from 'ol/layer/Vector';
import type OlMap from 'ol/Map';
import type { Pixel } from 'ol/pixel';
import { Immutable } from 'immer';
import type { SimulatedRegionDragTemplate } from '../editor-panel/templates/simulated-region';
import { reconstituteSimulatedRegionTemplate } from '../editor-panel/templates/simulated-region';
import type { FeatureManager } from '../exercise-map/utility/feature-manager';
import type { RestrictedZoneDragTemplate } from '../editor-panel/templates/restricted-zone';
import { reconstituteRestrictedZoneTemplate } from '../editor-panel/templates/restricted-zone';
import { ExerciseService } from '../../../../../core/exercise.service';
import type { AppState } from '../../../../../state/app.state';
import {
    selectMaterialTemplates,
    selectPersonnelTemplates,
    selectExerciseState,
    selectCurrentTime,
} from '../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../state/get-state-snapshot';

@Injectable({
    providedIn: 'root',
})
/**
 * This service handles the adding of elements via drag and drop from the trainer map editor to the map
 */
export class DragElementService {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

    private olMap?: OlMap;
    layerFeatureManagerDictionary?: Map<VectorLayer, FeatureManager<any>>;

    public registerMap(olMap: OlMap) {
        this.olMap = olMap;
    }

    public registerLayerFeatureManagerDictionary(
        layerFeatureManagerDictionary: Map<VectorLayer, FeatureManager<any>>
    ) {
        this.layerFeatureManagerDictionary = layerFeatureManagerDictionary;
    }

    public unregisterMap() {
        this.olMap = undefined;
    }

    public unregisterLayerFeatureManagerDictionary() {
        this.layerFeatureManagerDictionary = undefined;
    }

    private dragElement?: HTMLImageElement;
    private imageDimensions?: { width: number; height: number };
    private transferringTemplate?: TransferTemplate;
    private transferringEntityVersion?: VersionedElementModel['entity'];

    /**
     * Should be called on the mousedown event of the element to be dragged
     * @param event the mouse event
     * @param transferTemplate the template to be added
     */
    public onMouseDown(event: MouseEvent, transferTemplate: TransferTemplate) {
        this.transferringTemplate = transferTemplate;
        console.log(transferTemplate);
        if (hasEntityProperties(transferTemplate.template)) {
            console.log('YIPPE - entity');
            this.transferringEntityVersion = transferTemplate.template.entity;
        }

        // Create the drag image
        const imageProperties = transferTemplate.template.image;
        const zoom = this.olMap!.getView().getZoom()!;
        const zoomFactor = // One higher zoom level means to double the height of the image
            Math.pow(2, zoom - normalZoom) *
            // For some reason we need this additional factor to make it work - determined via best effort guess
            // Changing the scale of the image in OpenLayers does have an influence on the number here. So maybe something to do with a cache.
            2.3;
        this.dragElement = document.createElement('img');
        this.dragElement.src = imageProperties.url;
        this.dragElement.style.position = 'absolute';
        this.imageDimensions = {
            width:
                zoomFactor *
                imageProperties.height *
                imageProperties.aspectRatio,
            height: zoomFactor * imageProperties.height,
        };
        this.dragElement.style.width = `${this.imageDimensions.width}px`;
        this.dragElement.style.height = `${this.imageDimensions.height}px`;
        this.updateDragElementPosition(event);
        document.body.append(this.dragElement);
        // The dragging logic
        event.preventDefault();
        document.body.style.cursor = 'move';
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    private readonly onMouseMove = (event: MouseEvent) => {
        event.preventDefault();
        this.updateDragElementPosition(event);
    };

    private updateDragElementPosition(event: MouseEvent) {
        if (!this.dragElement || !this.imageDimensions) {
            console.log('dragElement or imageDimensions are undefined', this);
            return;
        }
        // max and min to not move out of the window
        this.dragElement.style.left = `${Math.max(
            Math.min(
                event.clientX - this.imageDimensions.width / 2,
                window.innerWidth - this.imageDimensions.width
            ),
            0
        )}px`;
        this.dragElement.style.top = `${Math.max(
            Math.min(
                event.clientY - this.imageDimensions.height / 2,
                window.innerHeight - this.imageDimensions.height
            ),
            0
        )}px`;
    }

    private readonly onMouseUp = (event: MouseEvent) => {
        // Remove the dragging stuff
        event.preventDefault();
        document.body.style.cursor = 'default';
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        this.dragElement?.remove();

        if (!this.transferringTemplate || !this.olMap) {
            console.error('No template or map to add the element to', this);
            return;
        }
        // We don't want to add the element if the mouse is outside the map
        if (
            !this.coordinatesAreInElement(this.olMap.getTargetElement(), event)
        ) {
            return;
        }
        // Get the position of the mouse on the map
        const pixel = this.olMap.getEventPixel(event);
        const [x, y] = this.olMap.getCoordinateFromPixel(pixel) as [
            number,
            number,
        ];
        const position = { x, y };
        // create the element
        let createdElement: Immutable<Element> | null = null;
        switch (this.transferringTemplate.type) {
            case 'vehicle':
                {
                    const params = createVehicleParameters(
                        uuid(),
                        this.transferringTemplate.template,
                        selectStateSnapshot(
                            selectMaterialTemplates,
                            this.store
                        ),
                        selectStateSnapshot(
                            selectPersonnelTemplates,
                            this.store
                        ),
                        position,
                        this.transferringEntityVersion
                    );
                    this.exerciseService.proposeAction(
                        {
                            type: '[Vehicle] Add vehicle',
                            vehicleParameters: params,
                        },
                        true
                    );
                    createdElement = params.vehicle;
                }
                break;
            case 'patient':
                {
                    const patient = newPatientFromTemplate(
                        this.transferringTemplate.template.patientTemplates[
                            Math.floor(
                                Math.random() *
                                    this.transferringTemplate.template
                                        .patientTemplates.length
                            )
                        ]!,
                        this.transferringTemplate.template.name,
                        newMapPositionAt(position)
                    );
                    this.exerciseService.proposeAction(
                        {
                            type: '[Patient] Add patient',
                            patient,
                        },
                        true
                    );
                    createdElement = patient;
                }
                break;
            case 'viewport':
                {
                    const viewport = newViewport(
                        {
                            x: position.x - defaultViewportSize.width / 2,
                            y: position.y + defaultViewportSize.height / 2,
                        },
                        'Ansicht ???'
                    );
                    this.exerciseService.proposeAction(
                        {
                            type: '[Viewport] Add viewport',
                            viewport,
                        },
                        true
                    );
                    createdElement = viewport;
                }
                break;

            case 'mapImage':
                {
                    const template = this.transferringTemplate.template;
                    const mapImage = newMapImageFromTemplate(
                        template,
                        position
                    );

                    this.exerciseService.proposeAction({
                        type: '[MapImage] Add MapImage',
                        mapImage,
                    });
                    createdElement = mapImage;
                }
                break;
            case 'transferPoint':
                {
                    const transferPoint = newTransferPoint(
                        newMapPositionAt(position),
                        '???',
                        '???'
                    );
                    this.exerciseService.proposeAction(
                        {
                            type: '[TransferPoint] Add TransferPoint',
                            transferPoint,
                        },
                        true
                    );
                    createdElement = transferPoint;
                }
                break;
            case 'simulatedRegion':
                {
                    const exerciseState = selectStateSnapshot(
                        selectExerciseState,
                        this.store
                    );
                    const simulatedRegion = reconstituteSimulatedRegionTemplate(
                        this.transferringTemplate.template.stereotype,
                        exerciseState
                    );
                    simulatedRegion.position = newMapPositionAt({
                        x: position.x - simulatedRegion.size.width / 2,
                        y: position.y + simulatedRegion.size.height / 2,
                    });
                    const transferPoint = newTransferPoint(
                        newSimulatedRegionPositionIn(simulatedRegion.id),
                        '',
                        `[Simuliert] ${simulatedRegion.name}`
                    );
                    this.exerciseService.proposeAction(
                        {
                            type: '[SimulatedRegion] Add simulated region',
                            simulatedRegion,
                            transferPoint,
                        },
                        true
                    );
                    createdElement = simulatedRegion;
                }
                break;
            case 'restrictedZone':
                {
                    const restrictedZone = reconstituteRestrictedZoneTemplate(
                        this.transferringTemplate.template.stereotype,
                        selectStateSnapshot(selectExerciseState, this.store)
                    );
                    restrictedZone.position = newMapPositionAt({
                        x: position.x - restrictedZone.size.width / 2,
                        y: position.y + restrictedZone.size.height / 2,
                    });
                    this.exerciseService.proposeAction(
                        {
                            type: '[RestrictedZone] Add restricted zone',
                            restrictedZone,
                        },
                        true
                    );
                    createdElement = restrictedZone;
                }
                break;

            case 'technicalChallenge': {
                const currentTime = selectStateSnapshot(
                    selectCurrentTime,
                    this.store
                );
                const technicalChallenge: TechnicalChallenge =
                    newTechnicalChallengeFromTemplate(
                        this.transferringTemplate.template,
                        currentTime
                    );
                technicalChallenge.position = newMapPositionAt(position);
                this.exerciseService.proposeAction({
                    type: '[TechnicalChallenge] Create technical challenge',
                    technicalChallenge,
                } satisfies CreateTechnicalChallengeAction);
                createdElement = technicalChallenge;
                break;
            }
        }

        this.executeDropSideEffects(pixel, createdElement, event);
    };

    private executeDropSideEffects(
        pixel: Pixel,
        createdElement: Immutable<Element> | null,
        event: MouseEvent
    ) {
        if (
            createdElement === null ||
            !this.olMap ||
            !this.layerFeatureManagerDictionary
        ) {
            return;
        }
        this.olMap.forEachFeatureAtPixel(pixel, (droppedOnFeature, layer) => {
            // Skip layer when unset
            // OpenLayers type definitions are incorrect, layer may be `null`
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (layer === null || !this.layerFeatureManagerDictionary) {
                return;
            }
            // We stop propagating the event as soon as the onFeatureDropped function returns true
            return this.layerFeatureManagerDictionary
                .get(layer as VectorLayer)!
                .onFeatureDrop(
                    createdElement,
                    droppedOnFeature as Feature,
                    event
                );
        });
    }

    /**
     *
     * @returns wether {@link coordinates} are in {@link element}
     */
    private coordinatesAreInElement(
        element: HTMLElement,
        coordinates: { x: number; y: number }
    ) {
        const rect = element.getBoundingClientRect();
        return (
            coordinates.x >= rect.left &&
            coordinates.x <= rect.right &&
            coordinates.y >= rect.top &&
            coordinates.y <= rect.bottom
        );
    }
}

export type TransferTemplate =
    | {
          type: 'mapImage';
          template: MapImageTemplate;
      }
    | {
          type: 'patient';
          template: PatientCategory;
      }
    | {
          type: 'restrictedZone';
          template: RestrictedZoneDragTemplate;
      }
    | {
          type: 'simulatedRegion';
          template: SimulatedRegionDragTemplate;
      }
    | {
          type: 'technicalChallenge';
          template: TechnicalChallengeTemplate;
      }
    | {
          type: 'transferPoint';
          template: {
              image: ImageProperties;
          };
      }
    | {
          type: 'vehicle';
          template: VehicleTemplate;
      }
    | {
          type: 'viewport';
          template: {
              image: ImageProperties;
          };
      };
