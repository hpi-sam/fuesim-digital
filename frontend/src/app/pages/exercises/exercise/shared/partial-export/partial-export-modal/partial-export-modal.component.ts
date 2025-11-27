import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { cloneDeepMutable, PartialExport } from 'digital-fuesim-manv-shared';
import { saveBlob } from 'src/app/shared/functions/save-blob';
import type { AppState } from 'src/app/state/app.state';
import { selectExerciseState } from 'src/app/state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';

interface PartialExportConfiguration {
    patientCategories: boolean;
    vehicleTemplates: boolean;
    mapImageTemplates: boolean;
}

@Component({
    selector: 'app-partial-export-modal',
    templateUrl: './partial-export-modal.component.html',
    styleUrls: ['./partial-export-modal.component.scss'],
    standalone: false,
})
export class PartialExportModalComponent {
    constructor(
        private readonly store: Store<AppState>,
        private readonly activeModal: NgbActiveModal
    ) {}

    public configuration: PartialExportConfiguration = {
        mapImageTemplates: false,
        patientCategories: false,
        vehicleTemplates: false,
    };

    public close() {
        this.activeModal.close();
    }

    public partialExport() {
        const currentState = selectStateSnapshot(
            selectExerciseState,
            this.store
        );
        const patientCategories = this.configuration.patientCategories
            ? currentState.patientCategories
            : undefined;
        const vehicleTemplates = this.configuration.vehicleTemplates
            ? currentState.vehicleTemplates
            : undefined;
        const mapImageTemplates = this.configuration.mapImageTemplates
            ? currentState.mapImageTemplates
            : undefined;
        const blob = new Blob([
            JSON.stringify(
                new PartialExport(
                    cloneDeepMutable(patientCategories),
                    cloneDeepMutable(vehicleTemplates),
                    cloneDeepMutable(mapImageTemplates)
                )
            ),
        ]);
        saveBlob(blob, `exercise-partial-${currentState.participantId}.json`);
    }
}
