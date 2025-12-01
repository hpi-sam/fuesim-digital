import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExercisesRoutingModule } from './exercises-routing.module';
import { ExerciseModule } from './exercise/exercise.module';
import { JoinExerciseModalComponent } from './shared/join-exercise-modal/join-exercise-modal.component';

@NgModule({
    declarations: [JoinExerciseModalComponent],
    imports: [
        CommonModule,
        ExercisesRoutingModule,
        ExerciseModule,
        FormsModule,
        SharedModule,
    ],
})
export class ExercisesModule {}
