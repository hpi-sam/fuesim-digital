import type { OnDestroy } from '@angular/core';
import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { NgForm, FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';
import { DisplayValidationComponent } from '../../../../shared/validation/display-validation/display-validation.component';

@Component({
    selector: 'app-create-exercise-template-modal',
    templateUrl: './create-exercise-template-modal.component.html',
    styleUrls: ['./create-exercise-template-modal.component.scss'],
    imports: [FormsModule, AutofocusDirective, DisplayValidationComponent],
})
export class CreateExerciseTemplateModalComponent implements OnDestroy {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);

    /**
     * Emits true when the exercise was successfully joined.
     * If it completes without emitting a value or emits false, the exercise couldn't be joined.
     */
    public exerciseTemplateCreated$ = new Subject<boolean>();

    model = { name: '', description: '' };

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
