import { Component, OnInit, inject } from '@angular/core';
import {
    NgbModal,
    NgbAccordionDirective,
    NgbAccordionItem,
    NgbAccordionHeader,
    NgbAccordionToggle,
    NgbAccordionButton,
    NgbAccordionCollapse,
    NgbAccordionBody,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
    PartialExport,
    migratePartialExport,
    transferPointImage,
    validateExerciseExport,
    viewportImage,
} from 'fuesim-digital-shared';
import type { PatientCategory, UUID } from 'fuesim-digital-shared';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap/collapse';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { DragElementService } from '../core/drag-element.service';
import { TransferLinesService } from '../core/transfer-lines.service';
import { openCreateImageTemplateModal } from '../editor-panel/create-image-template-modal/open-create-image-template-modal';
import { openCreateVehicleTemplateModal } from '../editor-panel/create-vehicle-template-modal/open-create-vehicle-template-modal';
import { openEditImageTemplateModal } from '../editor-panel/edit-image-template-modal/open-edit-image-template-modal';
import { openPartialImportOverwriteModal } from '../partial-import/open-partial-import-overwrite-modal';
import { simulatedRegionDragTemplates } from '../editor-panel/templates/simulated-region';
import { openEditVehicleTemplateModal } from '../editor-panel/edit-vehicle-template-modal/open-edit-vehicle-template-modal';
import { restrictedZoneDragTemplates } from '../editor-panel/templates/restricted-zone';
import { ExerciseService } from '../../../../../core/exercise.service';
import { MessageService } from '../../../../../core/messages/message.service';
import type { AppState } from '../../../../../state/app.state';
import {
    selectPatientCategories,
    selectVehicleTemplates,
    selectMapImagesTemplates,
    selectExerciseState,
    selectMeasureTemplates,
    createSelectMeasureTemplate,
} from '../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../state/get-state-snapshot';
import { ExerciseMapComponent } from '../exercise-map/exercise-map.component';
import { FileInputDirective } from '../../../../../shared/directives/file-input.directive';
import { MapEditorCardComponent } from '../editor-panel/map-editor-card/map-editor-card.component';
import { MeasureCardComponent } from '../editor-panel/measure-card/measure-card.component';
import { PatientStatusBadgeComponent } from '../../../../../shared/components/patient-status-badge/patient-status-badge.component';
import { PatientStatusDisplayComponent } from '../../../../../shared/components/patient-status-displayl/patient-status-display/patient-status-display.component';
import { TrainerToolbarComponent } from '../trainer-toolbar/trainer-toolbar.component';
import { ValuesPipe } from '../../../../../shared/pipes/values.pipe';
import { ConfirmationModalService } from '../../../../../core/confirmation-modal/confirmation-modal.service';
import { openCreateMeasureTemplateModal } from '../editor-panel/create-measure-template-modal/open-create-measure-template-modal';

const categories = ['green', 'yellow', 'red'] as const;
const colorCodeOfCategories = {
    green: 'X',
    yellow: 'Y',
    red: 'Z',
} as const;

type FilterCategory =
    (typeof colorCodeOfCategories)[(typeof categories)[number]];

@Component({
    selector: 'app-trainer-map-editor',
    templateUrl: './trainer-map-editor.component.html',
    styleUrls: ['./trainer-map-editor.component.scss'],
    imports: [
        ExerciseMapComponent,
        FileInputDirective,
        NgbAccordionDirective,
        NgbAccordionItem,
        NgbAccordionHeader,
        NgbAccordionToggle,
        NgbAccordionButton,
        NgbCollapse,
        NgbAccordionCollapse,
        NgbAccordionBody,
        MapEditorCardComponent,
        MeasureCardComponent,
        FormsModule,
        PatientStatusBadgeComponent,
        NgbTooltip,
        PatientStatusDisplayComponent,
        TrainerToolbarComponent,
        AsyncPipe,
        KeyValuePipe,
        ValuesPipe,
    ],
})
/**
 * A wrapper around the map that provides trainers with more options and tools.
 */
