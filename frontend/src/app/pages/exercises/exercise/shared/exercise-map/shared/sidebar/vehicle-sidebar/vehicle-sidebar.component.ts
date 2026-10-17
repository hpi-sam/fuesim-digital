import { Component } from '@angular/core';
import { SidebarHeaderComponent } from '../sidebar-header/sidebar-header.component';

@Component({
    selector: 'app-vehicle-sidebar',
    imports: [SidebarHeaderComponent],
    templateUrl: './vehicle-sidebar.component.html',
    styleUrl: './vehicle-sidebar.component.scss',
})
export class VehicleSidebarComponent {}
