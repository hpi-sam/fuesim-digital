import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ManageExerciseCollectionsModalComponent } from './manage-exercise-collections-modal.component';

export function openManageExerciseCollectionsModal(modalService: NgbModal) {
    modalService.open(ManageExerciseCollectionsModalComponent, {
        size: 'lg',
    });
}
