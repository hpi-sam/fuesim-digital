import type { Routes } from '@angular/router';
import { BaseSidebarComponent } from '../../base-sidebar/base-sidebar.component';
import { VehicleSidebarComponent } from '../shared/sidebar/vehicle-sidebar/vehicle-sidebar.component';

const sidebarRoutes: Routes = [
    {
        path: '',
        component: BaseSidebarComponent,
    },
    {
        path: 'vehicle/:id',
        component: VehicleSidebarComponent,
    },
];
export default sidebarRoutes;
