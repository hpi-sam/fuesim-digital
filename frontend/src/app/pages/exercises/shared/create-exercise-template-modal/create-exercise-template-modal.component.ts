import type { OnDestroy } from '@angular/core';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { NgForm } from '@angular/forms';
import { ApiService } from '../../../../core/api.service';

@Component({
    selector: 'app-create-exercise-template-modal',
    templateUrl: './create-exercise-template-modal.component.html',
    styleUrls: ['./create-exercise-template-modal.component.scss'],
    standalone: false,
})
export class CreateExerciseTemplateModalComponent implements OnDestroy {
    /**
     * Emits true when the exercise was successfully joined.
     * If it completes without emitting a value or emits false, the exercise couldn't be joined.
     */
    public exerciseTemplateCreated$ = new Subject<boolean>();

    model = { name: '', description: '' };

    constructor(
        private readonly apiService: ApiService,
        private readonly activeModal: NgbActiveModal
    ) {}

    public async createExerciseTemplate(form: NgForm) {
        await this.apiService.createExerciseTemplate(this.model);
        this.exerciseTemplateCreated$.next(true);
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }

    ngOnDestroy() {
        this.exerciseTemplateCreated$.complete();
    }
}
