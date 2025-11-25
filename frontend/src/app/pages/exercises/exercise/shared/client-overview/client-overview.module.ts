import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module.js';
import { ClientOverviewModalComponent } from './client-overview-modal/client-overview-modal.component.js';
import { ClientOverviewTableComponent } from './client-overview-table/client-overview-table.component.js';

@NgModule({
    declarations: [ClientOverviewModalComponent, ClientOverviewTableComponent],
    imports: [CommonModule, NgbModule, FormsModule, SharedModule],
})
export class ClientOverviewModule {}
