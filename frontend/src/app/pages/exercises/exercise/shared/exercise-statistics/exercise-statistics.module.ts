import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatSortModule } from '@angular/material/sort';
import {
    NgbDropdownModule,
    NgbNavModule,
    NgbPopoverModule,
} from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module.js';
import { ExerciseStatisticsModalComponent } from './exercise-statistics-modal/exercise-statistics-modal.component.js';
import { HospitalPatientsTableComponent } from './hospital-patients-table/hospital-patients-table.component.js';
import { StackedBarChartComponent } from './stacked-bar-chart/stacked-bar-chart.component.js';
import { LogEntryComponent } from './log-entry/log-entry.component.js';
import { TagComponent } from './tag/tag.component.js';
import { LogTableComponent } from './log-table/log-table.component.js';

@NgModule({
    declarations: [
        ExerciseStatisticsModalComponent,
        StackedBarChartComponent,
        HospitalPatientsTableComponent,
        LogEntryComponent,
        TagComponent,
        LogTableComponent,
    ],
    imports: [
        CommonModule,
        NgbDropdownModule,
        SharedModule,
        MatSortModule,
        NgbNavModule,
        NgbPopoverModule,
    ],
})
export class ExerciseStatisticsModule {}
