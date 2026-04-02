import type { OnChanges } from '@angular/core';
import { Component, inject, input, signal } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { PatientStatus, UUID } from 'fuesim-digital-shared';
import {
    getPatientVisibleStatus,
    Patient,
    isPretriageStatusLocked,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import {
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavLinkBase,
    NgbNavContent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
    NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { QrCodeComponent } from 'ng-qrcode';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';
import {
    selectConfiguration,
    createSelectPatient,
    createSelectScoutable,
} from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
import { PatientIdentifierComponent } from '../patient-identifier/patient-identifier.component';
import { PatientStatusDisplayComponent } from '../patient-status-displayl/patient-status-display/patient-status-display.component';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { AppSaveOnTypingDirective } from '../../directives/app-save-on-typing.directive';
import { PatientStatusBadgeComponent } from '../patient-status-badge/patient-status-badge.component';
import { DisplayValidationComponent } from '../../validation/display-validation/display-validation.component';
import { ScoutableElementNavItemComponent } from '../scoutable-element-nav-item/scoutable-element-nav-item.component';

@Component({
    selector: 'app-patients-details',
    templateUrl: './patients-details.component.html',
    styleUrls: ['./patients-details.component.scss'],
    imports: [
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbNavLinkBase,
        NgbNavContent,
        PatientIdentifierComponent,
        PatientStatusDisplayComponent,
        FormsModule,
        AutofocusDirective,
        AppSaveOnTypingDirective,
        NgbDropdown,
        NgbDropdownToggle,
        PatientStatusBadgeComponent,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        DisplayValidationComponent,
        QrCodeComponent,
        NgbNavOutlet,
        AsyncPipe,
        ScoutableElementNavItemComponent,
    ],
})
export class PatientsDetailsComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly patientId = input.required<UUID>();
    readonly openScoutInfo = input<boolean>(false);
    activeId = signal<string>('general');

    readonly currentRole$ = this.store.select(selectCurrentMainRole);
    configuration$ = this.store.select(selectConfiguration);
    patient$!: Observable<Patient>;
    visibleStatus$!: Observable<PatientStatus>;
    pretriageStatusIsLocked$?: Observable<boolean>;
    readonly pretriageOptions$: Observable<PatientStatus[]> =
        this.configuration$.pipe(
            map((configuration) =>
                configuration.bluePatientsEnabled
                    ? ['white', 'black', 'blue', 'red', 'yellow', 'green']
                    : ['white', 'black', 'red', 'yellow', 'green']
            )
        );
    IsScoutableInfoParticipantVisible$?: Observable<boolean>;

    ngOnChanges(): void {
        this.patient$ = this.store.select(
            createSelectPatient(this.patientId())
        );
        this.IsScoutableInfoParticipantVisible$ = this.patient$.pipe(
            map((patient) => {
                if (patient.scoutableId) {
                    const scoutable = this.store.selectSignal(
                        createSelectScoutable(patient.scoutableId)
                    );
                    return scoutable().isVisibleForParticipants;
                }
                return false;
            })
        );
        if (this.openScoutInfo()) {
            this.activeId.set('scout-Info');
        }
        this.visibleStatus$ = this.store.select(
            createSelector(
                createSelectPatient(this.patientId()),
                selectConfiguration,
                (patient, configuration) =>
                    getPatientVisibleStatus(
                        patient,
                        configuration.pretriageEnabled,
                        configuration.bluePatientsEnabled
                    )
            )
        );
        this.pretriageStatusIsLocked$ = this.patient$.pipe(
            map(isPretriageStatusLocked)
        );
    }

    setPretriageCategory(patientStatus: PatientStatus) {
        this.exerciseService.proposeAction({
            type: '[Patient] Set Visible Status',
            patientId: this.patientId(),
            patientStatus,
        });
    }

    setTransportPriority(priority: boolean) {
        this.exerciseService.proposeAction({
            type: '[Patient] Set Transport Priority',
            patientId: this.patientId(),
            hasTransportPriority: priority,
        });
    }

    updateRemarks(remarks: string) {
        this.exerciseService.proposeAction({
            type: '[Patient] Set Remarks',
            patientId: this.patientId(),
            remarks,
        });
    }

    updateCustomQRCode(customQRCode: string) {
        this.exerciseService.proposeAction({
            type: '[Patient] Set Custom QR Code',
            patientId: this.patientId(),
            customQRCode,
        });
    }
}
