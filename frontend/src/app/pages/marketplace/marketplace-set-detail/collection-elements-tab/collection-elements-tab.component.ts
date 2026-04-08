import { Component, computed, inject, input, signal } from '@angular/core';
import {
    CollectionService,
    CollectionSubscriptionData,
} from '../../../../core/exercise-element.service';
import {
    AlarmGroup,
    checkCollectionRole,
    ElementDto,
    ExerciseState,
    isParticipantKey,
    migratePartialExport,
    PartialExport,
    ParticipantKey,
    StateExport,
    validateExerciseExport,
    VehicleTemplate,
    vehicleTemplateSchema,
    VersionedElementContent,
    versionedElementContentSchema,
} from 'fuesim-digital-shared';
import { VersionedElementDisplayNamePipe } from '../../../../shared/pipes/versioned-element-type-display-name.pipe';
import { CreatingVersionedElementModalData } from '../../editor-modals/base-versioned-element-submodal';
import { VersionedElementModalComponent } from '../../editor-modals/versioned-element-modal/versioned-element-modal.component';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ElementCardComponent } from '../../element-card/element-card.component';
import { FileInputDirective } from '../../../../shared/directives/file-input.directive';
import { selectExerciseState } from '../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../state/get-state-snapshot';
import { openPartialImportOverwriteModal } from '../../../exercises/exercise/shared/partial-import/open-partial-import-overwrite-modal';
import { MessageService } from '../../../../core/messages/message.service';
import z, { ZodType } from 'zod';
import { JsonPipe } from '@angular/common';

@Component({
    selector: 'app-collection-elements-tab',
    imports: [
        VersionedElementDisplayNamePipe,
        ElementCardComponent,
        JsonPipe,
        NgbDropdownModule,
        FileInputDirective,
    ],
    styleUrl: './collection-elements-tab.component.scss',
    templateUrl: './collection-elements-tab.component.html',
})
export class CollectionElementsTabComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly messageService = inject(MessageService);
    private readonly ngbModalService = inject(NgbModal);

    public readonly collectionData =
        input.required<CollectionSubscriptionData>();

    public readonly elementsGroupedByType = computed(() => {
        return this.collectionData().objects.direct.reduce<{
            [type: string]: ElementDto[];
        }>((acc, element) => {
            const type = element.content.type;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(element);
            return acc;
        }, {});
    });

    public readonly availableElements = computed(() => {
        const selectedCollectionData = this.collectionData();
        if (!selectedCollectionData) return [];

        return [
            ...selectedCollectionData.objects.direct,
            ...selectedCollectionData.objects.transitive.flatMap(
                (d) => d.elements
            ),
        ];
    });

    public readonly importingElements = signal<boolean>(false);

    public readonly checkRole = checkCollectionRole.bind(this);

    // This array defined the order in which the element types are displayed in the UI.
    // Types not included in this array will NOT be displayed in the UI
    public visibleElementTypesOrder: VersionedElementContent['type'][] = [
        'vehicleTemplate',
        'alarmGroup',
    ];

    private createElementHelper(type: VersionedElementContent["type"]) {
        const selectedCollectionData = this.collectionData();
        if (!selectedCollectionData) {
            this.messageService.postError({
                title: 'Fehler beim Erstellen eines neuen Elements',
                error: new Error('selectedCollectionData is null'),
            });
            return;
        }

        const modal = this.ngbModalService.open(
            VersionedElementModalComponent,
            {
                size: 'xl',
            }
        );
        modal.componentInstance.data = {
            type: type,
            mode: "create",
            onSubmit: async (data: any) => {
                await this.collectionService.createElement(
                    this.collectionData().collection.entityId,
                    data
                );
            },
            collection: selectedCollectionData.collection,
            availableCollectionElements: this.availableElements(),
        } satisfies CreatingVersionedElementModalData<any>;
    }

    public readonly createNewAlarmgroup = this.createElementHelper.bind(this, 'alarmGroup');
    public readonly createNewVehicle = this.createElementHelper.bind(this, 'vehicleTemplate');

    public async importElementFile(fileList: FileList) {
        try {
            this.importingElements.set(true);
            const importedText = await fileList.item(0)?.text();
            if (importedText === undefined) {
                // The file dialog has been aborted.
                return;
            }
            const importedPlainObject = JSON.parse(importedText) as
                | PartialExport
                | StateExport;

            let partialObject: PartialExport;
            if (importedPlainObject.type === 'partial') {
                partialObject = importedPlainObject;
            } else {
                const currentState =
                    importedPlainObject.currentState as ExerciseState;
                partialObject = {
                    type: 'partial',
                    dataVersion: importedPlainObject.dataVersion,
                    fileVersion: importedPlainObject.fileVersion,
                    patientCategories: Object.values(
                        currentState.patientCategories
                    ),
                    vehicleTemplates: Object.values(
                        currentState.vehicleTemplates
                    ),
                    mapImageTemplates: Object.values(
                        currentState.mapImageTemplates
                    ),
                };
            }

            const migratedPartialExport = migratePartialExport(
                partialObject,
                ExerciseState.create('123456' as ParticipantKey)
            );

            const validation = validateExerciseExport(migratedPartialExport);
            if (validation.length > 0) {
                throw Error(
                    `PartialExport is invalid:\n${validation.join('\n')}`
                );
            }

            console.log(migratedPartialExport);

            await this.collectionService.importElements(
                this.collectionData().collection.entityId,
                [
                    ...(migratedPartialExport.patientCategories ?? []),
                    ...(migratedPartialExport.vehicleTemplates ?? []),
                    ...(migratedPartialExport.mapImageTemplates ?? []),
                ]
            );
        } catch (err) {
            this.messageService.postError({
                title: 'Fehler beim Importieren von Vorlagen',
                error: err,
            });
        } finally {
            this.importingElements.set(false);
        }
    }
}
