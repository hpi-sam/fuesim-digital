import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { toLonLat } from 'ol/proj';
import { OlMapManager } from '../../exercise-map/utility/ol-map-manager';

@Component({
    selector: 'app-coordinate-picker-modal',
    templateUrl: './coordinate-picker-modal.component.html',
    styleUrls: ['./coordinate-picker-modal.component.scss'],
    standalone: false,
})
export class CoordinatePickerModalComponent implements OnInit {
    @Input()
    public olMapManager!: OlMapManager;

    public latitude = '';
    public longitude = '';

    constructor(public activeModal: NgbActiveModal) {}

    ngOnInit() {
        const center = this.olMapManager.getCoordinates();

        if (!center) return;

        const latLonCoordinates = toLonLat(center)
            .reverse()
            .map((coordinate) => coordinate.toFixed(6));

        this.latitude = latLonCoordinates[0]!;
        this.longitude = latLonCoordinates[1]!;
    }

    public goToCoordinates() {
        this.olMapManager.tryGoToCoordinates(+this.latitude, +this.longitude);
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }
}
