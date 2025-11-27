import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { JoinExerciseModalComponent } from './join-exercise-modal.component';

/**
 * @returns Whether the exercise was successfully joined.
 */
export async function tryToJoinExercise(
    ngbModalService: NgbModal,
    exerciseId: string
): Promise<boolean> {
    const modalRef = ngbModalService.open(JoinExerciseModalComponent, {
        keyboard: false,
        backdrop: 'static',
    });
    const componentInstance =
        modalRef.componentInstance as JoinExerciseModalComponent;
    componentInstance.exerciseId = exerciseId;
    return firstValueFrom(componentInstance.exerciseJoined$, {
        defaultValue: false,
    });
}
