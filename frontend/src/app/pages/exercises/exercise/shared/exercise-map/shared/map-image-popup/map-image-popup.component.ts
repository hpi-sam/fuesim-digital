import { Component, inject } from '@angular/core';
import { UUID } from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { PopupService } from '../../utility/popup.service';
import { MapImagesDetailsComponent } from '../../../../../../../shared/components/map-images-details/map-images-details.component';
import { selectCurrentMainRole } from '../../../../../../../state/application/selectors/shared.selectors';
import { AppState } from '../../../../../../../state/app.state';

@Component({
    selector: 'app-map-image-popup',
    templateUrl: './map-image-popup.component.html',
    styleUrls: ['./map-image-popup.component.scss'],
    imports: [MapImagesDetailsComponent],
})
export class MapImagePopupComponent {
    private readonly popupService = inject(PopupService);
    private readonly store = inject<Store<AppState>>(Store);

    public mapImageId!: UUID;

    public openScoutInfo!: boolean;

    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);

    public closePopup() {
        this.popupService.dismissPopup();
    }
}
