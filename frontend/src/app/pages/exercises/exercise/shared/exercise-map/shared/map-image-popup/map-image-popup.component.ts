import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import type { MapImage, UUID } from 'fuesim-digital-shared';
import { PopupService } from '../../utility/popup.service';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectMapImage } from '../../../../../../../state/application/selectors/exercise.selectors';
import { ImageExistsValidatorDirective } from '../../../../../../../shared/validation/image-exists-validator.directive';
import { DisplayValidationComponent } from '../../../../../../../shared/validation/display-validation/display-validation.component';
import { IntegerValidatorDirective } from '../../../../../../../shared/validation/integer-validator.directive';
import { AppSaveOnTypingDirective } from '../../../../../../../shared/directives/app-save-on-typing.directive';

/* TODO @JohannesPotzi : correct imports. */
@Component({
    selector: 'app-map-image-popup',
    templateUrl: './map-image-popup.component.html',
    styleUrls: ['./map-image-popup.component.scss'],
    imports: [
        FormsModule,
        ImageExistsValidatorDirective,
        DisplayValidationComponent,
        IntegerValidatorDirective,
        AppSaveOnTypingDirective,
        AsyncPipe,
    ],
})
export class MapImagePopupComponent {
    private readonly popupService = inject(PopupService);

    public mapImageId!: UUID;

    public openScoutInfo!: boolean;

    public closePopup() {
        this.popupService.closePopup();
    }
}
