import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ClientOverviewModalComponent } from './client-overview-modal/client-overview-modal.component';
import { ClientOverviewTableComponent } from './client-overview-table/client-overview-table.component';

@NgModule({
    declarations: [ClientOverviewModalComponent, ClientOverviewTableComponent],
    imports: [CommonModule, NgbModule, FormsModule, SharedModule],
})
export class ClientOverviewModule {}
