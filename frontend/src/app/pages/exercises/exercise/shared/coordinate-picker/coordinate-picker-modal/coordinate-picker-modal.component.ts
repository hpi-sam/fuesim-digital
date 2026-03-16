import { effect, signal, Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { toLonLat } from 'ol/proj';
import { FormsModule } from '@angular/forms';
import { OlMapManager } from '../../exercise-map/utility/ol-map-manager';
import { GeographicCoordinateDirective } from '../../../../../../shared/validation/geographic-coordinate-validator.directive';

@Component({
    selector: 'app-coordinate-picker-modal',
    templateUrl: './coordinate-picker-modal.component.html',
    styleUrls: ['./coordinate-picker-modal.component.scss'],
    imports: [FormsModule, GeographicCoordinateDirective],
})
export class CoordinatePickerModalComponent {
    activeModal = inject(NgbActiveModal);

    public readonly olMapManager = signal<OlMapManager | null>(null);

    public readonly latitude = signal('');
    public readonly longitude = signal('');

    constructor() {
        effect(() => {
            const olMapManager = this.olMapManager();
            if (olMapManager && !this.latitude()) {
                const center = olMapManager.getCoordinates();

                if (!center) return;

                const latLonCoordinates = toLonLat(center)
                    .reverse()
                    .map((coordinate) => coordinate.toFixed(6));

                this.latitude.set(latLonCoordinates[0]!);
                this.longitude.set(latLonCoordinates[1]!);
            }
        });
    }

    public goToCoordinates() {
        this.olMapManager()!.tryGoToCoordinates(
            +this.latitude(),
            +this.longitude()
        );
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }
}
