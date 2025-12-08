import { Component } from '@angular/core';
import type { ExerciseList } from 'digital-fuesim-manv-shared';
import { ApiService } from 'src/app/core/api.service';
import { HttpResourceRef } from '@angular/common/http';

@Component({
    selector: 'app-exercise-list',
    templateUrl: './exercise-list.component.html',
    styleUrls: ['./exercise-list.component.scss'],
    standalone: false,
})
export class ExerciseListComponent {
    exercises: HttpResourceRef<ExerciseList | undefined>;

    constructor(private readonly apiService: ApiService) {
        this.exercises = apiService.getExercisesResource();
    }
}
