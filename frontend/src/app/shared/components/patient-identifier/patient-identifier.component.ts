import type { OnChanges } from '@angular/core';
import {
    Component,
    inject,
    input,
    ChangeDetectionStrategy,
} from '@angular/core';
import { Store } from '@ngrx/store';
import type { Patient, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../state/app.state';
import { createSelectPatient } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-patient-identifier',
    templateUrl: './patient-identifier.component.html',
    styleUrls: ['./patient-identifier.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [AsyncPipe],
})
export class PatientIdentifierComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    readonly patientId = input.required<UUID>();

    patient$!: Observable<Patient>;

    ngOnChanges(): void {
        this.patient$ = this.store.select(
            createSelectPatient(this.patientId())
        );
    }
}
