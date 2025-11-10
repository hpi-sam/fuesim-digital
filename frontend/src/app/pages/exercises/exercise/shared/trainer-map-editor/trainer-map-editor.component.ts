import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
    Viewport,
    TransferPoint,
    PartialExport,
    migratePartialExport,
    validateExerciseExport,
} from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';
import { MessageService } from 'src/app/core/messages/message.service';
import type { PatientCategory, UUID } from 'digital-fuesim-manv-shared';
import type { AppState } from 'src/app/state/app.state';
import {
    selectVehicleTemplates,
    selectPatientCategories,
    selectMapImagesTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';
import { map, Observable } from 'rxjs';
import { DragElementService } from '../core/drag-element.service';
import { TransferLinesService } from '../core/transfer-lines.service';
import { openCreateImageTemplateModal } from '../editor-panel/create-image-template-modal/open-create-image-template-modal';
import { openCreateVehicleTemplateModal } from '../editor-panel/create-vehicle-template-modal/open-create-vehicle-template-modal';
import { openEditImageTemplateModal } from '../editor-panel/edit-image-template-modal/open-edit-image-template-modal';
import { openPartialImportOverwriteModal } from '../partial-import/open-partial-import-overwrite-modal';
import { simulatedRegionDragTemplates } from '../editor-panel/templates/simulated-region';
import { openEditVehicleTemplateModal } from '../editor-panel/edit-vehicle-template-modal/open-edit-vehicle-template-modal';

@Component({
    selector: 'app-trainer-map-editor',
    templateUrl: './trainer-map-editor.component.html',
    styleUrls: ['./trainer-map-editor.component.scss'],
    standalone: false,
})
/**
 * A wrapper around the map that provides trainers with more options and tools.
 */
export class TrainerMapEditorComponent implements OnInit {
    public currentCategory: (typeof this.colorCodeOfCategories)[(typeof this.categories)[number]] =
        'X';
    public readonly categories = ['green', 'yellow', 'red'] as const;
    public readonly colorCodeOfCategories = {
        green: 'X',
        yellow: 'Y',
        red: 'Z',
    } as const;

    public readonly vehicleTemplates$ = this.store.select(
        selectVehicleTemplates
    );

    public readonly mapImageTemplates$ = this.store.select(
        selectMapImagesTemplates
    );

    public patientCategories$?: Observable<PatientCategory[]>;

    ngOnInit() {
        this.updatePatientCategories();
    }

    public changeDisplayTransferLines(newValue: boolean) {
        this.transferLinesService.displayTransferLines = newValue;
    }

    private updatePatientCategories() {
        this.patientCategories$ = this.store
            .select(selectPatientCategories)
            .pipe(
                map((patientCategories) =>
                    patientCategories.filter(
                        (patientCategory) =>
                            patientCategory.name.firstField.colorCode ===
                            this.currentCategory
                    )
                )
            );
    }

    constructor(
        private readonly store: Store<AppState>,
        public readonly dragElementService: DragElementService,
        public readonly transferLinesService: TransferLinesService,
        private readonly ngbModalService: NgbModal,
        private readonly messageService: MessageService,
        private readonly exerciseService: ExerciseService
    ) {}

    public readonly simulatedRegionTemplates = simulatedRegionDragTemplates;

    public readonly viewportTemplate = {
        image: Viewport.image,
    };

    public readonly transferPointTemplate = {
        image: TransferPoint.image,
    };

    public addImageTemplate() {
        openCreateImageTemplateModal(this.ngbModalService);
    }

    public addVehicleTemplate() {
        openCreateVehicleTemplateModal(this.ngbModalService);
    }

    public editMapImageTemplate(mapImageTemplateId: UUID) {
        openEditImageTemplateModal(this.ngbModalService, mapImageTemplateId);
    }

    public editVehicleTemplate(mapImageTemplateId: UUID) {
        openEditVehicleTemplateModal(this.ngbModalService, mapImageTemplateId);
    }

    public setCurrentCategory(category: (typeof this.categories)[number]) {
        this.currentCategory = this.colorCodeOfCategories[category];
        this.updatePatientCategories();
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
            const migratedPartialExport =
                migratePartialExport(importedPlainObject);
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
        } finally {
            this.importingTemplates = false;
        }
    }
}
