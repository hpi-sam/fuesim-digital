import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatSortModule } from '@angular/material/sort';
import {
    NgbDropdownModule,
    NgbNavModule,
    NgbPopoverModule,
} from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExerciseStatisticsModalComponent } from './exercise-statistics-modal/exercise-statistics-modal.component';
import { HospitalPatientsTableComponent } from './hospital-patients-table/hospital-patients-table.component';
import { StackedBarChartComponent } from './stacked-bar-chart/stacked-bar-chart.component';
import { LogEntryComponent } from './log-entry/log-entry.component';
import { TagComponent } from './tag/tag.component';
import { LogTableComponent } from './log-table/log-table.component';

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
