import type { Routes } from '@angular/router';
import { BaseSidebarComponent } from '../../base-sidebar/base-sidebar.component';

const sidebarRoutes: Routes = [
    {
        path: '',
        component: BaseSidebarComponent,
    },
];
export default sidebarRoutes;
