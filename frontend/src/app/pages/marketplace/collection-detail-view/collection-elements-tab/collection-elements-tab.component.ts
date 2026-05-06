import { Component, computed, inject, input, signal } from '@angular/core';
import {
    checkCollectionRole,
    ExerciseState,
    gatherCollectionElements,
    MapImageTemplate,
    migratePartialExport,
    PartialExport,
    ParticipantKey,
    PatientCategory,
    StateExport,
    validateExerciseExport,
    VehicleTemplate,
} from 'fuesim-digital-shared';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
    CollectionService,
    CollectionSubscriptionData,
} from '../../../../core/exercise-element.service';
import { FileInputDirective } from '../../../../shared/directives/file-input.directive';
import { MessageService } from '../../../../core/messages/message.service';
import { CollectionElementsListComponent } from '../../shared/collection-elements-list/collection-elements-list.component';

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
                const currentState = importedPlainObject.currentState as {
                    vehicleTemplates: { [key: string]: VehicleTemplate };
                    mapImageTemplates: { [key: string]: MapImageTemplate };
                    patientCategories: { [key: string]: PatientCategory };
                };
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
