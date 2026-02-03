import { Component } from '@angular/core';
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
    exercises: HttpResourceRef<GetExercisesResponseData | undefined>;

    constructor(
        private readonly apiService: ApiService,
        private readonly messageService: MessageService
    ) {
        this.exercises = apiService.getExercisesResource();
    }

    public async createExercise() {
        this.apiService.createExercise().then((ids) => {
            this.messageService.postMessage(
                {
                    title: 'Übung erfolgreich erstellt',
                    body: '',
                    color: 'success',
                },
                'toast'
            );
            this.exercises.reload();
        });
    }
}
