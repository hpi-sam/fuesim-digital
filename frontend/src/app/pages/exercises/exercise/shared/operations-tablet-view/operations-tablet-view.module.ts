import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    NgbNavContent,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavLinkButton,
    NgbNavLinkBase,
    NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import {
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    DragDropModule,
} from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { ExerciseStateBadgeModule } from '../exercise-state-badge/exercise-state-badge.module';
import { SharedModule } from '../../../../../shared/shared.module';
import { OperationsTabletViewComponent } from './operations-tablet-view.component';
import { OperationalSectionContainerComponent } from './operational-sections/operational-section-container/operational-section-container.component';
import { VehicleTagComponent } from './operational-sections/vehicle-tag/vehicle-tag.component';
import { SectionLeaderSlotComponent } from './operational-sections/section-leader-slot/section-leader-slot.component';
import { LocalOperationalLeaderComponent } from './operational-sections/local-operational-leader/local-operational-leader.component';
import { OperationDetailsTabComponent } from './operation-details/operation-details.component';
import { OperationalSectionsTabComponent } from './operational-sections/operational-sections.component';
import { OperationsMapComponent } from './operation-details/operations-map/operations-map.component';
import { OperationsVehiclesComponent } from './operation-details/operations-vehicles/operations-vehicles.component';
import { OperationsVehicleItemComponent } from './operation-details/operations-vehicles/operations-vehicle-item/operations-vehicle-item.component';
import { VehiclesZoneComponent } from './operational-sections/vehicles-zone/vehicles-zone.component';

@NgModule({
    declarations: [
        OperationsTabletViewComponent,
        OperationalSectionContainerComponent,
        OperationalSectionsTabComponent,
        VehicleTagComponent,
        SectionLeaderSlotComponent,
        LocalOperationalLeaderComponent,
        OperationDetailsTabComponent,
        OperationsMapComponent,
        OperationsVehiclesComponent,
        OperationsVehicleItemComponent,
        VehiclesZoneComponent,
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
        ExerciseStateBadgeModule,
        SharedModule,
        FormsModule,
    ],
    exports: [OperationsTabletViewComponent],
})
export class OperationsTabletViewModule {}
