import { Component, inject } from '@angular/core';
import type { GetExercisesResponseData } from 'digital-fuesim-manv-shared';
import { ApiService } from 'src/app/core/api.service';
import { HttpResourceRef } from '@angular/common/http';
import { MessageService } from '../../../core/messages/message.service';

@Component({
    selector: 'app-exercise-list',
    templateUrl: './exercise-list.component.html',
    styleUrls: ['./exercise-list.component.scss'],
    standalone: false,
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