export class TrainerMapEditorComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    readonly dragElementService = inject(DragElementService);
    readonly transferLinesService = inject(TransferLinesService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly messageService = inject(MessageService);
    private readonly exerciseService = inject(ExerciseService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    public selectedCategories$: BehaviorSubject<{
        [key in FilterCategory]: boolean;
    }> = new BehaviorSubject<{ [key in FilterCategory]: boolean }>({
        X: true,
        Y: true,
        Z: true,
    });

    public get categories() {
        return categories;
    }
    public get colorCodeOfCategories() {
        return colorCodeOfCategories;
    }

    private readonly allPatientCategories$ = this.store.select(
        selectPatientCategories
    );
    public readonly vehicleTemplates$ = this.store.select(
        selectVehicleTemplates
    );

    public readonly mapImageTemplates$ = this.store.select(
        selectMapImagesTemplates
    );

    public readonly measureTemplates = this.store.selectSignal(
        selectMeasureTemplates
    );

    public patientCategories$?: Observable<{
        [key in FilterCategory]?: PatientCategory[];
    }>;

    ngOnInit() {
        this.patientCategories$ = combineLatest([
            this.allPatientCategories$,
            this.selectedCategories$,
        ]).pipe(
            map(([patientCategories, selectedCategories]) => {
                const filteredCategories: {
                    [key in FilterCategory]?: PatientCategory[];
                } = {};
                for (const category of Object.keys(
                    selectedCategories
                ) as FilterCategory[]) {
                    if (!selectedCategories[category]) continue;
                    filteredCategories[category] = patientCategories.filter(
                        (patientCategory) =>
                            category ===
                            (patientCategory.name.firstField
                                .colorCode as FilterCategory)
                    );
                }
                return filteredCategories;
            })
        );
    }

    public changeDisplayTransferLines(newValue: boolean) {
        this.transferLinesService.displayTransferLines = newValue;
    }

    public readonly simulatedRegionDragTemplates = simulatedRegionDragTemplates;

    public readonly restrictedZoneDragTemplates = restrictedZoneDragTemplates;

    public readonly viewportTemplate = {
        image: viewportImage,
    };

    public readonly transferPointTemplate = {
        image: transferPointImage,
    };

    public addImageTemplate() {
        openCreateImageTemplateModal(this.ngbModalService);
    }

    public addVehicleTemplate() {
        openCreateVehicleTemplateModal(this.ngbModalService);
    }

    public addMeasureTemplate() {
        openCreateMeasureTemplateModal(this.ngbModalService);
    }

    public editMapImageTemplate(mapImageTemplateId: UUID) {
        openEditImageTemplateModal(this.ngbModalService, mapImageTemplateId);
    }

    public editVehicleTemplate(mapImageTemplateId: UUID) {
        openEditVehicleTemplateModal(this.ngbModalService, mapImageTemplateId);
    }

    public async deleteMeasureTemplate(measureTemplateId: UUID): Promise<void> {
        const measure = selectStateSnapshot(
            createSelectMeasureTemplate(measureTemplateId),
            this.store
        );
        const confirmDelete = await this.confirmationModalService.confirm({
            title: 'Maßnahme löschen',
            description: `Möchten Sie die Maßnahme "${measure.name}" wirklich löschen?`,
        });
        if (!confirmDelete) {
            return;
        }
        this.exerciseService.proposeAction({
            type: '[MeasureTemplate] Delete measureTemplate',
            id: measureTemplateId,
        });
    }

    public setCurrentCategory(
        category: (typeof this.categories)[number],
        status: boolean
    ) {
        this.selectedCategories$.next({
            ...this.selectedCategories$.value,
            [this.colorCodeOfCategories[category]]: status,
        });
    }

    public importingTemplates = false;
    public async importPartialExport(fileList: FileList) {
        try {
            this.importingTemplates = true;
            const importedText = await fileList.item(0)?.text();
            if (importedText === undefined) {
                // The file dialog has been aborted.
                return;
            }
            const importedPlainObject = JSON.parse(
                importedText
            ) as PartialExport;
            const migratedPartialExport = migratePartialExport(
                importedPlainObject,
                selectStateSnapshot(selectExerciseState, this.store)
            );
            const validation = validateExerciseExport(migratedPartialExport);
            if (validation.length > 0) {
                throw Error(
                    `PartialExport is invalid:\n${validation.join('\n')}`
                );
            }
            openPartialImportOverwriteModal(
                this.ngbModalService,
                migratedPartialExport
            );
        } catch {
            this.messageService.postError({
                title: 'Fehler beim Importieren von Vorlagen',
            });
        } finally {
            this.importingTemplates = false;
        }
    }
}
