import { Component, input } from '@angular/core';
import type { ExerciseRadiogram } from 'fuesim-digital-shared';
import { RadiogramCardContentVehicleCountComponent } from '../radiogram-card-content-vehicle-count/radiogram-card-content-vehicle-count.component';
import { RadiogramCardContentVehicleOccupationsComponent } from '../radiogram-card-content-vehicle-occupations/radiogram-card-content-vehicle-occupations.component';
import { RadiogramCardContentPatientCountComponent } from '../radiogram-card-content-patient-count/radiogram-card-content-patient-count.component';
import { RadiogramCardContentTreatmentStatusComponent } from '../radiogram-card-content-treatment-status/radiogram-card-content-treatment-status.component';
import { RadiogramCardContentPersonnelCountComponent } from '../radiogram-card-content-personnel-count/radiogram-card-content-personnel-count.component';
import { RadiogramCardContentMaterialCountComponent } from '../radiogram-card-content-material-count/radiogram-card-content-material-count.component';
import { RadigoramCardContentMissingTransferConnectionComponent } from '../radiogram-card-content-missing-transfer-connection/radiogram-card-content-missing-transfer-connection.component';
import { RadigoramCardContentResourceRequestComponent } from '../radiogram-card-content-resource-request/radiogram-card-content-resource-request.component';
import { RadiogramCardContentTransferConnectionsComponent } from '../radiogram-card-content-transfer-connections/radiogram-card-content-transfer-connections.component';
import { RadiogramCardContentTransferCountsComponent } from '../radiogram-card-content-transfer-counts/radiogram-card-content-transfer-counts.component';
import { RadiogramCardContentTransferCategoryCompletedComponent } from '../radiogram-card-content-transfer-category-completed/radiogram-card-content-transfer-category-completed.component';
import { RadiogramCardContentTransportPatientCountRequestComponent } from '../radiogram-card-content-transport-patient-count-request/radiogram-card-content-transport-patient-count-request.component';
import { RadiogramCardContentFallbackComponent } from '../radiogram-card-content-fallback/radiogram-card-content-fallback.component';
import { RadiogramCardContentInformationUnavailableComponent } from '../radiogram-card-content-information-unavailable/radiogram-card-content-information-unavailable.component';

@Component({
    selector: 'app-radiogram-card-content',
    templateUrl: './radiogram-card-content.component.html',
    styleUrls: ['./radiogram-card-content.component.scss'],
    imports: [
        RadiogramCardContentVehicleCountComponent,
        RadiogramCardContentVehicleOccupationsComponent,
        RadiogramCardContentPatientCountComponent,
        RadiogramCardContentTreatmentStatusComponent,
        RadiogramCardContentPersonnelCountComponent,
        RadiogramCardContentMaterialCountComponent,
        RadigoramCardContentMissingTransferConnectionComponent,
        RadigoramCardContentResourceRequestComponent,
        RadiogramCardContentTransferConnectionsComponent,
        RadiogramCardContentTransferCountsComponent,
        RadiogramCardContentTransferCategoryCompletedComponent,
        RadiogramCardContentTransportPatientCountRequestComponent,
        RadiogramCardContentFallbackComponent,
        RadiogramCardContentInformationUnavailableComponent,
    ],
})
export class RadiogramCardContentComponent {
    readonly radiogram = input.required<ExerciseRadiogram>();
    readonly shownInSignallerModal = input(false);
}
