import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ChangeZIndexMapImageAction,
    MapImage,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { PopupService } from '../../utility/popup.service';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectMapImage } from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../../../../../state/application/selectors/shared.selectors';
import { ImageExistsValidatorDirective } from '../../../../../../../shared/validation/image-exists-validator.directive';
import { DisplayValidationComponent } from '../../../../../../../shared/validation/display-validation/display-validation.component';
import { IntegerValidatorDirective } from '../../../../../../../shared/validation/integer-validator.directive';
import { AppSaveOnTypingDirective } from '../../../../../../../shared/directives/app-save-on-typing.directive';

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
export class MapImagePopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly popupService = inject(PopupService);

    // These properties are only set after OnInit
    public mapImageId!: UUID;

    public mapImage$?: Observable<MapImage>;
    public readonly currentRole$ = this.store.select(selectCurrentMainRole);

    public url?: string;

    async ngOnInit() {
        this.mapImage$ = this.store.select(
            createSelectMapImage(this.mapImageId)
        );

        // Set the initial form values
        const mapImage = await firstValueFrom(this.mapImage$);
        this.url = mapImage.image.url;
    }

    public saveUrl() {
        this.exerciseService.proposeAction({
            type: '[MapImage] Reconfigure Url',
            mapImageId: this.mapImageId,
            newUrl: this.url!,
        });
    }

    public resizeImage(newHeight: number) {
        this.exerciseService.proposeAction({
            type: '[MapImage] Scale MapImage',
            mapImageId: this.mapImageId,
            newHeight,
        });
    }

    public setLocked(newLocked: boolean) {
        this.exerciseService.proposeAction({
            type: '[MapImage] Set isLocked',
            mapImageId: this.mapImageId,
            newLocked,
        });
    }

    public changeZIndex(mode: ChangeZIndexMapImageAction['mode']) {
        this.exerciseService.proposeAction({
            type: '[MapImage] Change zIndex',
            mapImageId: this.mapImageId,
            mode,
        });
    }

    public closePopup() {
        this.popupService.dismissPopup();
    }
}
