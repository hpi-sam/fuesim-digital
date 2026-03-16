import { OnDestroy, Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import type { ExerciseKey } from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../../../../core/application.service';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';

@Component({
    selector: 'app-join-exercise-modal',
    templateUrl: './join-exercise-modal.component.html',
    styleUrls: ['./join-exercise-modal.component.scss'],
    imports: [FormsModule, AutofocusDirective],
})
export class JoinExerciseModalComponent implements OnDestroy {
    private readonly applicationService = inject(ApplicationService);
    private readonly activeModal = inject(NgbActiveModal);

    public exerciseKey!: ExerciseKey;
    public clientName = '';
    /**
     * Emits true when the exercise was successfully joined.
     * If it completes without emitting a value or emits false, the exercise couldn't be joined.
     */
    public exerciseJoined$ = new Subject<boolean>();

    public async joinExercise() {
        const successfullyJoined = await this.applicationService.joinExercise(
            this.exerciseKey,
            this.clientName
        );
        this.exerciseJoined$.next(successfullyJoined);
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }

    ngOnDestroy() {
        this.exerciseJoined$.complete();
    }
}
