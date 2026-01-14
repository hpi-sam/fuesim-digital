import { Component } from '@angular/core';
import type { Exercises } from 'digital-fuesim-manv-shared';
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
    exercises: HttpResourceRef<Exercises | undefined>;

    constructor(
        private readonly apiService: ApiService,
        private readonly messageService: MessageService
    ) {
        this.exercises = apiService.getExercisesResource();
    }

    public async createExercise() {
        this.apiService
            .createExercise()
            .then((ids) => {
                // TODO use generic success handling
                this.messageService.postMessage(
                    {
                        title: 'Übung erstellt',
                        body: '',
                        color: 'success',
                    },
                    'toast'
                );
                this.exercises.reload();
            })
            // TODO use generic error handling
            .catch((error) => {
                this.messageService.postError({
                    title: 'Fehler beim Erstellen der Übung',
                    error: error.message,
                });
            });
    }
}
