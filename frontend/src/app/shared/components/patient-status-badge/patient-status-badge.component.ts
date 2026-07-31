import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import type { PatientStatus } from 'fuesim-digital-shared';
import { statusNames } from 'fuesim-digital-shared';
import { NgStyle } from '@angular/common';

@Component({
    selector: 'app-patient-status-badge',
    templateUrl: './patient-status-badge.component.html',
    styleUrls: ['./patient-status-badge.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgStyle],
})
export class PatientStatusBadgeComponent {
    readonly status = input.required<PatientStatus>();

    public readonly statusNames = statusNames;
}
