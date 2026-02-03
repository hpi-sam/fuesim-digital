import type { OnDestroy } from '@angular/core';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { ApplicationService } from 'src/app/core/application.service';

@Component({
    selector: 'app-join-exercise-modal',
    templateUrl: './join-exercise-modal.component.html',
    styleUrls: ['./join-exercise-modal.component.scss'],
    standalone: false,
})
export class JoinExerciseModalComponent implements OnDestroy {
    public exerciseId!: string;
    public clientName = '';
    /**
     * Emits true when the exercise was successfully joined.
     * If it completes without emitting a value or emits false, the exercise couldn't be joined.
     */
    public exerciseJoined$ = new Subject<boolean>();

    constructor(
        private readonly applicationService: ApplicationService,
        private readonly activeModal: NgbActiveModal
    ) {}

    public async joinExercise() {
        const successfullyJoined = await this.applicationService.joinExercise(
            this.exerciseId,
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
