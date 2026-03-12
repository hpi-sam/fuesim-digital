import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { ExercisesRoutingModule } from './exercises-routing.module';
import { ExerciseModule } from './exercise/exercise.module';
import { JoinExerciseModalComponent } from './shared/join-exercise-modal/join-exercise-modal.component';
import { ExerciseListComponent } from './list/exercise-list.component';
import { ExerciseTemplateListComponent } from './template-list/exercise-template-list.component';
import { CreateExerciseTemplateModalComponent } from './shared/create-exercise-template-modal/create-exercise-template-modal.component';

@NgModule({
    imports: [
        CommonModule,
        ExercisesRoutingModule,
        ExerciseModule,
        FormsModule,
        SharedModule,
        JoinExerciseModalComponent,
        ExerciseListComponent,
        ExerciseTemplateListComponent,
        CreateExerciseTemplateModalComponent,
    ],
})
export class ExercisesModule {}
