import { Component, inject, input, OnInit } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import type { Vehicle } from 'fuesim-digital-shared';

@Component({
    // We need to do it this way, to avoid cdkDragDrop issues
    selector: 'app-vehicle-tag',
    templateUrl: './vehicle-tag.component.html',
    styleUrl: './vehicle-tag.component.scss',
    hostDirectives: [CdkDrag],
})
export class VehicleTagComponent implements OnInit {
    private readonly cdkDrag = inject(CdkDrag);

    public readonly vehicle = input.required<Vehicle>();

    ngOnInit() {
        this.cdkDrag.data = this.vehicle().id;
    }
}
