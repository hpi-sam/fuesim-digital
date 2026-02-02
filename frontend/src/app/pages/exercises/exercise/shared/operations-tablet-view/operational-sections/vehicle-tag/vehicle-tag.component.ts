import { Component, inject, Input, OnInit } from '@angular/core';
import { type Vehicle } from '../../../../../../../../../../shared/dist/models/vehicle';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
    // We need to do it this way, to avoid cdkDragDrop issues
    selector: 'app-vehicle-tag',
    standalone: false,
    templateUrl: './vehicle-tag.component.html',
    styleUrl: './vehicle-tag.component.scss',
    hostDirectives: [CdkDrag],
})
export class VehicleTagComponent implements OnInit {
    private cdkDrag = inject(CdkDrag);

    @Input()
    public vehicle!: Vehicle;

    ngOnInit() {
        this.cdkDrag.data = this.vehicle.id;
    }
}
