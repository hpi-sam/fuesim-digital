import { Component, inject } from '@angular/core';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { cloneDeepMutable } from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectTileMapProperties,
    selectConfiguration,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { UrlValidatorDirective } from '../../../../../../shared/validation/url-validator.directive';
import { AutofocusDirective } from '../../../../../../shared/directives/autofocus.directive';
import { DisplayValidationComponent } from '../../../../../../shared/validation/display-validation/display-validation.component';
import { AppSaveOnTypingDirective } from '../../../../../../shared/directives/app-save-on-typing.directive';

@Component({
    selector: 'app-exercise-settings-modal',
    templateUrl: './exercise-settings-modal.component.html',
    styleUrls: ['./exercise-settings-modal.component.scss'],
    imports: [
        FormsModule,
        UrlValidatorDirective,
        AutofocusDirective,
        DisplayValidationComponent,
        NgbTooltip,
        AppSaveOnTypingDirective,
        AsyncPipe,
    ],
})
export class ExerciseSettingsModalComponent {
    private readonly store = inject<Store<AppState>>(Store);
    readonly activeModal = inject(NgbActiveModal);
    private readonly exerciseService = inject(ExerciseService);

    public tileMapProperties = cloneDeepMutable(
        selectStateSnapshot(selectTileMapProperties, this.store)
    );

    public readonly tileMapUrlRegex =
        /^(?=.*\{x\})(?=.*\{-?y\})(?=.*\{z\}).*$/u;

    public configuration$ = this.store.select(selectConfiguration);

    public updateTileMapProperties() {
        this.exerciseService.proposeAction({
            type: '[Configuration] Set tileMapProperties',
            tileMapProperties: this.tileMapProperties,
        });
    }

    public setPretriageFlag(pretriageEnabled: boolean) {
        this.exerciseService.proposeAction({
            type: '[Configuration] Set pretriageEnabled',
            pretriageEnabled,
        });
    }

    public setBluePatientsFlag(bluePatientsEnabled: boolean) {
        this.exerciseService.proposeAction({
            type: '[Configuration] Set bluePatientsEnabled',
            bluePatientsEnabled,
        });
    }

    public updatePatientIdentifierPrefix(patientIdentifierPrefix: string) {
        this.exerciseService.proposeAction({
            type: '[Configuration] Set patientIdentifierPrefix',
            patientIdentifierPrefix,
        });
    }

    public setVehicleStatusHighlightFlag(
        vehicleStatusHighlightEnabled: boolean
    ) {
        this.exerciseService.proposeAction({
            type: '[Configuration] Set vehicleStatusHighlightEnabled',
            vehicleStatusHighlightEnabled,
        });
    }

    public setVehicleStatusInPatientStatusColorFlag(
        vehicleStatusInPatientStatusColorEnabled: boolean
    ) {
        this.exerciseService.proposeAction({
            type: '[Configuration] Set vehicleStatusInPatientStatusColorEnabled',
            vehicleStatusInPatientStatusColor:
                vehicleStatusInPatientStatusColorEnabled,
        });
    }

    public close() {
        this.activeModal.close();
    }
}
