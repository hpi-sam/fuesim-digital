import { Component, inject, output } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { catchAllHospitalId, newHospital } from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../core/exercise.service';
import type { AppState } from '../../../../../state/app.state';
import { selectHospitals } from '../../../../../state/application/selectors/exercise.selectors';
import { AppSaveOnTypingDirective } from '../../../../../shared/directives/app-save-on-typing.directive';
import { ValuesPipe } from '../../../../../shared/pipes/values.pipe';

@Component({
    selector: 'app-hospital-editor-page',
    templateUrl: './hospital-editor-page.component.html',
    styleUrls: ['./hospital-editor-page.component.scss'],
    imports: [FormsModule, AppSaveOnTypingDirective, AsyncPipe, ValuesPipe],
})
export class HospitalEditorPageComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    public readonly closeView = output();

    public hospitals$ = this.store.select(selectHospitals);
    public catchAllHospitalId = catchAllHospitalId;

    public addHospital() {
        this.exerciseService.proposeAction({
            type: '[Hospital] Add hospital',
            hospital: newHospital('Krankenhaus-???', 60 * 60 * 1000),
        });
    }

    public editTransportDurationToHospital(
        hospitalId: UUID,
        transportDuration: number
    ) {
        this.exerciseService.proposeAction({
            type: '[Hospital] Edit transportDuration to hospital',
            hospitalId,
            transportDuration,
        });
    }

    public renameHospital(hospitalId: UUID, name: string) {
        this.exerciseService.proposeAction({
            type: '[Hospital] Rename hospital',
            hospitalId,
            name,
        });
    }

    public removeHospital(hospitalId: UUID) {
        this.exerciseService.proposeAction({
            type: '[Hospital] Remove hospital',
            hospitalId,
        });
    }
}
