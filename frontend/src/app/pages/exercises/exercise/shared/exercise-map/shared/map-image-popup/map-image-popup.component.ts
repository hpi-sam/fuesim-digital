import { Component, inject } from '@angular/core';
import { PopupService } from '../../utility/popup.service';
import { MapImagesDetailsComponent } from '../../../../../../../shared/components/map-images-details/map-images-details.component';
import { UUID } from 'fuesim-digital-shared';

/* TODO @JohannesPotzi : correct imports. */
@Component({
    selector: 'app-map-image-popup',
    templateUrl: './map-image-popup.component.html',
    styleUrls: ['./map-image-popup.component.scss'],
    imports: [MapImagesDetailsComponent],
})
export class MapImagePopupComponent {
    private readonly popupService = inject(PopupService);

    public mapImageId!: UUID;

    public openScoutInfo!: boolean;

    public closePopup() {
        this.popupService.closePopup();
    }
}
