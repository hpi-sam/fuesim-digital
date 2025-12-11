import { Component } from '@angular/core';
import type { Exercises } from 'digital-fuesim-manv-shared';
import { ApiService } from 'src/app/core/api.service';
import { HttpResourceRef } from '@angular/common/http';

@Component({
    selector: 'app-exercise-list',
    templateUrl: './exercise-list.component.html',
    styleUrls: ['./exercise-list.component.scss'],
    standalone: false,
})
export class ExerciseListComponent {
    exercises: HttpResourceRef<Exercises | undefined>;

    constructor(private readonly apiService: ApiService) {
        this.exercises = apiService.getExercisesResource();
    }
}
