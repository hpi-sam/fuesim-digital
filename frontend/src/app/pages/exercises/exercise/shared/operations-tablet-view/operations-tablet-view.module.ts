import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperationsTabletViewComponent } from './operations-tablet-view.component';
import {
    NgbNavContent,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavLinkButton,
    NgbNavLinkBase,
    NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import { OperationalSectionContainerComponent } from './operational-sections/operational-section-container/operational-section-container.component';
import {
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    DragDropModule,
} from '@angular/cdk/drag-drop';
import { VehicleTagComponent } from './operational-sections/vehicle-tag/vehicle-tag.component';
import { VehiclesOnLocationComponent } from './operational-sections/vehicles-on-location/vehicles-on-location.component';
import { SectionLeaderSlotComponent } from './operational-sections/section-leader-slot/section-leader-slot.component';
import { LocalSectionLeaderComponent } from './operational-sections/local-section-leader/local-section-leader.component';
import { OperationDetailsTabComponent } from './operation-details/operation-details.component';
import { OperationalSectionsTabComponent } from './operational-sections/operational-sections.component';
import { OperationsMapComponent } from './operation-details/operations-map/operations-map.component';
import { OperationsVehiclesComponent } from './operation-details/operations-vehicles/operations-vehicles.component';
import { OperationsVehicleItemComponent } from './operation-details/operations-vehicles/operations-vehicle-item/operations-vehicle-item.component';

@NgModule({
    declarations: [
        OperationsTabletViewComponent,
        OperationalSectionContainerComponent,
        OperationalSectionsTabComponent,
        VehicleTagComponent,
        VehiclesOnLocationComponent,
        SectionLeaderSlotComponent,
        LocalSectionLeaderComponent,
        OperationDetailsTabComponent,
        OperationsMapComponent,
        OperationsVehiclesComponent,
        OperationsVehicleItemComponent,
    ],
    imports: [
        CommonModule,
        NgbNavContent,
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbNavLinkButton,
        NgbNavLinkBase,
        NgbNavOutlet,
        DragDropModule,
        CdkDrag,
        CdkDropList,
        CdkDropListGroup,
    ],
    exports: [OperationsTabletViewComponent],
})
export class OperationsTabletViewModule {}
