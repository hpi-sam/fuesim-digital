import { Component, inject } from '@angular/core';
import type { GetExercisesResponseData } from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import { MessageService } from '../../../core/messages/message.service';
import { ApiService } from '../../../core/api.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ExerciseCardComponent } from '../../../shared/components/exercise-card/exercise-card.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

@Component({
    selector: 'app-exercise-list',
    templateUrl: './exercise-list.component.html',
    styleUrls: ['./exercise-list.component.scss'],
    imports: [HeaderComponent, ExerciseCardComponent, FooterComponent],
})
export class ExerciseListComponent {
    private readonly apiService = inject(ApiService);
    private readonly messageService = inject(MessageService);

    exercises: HttpResourceRef<GetExercisesResponseData | undefined>;

    constructor() {
        const apiService = this.apiService;

        this.exercises = apiService.getExercisesResource();
    }

    public async createExercise() {
        this.apiService.createExercise().then((_ids) => {
            this.messageService.postMessage({
                title: 'Übung erfolgreich erstellt',
                body: '',
                color: 'success',
            });
            this.exercises.reload();
        });
    }
}
