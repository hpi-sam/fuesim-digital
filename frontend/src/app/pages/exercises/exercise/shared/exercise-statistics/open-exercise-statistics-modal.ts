import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExerciseStatisticsModalComponent } from './exercise-statistics-modal/exercise-statistics-modal.component.js';

export function openExerciseStatisticsModal(ngbModalService: NgbModal) {
    ngbModalService.open(ExerciseStatisticsModalComponent, {
        size: 'xxl',
    });
}
