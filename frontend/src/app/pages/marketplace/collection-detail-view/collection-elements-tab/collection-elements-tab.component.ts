import { Component, computed, inject, input, signal } from '@angular/core';
import {
    checkCollectionRole,
    ExerciseState,
    gatherCollectionElements,
    migratePartialExport,
    PartialExport,
    ParticipantKey,
    StateExport,
    validateExerciseExport,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    CollectionService,
    CollectionSubscriptionData,
} from '../../../../core/exercise-element.service';
import { FileInputDirective } from '../../../../shared/directives/file-input.directive';
import { MessageService } from '../../../../core/messages/message.service';
import { CollectionElementsListComponent } from '../../shared/collection-elements-list/collection-elements-list.component';
import { CreatingVersionedElementModalData } from '../../shared/modals/editor-modals/base-versioned-element-submodal';
import { VersionedElementModalComponent } from '../../shared/modals/editor-modals/versioned-element-modal/versioned-element-modal.component';

@Component({
    selector: 'app-collection-elements-tab',
    imports: [
        NgbDropdownModule,
        FileInputDirective,
        CollectionElementsListComponent,
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

    public readonly availableElements = computed(() => {
        const selectedCollectionData = this.collectionData();

        return gatherCollectionElements(
            selectedCollectionData.objects
        ).allVisibleElements();
    });

    public readonly importingElements = signal<boolean>(false);

    public readonly checkRole = checkCollectionRole.bind(this);

    private createElementHelper(type: VersionedElementContent['type']) {
        const selectedCollectionData = this.collectionData();

        const modal = this.ngbModalService.open(
            VersionedElementModalComponent,
            {
                size: 'xl',
            }
        );
        modal.componentInstance.data = {
            type,
            mode: 'create',
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

    public readonly createNewAlarmgroup = this.createElementHelper.bind(
        this,
        'alarmGroup'
    );
    public readonly createNewVehicle = this.createElementHelper.bind(
        this,
        'vehicleTemplate'
    );

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
