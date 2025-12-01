import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExerciseSettingsModalComponent } from './exercise-settings-modal/exercise-settings-modal.component';

export function openExerciseSettingsModal(ngbModalService: NgbModal) {
    ngbModalService.open(ExerciseSettingsModalComponent, {
        size: 'lg',
    });
}
