import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import type { ExerciseKey } from 'fuesim-digital-shared';
import { JoinExerciseModalComponent } from './join-exercise-modal.component';

/**
 * @returns Whether the exercise was successfully joined.
 */
export async function tryToJoinExercise(
    ngbModalService: NgbModal,
    exerciseKey: ExerciseKey
): Promise<boolean> {
    const modalRef = ngbModalService.open(JoinExerciseModalComponent, {
        keyboard: false,
        backdrop: 'static',
    });
    const componentInstance =
        modalRef.componentInstance as JoinExerciseModalComponent;
    componentInstance.exerciseKey = exerciseKey;
    return firstValueFrom(componentInstance.exerciseJoined$, {
        defaultValue: false,
    });
}
